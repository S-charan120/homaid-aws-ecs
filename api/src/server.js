const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
const { services, validateBooking, canTransition } = require('./domain');

const app = express();
app.set('trust proxy', 1); // API is reachable only through the trusted Nginx reverse proxy.
const port = Number(process.env.PORT || 8081);
const adminToken = process.env.ADMIN_API_TOKEN;
let client;
let db;
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb', strict: true }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowed = (process.env.WEB_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Booking-Token, X-Admin-Token, Idempotency-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/bookings', rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false }));

function requireDb(req, res, next) {
  if (!db) return res.status(503).json({ error: 'database unavailable' });
  next();
}
function requireAdmin(req, res, next) {
  const supplied = req.get('x-admin-token') || '';
  const expected = adminToken || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'administrator authentication required' });
  next();
}
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'homaid-api' }));
app.get('/ready', (_req, res) => db ? res.json({ status: 'ready' }) : res.status(503).json({ status: 'not-ready' }));
app.get('/api/services', (_req, res) => res.json({ items: services }));
app.get('/api/services/:id', (req, res) => {
  const item = services.find(s => s.id === req.params.id);
  return item ? res.json(item) : res.status(404).json({ error: 'service not found' });
});
app.post('/api/bookings', requireDb, async (req, res, next) => {
  try {
    const errors = validateBooking(req.body);
    if (errors.length) return res.status(400).json({ error: 'validation failed', details: errors });
    const bookingId = crypto.randomUUID();
    const accessToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const idempotencyKey = req.get('idempotency-key');
    const item = {
      bookingId, serviceId: req.body.serviceId,
      customerName: req.body.customerName.trim(), customerEmail: req.body.customerEmail.trim().toLowerCase(),
      address: req.body.address.trim(), scheduledAt: new Date(req.body.scheduledAt).toISOString(),
      notes: (req.body.notes || '').trim(), status: 'requested', createdAt: new Date().toISOString(), tokenHash,
      ...(idempotencyKey ? { idempotencyKey } : {})
    };
    await db.collection('bookings').insertOne(item);
    return res.status(201).json({ bookingId, accessToken, status: item.status, createdAt: item.createdAt });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'duplicate idempotency key' });
    return next(err);
  }
});
app.get('/api/bookings/:id', requireDb, async (req, res, next) => {
  try {
    const token = req.get('x-booking-token') || '';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const item = await db.collection('bookings').findOne({ bookingId: req.params.id, tokenHash }, { projection: { _id: 0, tokenHash: 0, idempotencyKey: 0 } });
    return item ? res.json(item) : res.status(404).json({ error: 'booking not found' });
  } catch (err) { return next(err); }
});
app.patch('/api/bookings/:id/status', requireDb, requireAdmin, async (req, res, next) => {
  try {
    const nextStatus = req.body && req.body.status;
    const current = await db.collection('bookings').findOne({ bookingId: req.params.id });
    if (!current) return res.status(404).json({ error: 'booking not found' });
    if (!canTransition(current.status, nextStatus)) return res.status(409).json({ error: 'invalid booking state transition', from: current.status, to: nextStatus });
    const updatedAt = new Date().toISOString();
    const result = await db.collection('bookings').findOneAndUpdate(
      { bookingId: req.params.id, status: current.status },
      { $set: { status: nextStatus, updatedAt } },
      { returnDocument: 'after', projection: { _id: 0, tokenHash: 0, idempotencyKey: 0 } }
    );
    if (!result) return res.status(409).json({ error: 'booking changed concurrently; retry after refresh' });
    return res.json(result);
  } catch (err) { return next(err); }
});
app.use((err, _req, res, _next) => {
  console.error(JSON.stringify({ level: 'error', message: err.message, name: err.name }));
  if (err instanceof SyntaxError && err.status === 400) return res.status(400).json({ error: 'invalid JSON' });
  return res.status(500).json({ error: 'internal server error' });
});

async function start() {
  if (!process.env.MONGODB_URI || !process.env.ADMIN_API_TOKEN) throw new Error('MONGODB_URI and ADMIN_API_TOKEN are required');
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 20 });
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'homaid');
  await db.collection('bookings').createIndexes([
    { key: { bookingId: 1 }, unique: true },
    { key: { idempotencyKey: 1 }, unique: true, sparse: true },
    { key: { createdAt: -1 } }
  ]);
  const server = app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ level: 'info', event: 'api_started', port })));
  const shutdown = async signal => {
    console.log(JSON.stringify({ level: 'info', event: 'shutdown', signal }));
    server.close(async () => { try { await client.close(); process.exit(0); } catch { process.exit(1); } });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}
if (require.main === module) start().catch(err => { console.error(err); process.exit(1); });
module.exports = { app, start };
