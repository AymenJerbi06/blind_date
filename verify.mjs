import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Verify domain behavior without a browser or network dependencies.
let clock = Date.parse('2026-10-27T12:00:00Z');
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}
const store = new Map();
const app = { innerHTML: '' };
const modal = { innerHTML: '', addEventListener() {}, contains() { return false; }, querySelector() { return null; } };
const context = vm.createContext({
  Date: TestDate, Intl, structuredClone, assert,
  setClock(value) { clock = Date.parse(value); },
  localStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) },
  document: { querySelector: selector => selector === '#app' ? app : selector === '#modal-root' ? modal : null, addEventListener() {} },
  setInterval() {}, setTimeout() {}, clearTimeout() {},
});
const source = await readFile(new URL('./dist/app.js', import.meta.url), 'utf8');
vm.runInContext(source + `
  assert.equal(currentMatch().id, '021', 'Shared values and interests should prioritize the closest personality fit');
  assert.ok(eligibleMatches({...state.profile, meet:'Woman'}).every(person => person.gender === 'Woman'));
  assert.equal(eligibleMatches({...state.profile, radius:5}).length, 0, 'Do not silently widen a distance dealbreaker');
  assert.equal(eligibleMatches({...state.profile, minAge:70, maxAge:90}).length, 0, 'An empty pool is a valid outcome');
  assert.ok(eligibleMatches({...state.profile, minAge:27, maxAge:30}).every(person => person.age >= 27 && person.age <= 30));
  assert.equal(esc('<script>"&'), '&lt;script&gt;&quot;&amp;', 'Escape user content before inserting HTML');
  modal = {dayIndex:0, time:'18:30'};
  assert.equal(new Date(selectedTimestamp()).toISOString(), '2026-11-02T02:30:00.000Z', 'Preserve Vancouver wall time across the fall DST change');
  const fallDeadline = selectedTimestamp() - 86400000;
  assert.match(timeLabel(fallDeadline), /7:30/, 'A 24-hour deadline is elapsed time, including DST transitions');
  setClock('2027-03-09T12:00:00Z');
  assert.equal(new Date(selectedTimestamp()).toISOString(), '2027-03-15T01:30:00.000Z', 'Preserve Vancouver wall time across the spring DST change');
  const booking = {timestamp: 200000000};
  const cutoff = booking.timestamp - 86400000;
  assert.equal(cancellationFee(booking,'Plans changed',cutoff), 0, 'Cancellation exactly 24 hours before is free');
  assert.equal(cancellationFee(booking,'Plans changed',cutoff+1), 20, 'The late window starts after the cutoff');
  assert.equal(cancellationFee(booking,'Safety concern',cutoff+1), 0, 'Safety concerns are exempt');
  assert.equal(cancellationFee(booking,'Emergency',cutoff+1), 0, 'Emergencies are exempt');
`, context);
console.log('Passed 13 checks: matching constraints, escaping, Vancouver DST scheduling, and cancellation boundaries/exemptions.');
