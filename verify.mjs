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
const modal = { innerHTML: '', addEventListener() {}, contains() { return false; }, querySelector() { return null; }, querySelectorAll() { return []; } };
const context = vm.createContext({
  Date: TestDate, Intl, structuredClone, assert,
  setClock(value) { clock = Date.parse(value); },
  localStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) },
  document: { body: {style:{}}, querySelector: selector => selector === '#app' ? app : selector === '#modal-root' ? modal : null, addEventListener() {} },
  setInterval() {}, setTimeout() {}, clearTimeout() {},
});
const source = await readFile(new URL('./dist/core.js', import.meta.url), 'utf8') + '\n' + await readFile(new URL('./dist/app.js', import.meta.url), 'utf8');
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
  assert.equal(Object.keys(profileErrors({...state.profile,name:'  '},0))[0], 'name');
  assert.equal(profileErrors({...state.profile,name:'  María-José  '},0).name, undefined, 'Names accept spaces, hyphens and accents');
  assert.ok(profileErrors({...state.profile,age:17},0).age, 'Reject minors');
  assert.ok(profileErrors({...state.profile,age:25.5},0).age, 'Reject fractional ages');
  assert.ok(profileErrors({...state.profile,interests:[]},1).interests);
  assert.ok(profileErrors({...state.profile,values:[]},1).values);
  assert.ok(profileErrors({...state.profile,minAge:35,maxAge:22},2).maxAge, 'Explain reversed ranges without silently changing them');
  assert.equal(profileErrors({...state.profile,minAge:22,maxAge:35},2).maxAge, undefined);
  assert.ok(filteredVenues('Under $30','No restrictions').every(venue=>venue.price<30));
  assert.ok(filteredVenues('Gluten-free','No restrictions').every(venue=>venue.tags.includes('Gluten-free')));
  assert.equal(filteredVenues('All spots','Vegan')[0].id,'fig', 'Restrict the vegan sample preference to the plant-based fixture');
  const planDraft = {step:2,venueId:'juniper',time:'18:30',dayIndex:0,days:availableDays(),matchId:'021',consent:true};
  assert.equal(validPlannerDraft(planDraft).consent,false,'Reopening a draft always requires fresh booking consent');
  assert.equal(validPlannerDraft({...planDraft,time:'03:05'}),null,'Reject unsupported saved times');
  assert.equal(validPlannerDraft({...planDraft,days:[1,2,3,4]}),null,'Discard expired availability');
  assert.equal(validPlannerDraft({...planDraft,venueId:'unverified-id'}),null);
  assert.equal(validProfileDraft({step:1,draft:{...state.profile,name:'María'}}).step,1,'Preserve the real unfinished setup step');
  assert.equal(validProfileDraft({step:9,draft:state.profile}),null);
  localStorage.setItem(storageKey,'{bad json');
  assert.equal(readState().profile.name,'Alex','Corrupt browser storage must not crash the app');
  localStorage.setItem(storageKey,JSON.stringify({version:1,profile:{...state.profile,name:'Sam'},view:'unrecognized',booking:{venueId:'invented',timestamp:1,matchId:'021'}}));
  const recovered = readState();
  assert.equal(recovered.view,'home');
  assert.equal(recovered.booking,null);
  assert.equal(recovered.profile.name,'Sam','Recover usable profile data independently');
  state = defaultState();
  const home = homePage();
  assert.equal((home.match(/class="button primary"/g)||[]).length,1,'Discover has one dominant call to action');
  assert.equal(navItems.length,4,'Use four familiar navigation destinations');
  assert.ok(!home.includes('online-dot')&&!home.includes('notification-dot'),'Do not fabricate activity indicators');
  const planner = {type:'planner',step:0,filter:'All spots',showAll:false,venueId:'juniper',dayIndex:0,time:'18:30',days:availableDays(),consent:false,matchId:'021'};
  modal = {...planner};
  assert.equal((plannerModal().match(/data-action="venue-select"/g)||[]).length,3,'Initially show three venue suggestions');
  modal.showAll = true;
  assert.equal((plannerModal().match(/data-action="venue-select"/g)||[]).length,5,'All five venues remain available');
  modal.step = 2;
  assert.match(plannerModal(),/data-action="planner-next" disabled/,'Consent is required before demo confirmation');
  modal = {type:'onboarding',step:1,draft:{...state.profile,name:'María-José'}};
  persistDraft();
  assert.equal(state.drafts.profile.step,1,'Leaving setup preserves the actual step');
  assert.equal(state.drafts.profile.draft.name,'María-José','Leaving setup preserves typed answers');
  assert.ok(!profilePage().includes('60%'),'Do not invent a completion percentage');
  state.plan='annual';
  assert.ok(membershipPage().includes('C$299.99 billed upfront each year'),'Annual total and billing period are explicit');
  assert.ok(membershipPage().includes('C$25.00/month'),'Show annual equivalent alongside the actual charge');
  assert.equal(firstInvalidProfileStep({...state.profile,age:17}).step,0,'Editing preferences cannot bypass adult-age validation');
  assert.equal(firstInvalidProfileStep({...state.profile,name:'  '}).step,0,'Final save rechecks earlier draft fields');
  assert.equal(firstInvalidProfileStep({...state.profile,values:[]}).step,1);
  assert.equal(firstInvalidProfileStep({...state.profile,minAge:40,maxAge:25}).step,2);
  assert.equal(firstInvalidProfileStep(state.profile),null);
`, context);
console.log('Passed 50 checks: matching, validation, recovery, saved progress, venue disclosure, consent, pricing clarity, Vancouver DST scheduling, and cancellation rules.');
