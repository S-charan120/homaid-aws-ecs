const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../src/server');

async function withServer(t, run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  await run(`http://127.0.0.1:${server.address().port}`);
}

test('health endpoint responds without MongoDB credentials', async t => {
  await withServer(t, async base => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'homaid-api' });
  });
});

test('readiness returns 503 until MongoDB is connected', async t => {
  await withServer(t, async base => {
    const response = await fetch(`${base}/ready`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'not-ready' });
  });
});

test('malformed JSON is rejected with a client error', async t => {
  await withServer(t, async base => {
    const response = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid JSON' });
  });
});
