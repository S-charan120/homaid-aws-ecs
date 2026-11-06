const test = require('node:test');
const assert = require('node:assert/strict');
const { services, validateBooking, canTransition } = require('../src/domain');

test('service catalogue has unique stable identifiers', () => {
  assert.ok(services.length >= 3);
  assert.equal(new Set(services.map(s => s.id)).size, services.length);
});
test('booking validation accepts a valid future booking', () => {
  const input = { serviceId: 'cleaning', customerName: 'A Customer', customerEmail: 'a@example.com', address: '12 Example Street', scheduledAt: new Date(Date.now() + 86_400_000).toISOString() };
  assert.deepEqual(validateBooking(input), []);
});
test('booking validation rejects unknown services and malformed contact fields', () => {
  const input = { serviceId: 'unknown', customerName: 'x', customerEmail: 'not-an-email', address: 'short', scheduledAt: 'bad-date' };
  assert.ok(validateBooking(input).length >= 4);
});
test('booking lifecycle permits only defined forward transitions', () => {
  assert.equal(canTransition('requested', 'confirmed'), true);
  assert.equal(canTransition('confirmed', 'in_progress'), true);
  assert.equal(canTransition('in_progress', 'completed'), true);
  assert.equal(canTransition('completed', 'requested'), false);
  assert.equal(canTransition('cancelled', 'confirmed'), false);
});
