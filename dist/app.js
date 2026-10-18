/* Frontend prototype: all introductions, availability and bookings are fictional. */
const storageKey = 'blinddate-demo-v1';
const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal-root');
const navItems = [['home', 'Discover', 'spark'], ['dates', 'Dates', 'calendar'], ['profile', 'Profile', 'user'], ['membership', 'Membership', 'crown']];
const timeOptions = ['12:00', '17:30', '18:30', '19:00'];
const defaultState = () => ({
  version: 1, view: 'home', matchIndex: 0, booking: null, plan: 'monthly', previewPlan: null,
  drafts: { profile: null, planner: null },
  profile: { name: 'Alex', age: 25, gender: 'Not specified', meet: 'Everyone', intent: 'A long-term relationship', radius: 40, minAge: 22, maxAge: 32, interests: ['Outdoors', 'Animals', 'Slow Sundays'], values: ['Kindness', 'Curiosity'], diet: 'No restrictions', politics: 'Prefer not to say', smoking: 'Flexible', complete: false },
});
function readState() {
  const base = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.version !== 1 || !saved.profile || typeof saved.profile !== 'object') return base;
    const p = saved.profile;
    const normalized = { ...base.profile };
    if (typeof p.name === 'string' && p.name.trim()) normalized.name = p.name.trim().slice(0, 40);
    for (const key of ['age', 'minAge', 'maxAge']) if (Number.isInteger(p[key]) && p[key] >= 18 && p[key] <= 100) normalized[key] = p[key];
    if (normalized.minAge > normalized.maxAge) { normalized.minAge = base.profile.minAge; normalized.maxAge = base.profile.maxAge; }
    if (Number.isFinite(p.radius) && p.radius >= 5 && p.radius <= 50) normalized.radius = p.radius;
    const enums = { gender: ['Not specified', 'Man', 'Woman', 'Non-binary'], meet: ['Everyone', 'Man', 'Woman', 'Non-binary'], intent: ['A long-term relationship', 'Open to exploring'], diet: ['No restrictions', 'Vegetarian', 'Vegan', 'Gluten-free'], politics: ['Prefer not to say', 'Similar views matter to me', 'Open to different views'], smoking: ['Flexible', 'Non-smoker only'] };
    for (const key of Object.keys(enums)) if (enums[key].includes(p[key])) normalized[key] = p[key];
    if (Array.isArray(p.interests)) normalized.interests = [...new Set(p.interests.filter(x => interestOptions.includes(x)))];
    if (Array.isArray(p.values)) normalized.values = [...new Set(p.values.filter(x => valueOptions.includes(x)))];
    normalized.complete = p.complete === true;
    const validBooking = saved.booking && venues.some(v => v.id === saved.booking.venueId) && Number.isFinite(saved.booking.timestamp) && candidates.some(c => c.id === saved.booking.matchId);
    const drafts = saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : base.drafts;
    return { ...base, profile: normalized, view: navItems.some(([view]) => view === saved.view) ? saved.view : 'home', booking: validBooking ? saved.booking : null, matchIndex: Number.isInteger(saved.matchIndex) && saved.matchIndex >= 0 ? saved.matchIndex : 0, plan: saved.plan === 'annual' ? 'annual' : 'monthly', previewPlan: ['annual', 'monthly'].includes(saved.previewPlan) ? saved.previewPlan : null, drafts: { profile: validProfileDraft(drafts.profile), planner: validPlannerDraft(drafts.planner) } };
  } catch { return base; }
}
function validProfileDraft(draft) {
  if (!draft || !Number.isInteger(draft.step) || draft.step < 0 || draft.step > 2 || !draft.draft || typeof draft.draft.name !== 'string') return null;
  if (!Array.isArray(draft.draft.interests) || !Array.isArray(draft.draft.values)) return null;
  return { step: draft.step, draft: { ...defaultState().profile, ...draft.draft, interests: draft.draft.interests.filter(x => interestOptions.includes(x)), values: draft.draft.values.filter(x => valueOptions.includes(x)) } };
}
function validPlannerDraft(draft) {
  if (!draft || !venues.some(v => v.id === draft.venueId) || !Number.isInteger(draft.step) || draft.step < 0 || draft.step > 2 || !timeOptions.includes(draft.time)) return null;
  if (!Number.isInteger(draft.dayIndex) || draft.dayIndex < 0 || draft.dayIndex > 3 || !Array.isArray(draft.days) || draft.days.length !== 4 || !draft.days.every(Number.isFinite)) return null;
  if (draft.days[draft.dayIndex] < Date.now() + 72 * 3600000 || !candidates.some(c => c.id === draft.matchId)) return null;
  return { ...draft, filter: ['All spots', 'Vegetarian', 'Gluten-free', 'Under $30'].includes(draft.filter) ? draft.filter : 'All spots', consent: false };
}
let state = readState();
let modal = null;
let lastFocus = null;
let toastTimer;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { toast('This browser could not save your progress. You can keep exploring.'); }
}
function eligibleMatches(profile = state.profile) {
  return candidates.filter(person => (profile.meet === 'Everyone' || person.gender === profile.meet) && person.age >= profile.minAge && person.age <= profile.maxAge && person.km <= profile.radius && (profile.smoking !== 'Non-smoker only' || !person.smoking) && (profile.intent === 'Open to exploring' || person.intent === profile.intent))
    .map(person => ({ ...person, score: person.interests.filter(x => profile.interests.includes(x)).length * 2 + person.values.filter(x => profile.values.includes(x)).length * 3 }))
    .sort((a, b) => b.score - a.score);
}
function currentMatch() { const matches = eligibleMatches(); return matches.length ? matches[state.matchIndex % matches.length] : null; }
function matchTags() { const match = currentMatch(); return match ? state.profile.interests.filter(x => match.interests.includes(x)).slice(0, 3) : []; }
function venueById(id) { return venues.find(v => v.id === id) || venues[0]; }
function dateLabel(timestamp, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'America/Vancouver' }).format(new Date(timestamp)); }
function timeLabel(timestamp) { return new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(timestamp)); }
function displayTime(time) { const [h, m] = time.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
function availableDays() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => +parts.find(p => p.type === type).value;
  const today = Date.UTC(get('year'), get('month') - 1, get('day'), 20);
  return [5, 6, 7, 9].map(offset => today + offset * 86400000);
}
function selectedTimestamp() {
  const day = (modal.days || availableDays())[modal.dayIndex ?? 0];
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(day));
  const get = type => +parts.find(p => p.type === type).value;
  const [hour, minute] = (modal.time || '18:30').split(':').map(Number);
  const wallTime = Date.UTC(get('year'), get('month') - 1, get('day'), hour, minute);
  let timestamp = wallTime + 8 * 3600000;
  for (let i = 0; i < 2; i++) {
    const local = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(timestamp));
    const value = t => +local.find(p => p.type === t).value;
    timestamp += wallTime - Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'));
  }
  return timestamp;
}
function cancellationFee(booking, reason, now = Date.now()) { return now <= booking.timestamp - 86400000 || ['Safety concern', 'Emergency'].includes(reason) ? 0 : 20; }
function toast(message) {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message; element.classList.add('visible'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4200);
}
function button(label, action, variant = 'primary', extra = '', graphic = 'arrow') { return `<button class="button ${variant}" data-action="${action}" ${extra}>${label}${graphic ? icon(graphic) : ''}</button>`; }
function navMarkup() {
  return navItems.map(([view, label, graphic]) => `<button class="nav-button ${state.view === view ? 'active' : ''}" data-action="navigate" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ''}>${icon(graphic)}<span>${label}</span>${view === 'dates' && state.booking ? '<span class="nav-dot" aria-label="One confirmed demo date"></span>' : ''}</button>`).join('');
}
function render() {
  const titles = { home: 'Discover', dates: 'Your dates', profile: 'Your profile', membership: 'Membership' };
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar"><button class="wordmark" data-action="navigate" data-view="home" aria-label="blinddate home">${brand}<span>blinddate<span class="brand-period">.</span></span></button>
      <nav class="desktop-nav" aria-label="Main navigation">${navMarkup()}</nav>
      <div class="sidebar-end"><div class="sidebar-note">A real connection.<br>A little less scrolling.</div><button class="help-link" data-action="safety">${icon('shield')} Safety & support</button><span class="prototype-label">INTERACTIVE PROTOTYPE</span></div>
    </aside>
    <div class="main-shell"><header class="topbar"><span class="section-name">${titles[state.view]}</span><button class="wordmark mobile-brand" data-action="navigate" data-view="home" aria-label="blinddate home">${brand}<span>blinddate<span class="brand-period">.</span></span></button><div class="top-actions"><span class="demo-badge">DEMO</span><button class="location-control" data-action="preferences">${icon('pin')} Vancouver, BC ${icon('down')}</button><button class="avatar" data-action="navigate" data-view="profile" aria-label="Open profile">${esc(state.profile.name.charAt(0).toUpperCase())}</button></div></header>
    <main id="page-content">${({ home: homePage, dates: datePage, profile: profilePage, membership: membershipPage }[state.view])()}</main>
    <footer class="app-footer"><span>${icon('lock')} Sample people. Fictional venues. No real bookings or payments.</span><button data-action="safety">Privacy & safety ${icon('chevron')}</button></footer></div>
    <nav class="mobile-nav" aria-label="Mobile navigation">${navMarkup()}</nav></div>`;
  updateCountdown();
}
function pageHeading(kicker, title, description = '', action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1 class="page-title" tabindex="-1">${title}</h1>${description ? `<p class="page-description">${description}</p>` : ''}</div>${action}</div>`;
}
function matchArtwork() {
  return `<div class="match-art" aria-hidden="true"><span class="art-label">CONNECTION BEFORE FIRST IMPRESSIONS</span><svg class="connection-art" viewBox="0 0 600 245"><g fill="none" stroke="#726a9e" stroke-width="1" opacity=".3"><ellipse cx="300" cy="130" rx="245" ry="78" transform="rotate(-16 300 130)"/><ellipse cx="300" cy="130" rx="210" ry="107" transform="rotate(14 300 130)"/></g><g transform="translate(201 25) rotate(-13 100 100)"><path d="M100 185C86 174 6 119 6 64 6 4 76-7 100 46 124-7 194 4 194 64c0 55-80 110-94 121Z" fill="#1f2023"/><path d="M100 46c-11 25-6 42 8 52s7 39-8 87" stroke="#ddd9f4" stroke-width="4" fill="none"/><path d="m46 66 28 8m63 1 15-19" stroke="#ddd9f4" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(386 45) rotate(12)"><rect width="138" height="39" rx="19.5" fill="#fffefb"/><text x="69" y="25" font-family="Arial,sans-serif" font-size="13" text-anchor="middle" fill="#2d2a36">A little mystery.</text></g><g transform="translate(80 164) rotate(-9)"><rect width="131" height="39" rx="19.5" fill="#edff9a"/><text x="65" y="25" font-family="Arial,sans-serif" font-size="13" text-anchor="middle" fill="#2d2a36">A real possibility.</text></g><path d="m142 60 4 13 13 4-13 4-4 13-4-13-13-4 13-4Zm341 109 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" fill="#625683"/></svg><span class="art-caption">More than a first impression.</span></div>`;
}
function homePage() {
  const match = currentMatch();
  const tags = matchTags();
  const profileDraft = state.drafts.profile;
  const booked = Boolean(state.booking);
  return `${pageHeading('LESS SWIPING. MORE SHOWING UP.', 'Good chemistry.<br>A little <span class="heading-accent">mystery.</span>', 'Meet through what matters. Discover the rest in person.', '<button class="preferences-button" data-action="preferences">'+icon('settings')+' Preferences</button>')}
    <div class="discover-grid"><article class="introduction-card" aria-labelledby="introduction-title">
      <div class="card-topline"><span>${icon('spark')} ${booked ? 'YOUR CONNECTION' : 'YOUR INTRODUCTION'}</span><span class="subtle-label">Sample match${match ? ' #'+match.id : ''}</span></div>
      ${matchArtwork()}
      <div class="introduction-content"><div class="intro-title-row"><h2 id="introduction-title">${booked ? 'You’ve got a date.' : match ? 'Someone who gets your kind of life.' : 'Your preferences come first.'}</h2><span class="round-heart">${icon('heart')}</span></div>
      <p class="intro-description">${booked ? 'The place and time are set. See the details and make it your own.' : match ? 'Shared intentions. A few things in common. A whole person to discover.' : 'No sample person fits these preferences yet. You can adjust them whenever you’re ready.'}</p>
      ${match ? `<div class="shared-interests" aria-label="Shared interests">${tags.length ? tags.map((tag, i) => `<span>${icon(['mountain','heart','coffee'][i])}${esc(tag)}</span>`).join('') : '<span>'+icon('heart')+'Compatible intentions</span>'}</div>` : ''}
      <div class="match-actions">${match && !booked ? `<button class="skip-button" data-action="skip-match" aria-label="Pass on this sample introduction">${icon('close')}</button>` : ''}${button(booked ? 'View your date' : match ? (state.drafts.planner ? 'Continue planning' : 'Plan a date') : 'Adjust preferences', booked ? 'navigate' : match ? 'plan' : 'preferences', 'primary', booked ? 'data-view="dates"' : '')}</div>
      <div class="intro-bottom"><span>${booked ? icon('check')+' Demo date confirmed' : 'Your first introduction is free.'}</span>${match && !booked ? '<button class="text-button" data-action="why">Why this match? '+icon('chevron')+'</button>' : ''}</div>
      </div></article>
      <aside class="discovery-aside"><section class="next-steps"><p class="eyebrow">FROM A MAYBE TO A MEETING</p><h2>A date.<br>Without the back-and-forth.</h2><ol class="journey-list"><li class="current"><span class="journey-number">01</span><div><h3>Find your connection</h3><p>Personality first. Profiles stay private.</p></div></li><li><span class="journey-number">02</span><div><h3>Pick a place & time</h3><p>Shared availability. Somewhere you’ll both like.</p></div></li><li><span class="journey-number">03</span><div><h3>Meet in the real world</h3><p>No endless chats. Just a first hello.</p></div></li></ol><div class="first-date-note">${icon('coffee')}<div><strong>The first introduction is on us.</strong><p>Food and drinks are paid separately.</p></div></div></section>
      ${!state.profile.complete ? `<section class="setup-reminder"><div class="setup-icon">${icon('user')}</div><div><h3>${profileDraft ? 'Pick up where you left off.' : 'Make this more you.'}</h3><p>${profileDraft ? 'Your answers are saved. Resume at step '+(profileDraft.step+1)+' of 3.' : 'Add your interests and what you’re looking for.'}</p><button class="text-button" data-action="onboarding">${profileDraft ? 'Resume profile' : 'Personalize your match'} ${icon('arrow')}</button></div></section>` : `<section class="setup-reminder"><div class="setup-icon">${icon('check')}</div><div><h3>Your preferences are saved.</h3><p>You can update them any time.</p><button class="text-button" data-action="preferences">Edit preferences ${icon('arrow')}</button></div></section>`}
      <button class="comfort-link" data-action="safety">${icon('shield')} Your pace. Your choice. ${icon('chevron')}</button></aside></div>`;
}
function datePage() {
  if (!state.booking) return `${pageHeading('MAKE IT A REAL-WORLD HELLO.', 'Your next date<br>starts <span class="heading-accent">here.</span>')}<section class="empty-state panel"><span class="empty-icon">${icon('calendar')}</span><h2>No date planned. No pressure.</h2><p>When an introduction feels right, choose a place and a time. Your plans will live here.</p>${button(state.drafts.planner ? 'Continue planning' : 'See your introduction', state.drafts.planner ? 'plan' : 'navigate', 'primary', state.drafts.planner ? '' : 'data-view="home"')}</section>`;
  const b = state.booking, v = venueById(b.venueId);
  return `${pageHeading('ONE LESS THING TO OVERTHINK.', 'You’re <span class="heading-accent">all set.</span>', 'Your demo date is confirmed. Here’s everything in one place.')}
    <div class="details-grid"><article class="booking-card panel"><img class="booking-photo" src="assets/${v.photo}" alt="Illustrative dining space for ${esc(v.name)}"><div class="booking-body"><span class="success-pill">${icon('check')} Demo date confirmed</span><h2>${esc(v.name)}</h2><p class="muted">With your mystery match #${esc(b.matchId)}</p><div class="itinerary"><div>${icon('calendar')}<div><strong>${dateLabel(b.timestamp, { weekday:'long', month:'long', day:'numeric' })}</strong><span>${timeLabel(b.timestamp)} · Vancouver time</span></div></div><div>${icon('pin')}<div><strong>${esc(v.area)}, Vancouver</strong><span>Fictional sample venue</span></div></div><div>${icon('coffee')}<div><strong>About C$${v.price} per person</strong><span>Food and drinks paid separately</span></div></div></div>${button('Copy date details', 'share', 'primary', '', 'copy')}<p class="caption">This is a simulated booking. No restaurant reservation has been made.</p></div></article>
    <aside class="booking-aside"><section class="panel countdown-panel"><span class="eyebrow">UNTIL YOUR FIRST HELLO</span><p class="countdown" data-countdown></p><hr><h3>Need to change your plans?</h3><p class="body-small">Cancel free until <strong>${dateLabel(b.timestamp-86400000)} at ${timeLabel(b.timestamp-86400000)} PT.</strong></p><p class="body-small">After that, the example fee is C$20. Safety concerns and emergencies are exempt.</p><div class="manage-actions">${button('Reschedule', 'reschedule', 'secondary', '', 'calendar')}${button('Cancel date', 'cancel', 'plain', '', 'close')}</div><p class="caption">No actual charges in this prototype.</p></section><button class="comfort-link" data-action="safety">${icon('shield')} Share your plans. Trust your instincts. ${icon('chevron')}</button></aside></div>`;
}
function profilePage() {
  const p = state.profile, draft = state.drafts.profile;
  return `${pageHeading('YOU BRING THE PERSONALITY.', 'Your profile.<br>Your <span class="heading-accent">preferences.</span>', 'These answers shape your introductions. Your full profile stays private.')}
    <div class="details-grid"><section class="panel profile-panel"><div class="profile-top"><span class="profile-avatar">${esc(p.name.charAt(0).toUpperCase())}</span><div><h2>${esc(p.name)}, ${p.age}</h2><p class="muted">Vancouver, BC</p></div>${button('Edit', 'onboarding', 'secondary', '', 'edit')}</div><div class="profile-status">${icon(p.complete ? 'check' : 'user')} ${p.complete ? 'Profile setup complete' : draft ? 'Setup saved at step '+(draft.step+1)+' of 3' : 'Sample profile · setup not completed'}</div><section class="profile-section"><h3>Your interests</h3><div class="chip-list">${p.interests.map(x=>`<span class="static-chip">${esc(x)}</span>`).join('')}</div></section><section class="profile-section"><h3>What matters to you</h3><p>${p.values.map(esc).join(' · ') || 'Add the qualities you value.'}</p></section><section class="profile-section"><h3>Your connection preferences</h3><dl class="profile-details"><div><dt>Looking for</dt><dd>${esc(p.intent)}</dd></div><div><dt>Interested in</dt><dd>${esc(p.meet)}</dd></div><div><dt>Age range</dt><dd>${p.minAge}–${p.maxAge}</dd></div><div><dt>Travel radius</dt><dd>Up to ${p.radius} km</dd></div><div><dt>Dietary needs</dt><dd>${esc(p.diet)}</dd></div><div><dt>Smoking preference</dt><dd>${esc(p.smoking)}</dd></div></dl></section></section><aside><section class="panel privacy-panel">${icon('lock')}<h2>Private by design.</h2><p>Your photo and full profile aren’t shown to your match. Your political preferences are optional.</p><p>This prototype saves preferences in this browser. Live matchmaking and identity checks aren’t connected.</p><button class="text-button" data-action="safety">Privacy & safety ${icon('arrow')}</button></section><section class="reset-section"><h3>Reset the prototype</h3><p>Clear demo preferences, saved progress and your demo date from this browser.</p>${button('Reset demo', 'reset', 'secondary', '', 'logout')}</section></aside></div>`;
}
function membershipPage() {
  const annual = state.plan === 'annual';
  return `${pageHeading('MORE INTRODUCTIONS. SAME INTENTION.', 'Find your person.<br>At your <span class="heading-accent">pace.</span>', 'Try your first introduction free. Choose a plan only when you want another.')}
    <section class="membership-layout"><div class="free-banner">${icon('coffee')}<div><strong>Your first introduction: C$0</strong><span>Matching and planning included. Food and drinks separate. No automatic subscription.</span></div></div>
    <div class="membership-panel panel"><div class="plan-switch" role="group" aria-label="Billing interval"><button data-action="billing" data-value="monthly" aria-pressed="${!annual}" class="${!annual?'selected':''}">Monthly</button><button data-action="billing" data-value="annual" aria-pressed="${annual}" class="${annual?'selected':''}">Yearly</button></div><div class="membership-columns"><div><p class="eyebrow">BLINDDATE MEMBERSHIP</p><div class="price">C$${annual?'299.99':'29.99'}<span> / ${annual?'year':'month'}</span></div><p class="billing-description">${annual?'C$299.99 billed upfront each year.<br>Equivalent to C$25.00/month; about 17% less than 12 monthly payments.':'C$29.99 billed monthly.<br>Cancel renewal any time.'}</p><p class="caption">CAD before tax. Meals and drinks are separate.</p></div><div><ul class="feature-list"><li>${icon('check')} Two arranged-date credits each month</li><li>${icon('check')} Private, personality-first introductions</li><li>${icon('check')} Venue and schedule coordination</li><li>${icon('check')} Safety tools on every plan</li></ul>${button('Preview '+(annual?'yearly':'monthly')+' plan', 'select-plan')}</div></div>${state.previewPlan?'<div class="selected-plan-note" role="status">'+icon('check')+' '+(state.previewPlan==='annual'?'Yearly':'Monthly')+' plan saved for preview. No subscription started.</div>':''}</div><p class="membership-disclaimer">This is a pricing preview. No payment details are collected and no money is charged.</p></section>`;
}

// Dialogs keep context, preserve drafts and return keyboard focus to their trigger.
function openModal(type, extra = {}) {
  if (modal) persistDraft(); else lastFocus = document.activeElement;
  modal = { type, ...extra }; app.inert = true; document.body.style.overflow = 'hidden';
  renderModal(true);
}
function persistDraft() {
  if (!modal) return;
  if (modal.type === 'onboarding') {
    captureProfileFields(); state.drafts.profile = { step: modal.step, draft: structuredClone(modal.draft) }; save();
  }
  if (modal.type === 'planner') {
    const { type, errors, consent, ...draft } = modal;
    state.drafts.planner = structuredClone(draft); save();
  }
}
function closeModal() {
  persistDraft(); modal = null; modalRoot.innerHTML = ''; app.inert = false; document.body.style.overflow = '';
  render();
  if (lastFocus?.isConnected) lastFocus.focus();
  else document.querySelector('.page-title')?.focus({preventScroll:true});
}
function dialogFooter(backLabel, backAction, nextLabel, nextAction, disabled = false, extra = '') {
  return `<div class="dialog-footer">${button(backLabel, backAction, 'secondary', '', '')}${button(nextLabel, nextAction, 'primary', `${disabled?'disabled':''} ${extra}`)}</div>`;
}
function wizardProgress(step, labels) {
  return `<ol class="wizard-progress" aria-label="Step ${step+1} of ${labels.length}">${labels.map((label,i)=>`<li class="${i===step?'current':i<step?'done':''}" ${i===step?'aria-current="step"':''}><span>${i<step?icon('check'):i+1}</span>${label}</li>`).join('')}</ol>`;
}
function renderModal(resetScroll = false) {
  if (!modal) return;
  const active = document.activeElement, oldDialog = modalRoot.querySelector('.dialog');
  const oldTop = resetScroll ? 0 : oldDialog?.scrollTop || 0;
  const focusId = modalRoot.contains(active) ? active.id : null;
  const focusData = modalRoot.contains(active) && active.dataset.action ? { ...active.dataset } : null;
  const views = { onboarding: onboardingModal, planner: plannerModal, why: whyModal, safety: safetyModal, cancel: cancelModal, 'plan-preview': planPreviewModal, reset: resetModal, report: reportModal, 'report-receipt': reportReceiptModal };
  const body = views[modal.type]();
  modalRoot.innerHTML = `<div class="dialog-backdrop"><section class="dialog ${['planner','onboarding'].includes(modal.type)?'wizard-dialog':'small-dialog'}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><div class="dialog-toolbar"><span>${['planner','onboarding'].includes(modal.type)?'Your progress is saved':'blinddate'}</span><button class="icon-button" data-action="close-modal" aria-label="${['planner','onboarding'].includes(modal.type)?'Save and close':'Close dialog'}">${icon('close')}</button></div>${body}</section></div>`;
  const dialog = modalRoot.querySelector('.dialog'); dialog.scrollTop = oldTop;
  const focusTarget = resetScroll ? null : focusId ? modalRoot.querySelector('#'+CSS.escape(focusId)) : focusData ? [...modalRoot.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusData.action&&el.dataset.value===focusData.value&&el.dataset.group===focusData.group) : null;
  (focusTarget || modalRoot.querySelector('#dialog-title') || dialog).focus({preventScroll:true});
}
function dialogHeading(kicker, title, description) { return `<div class="dialog-heading"><p class="eyebrow">${kicker}</p><h2 id="dialog-title" tabindex="-1">${title}</h2><p>${description}</p></div>`; }
function choices(options, selected, group, multi = false) {
  return `<div class="choice-group" role="group" aria-label="${group}" tabindex="-1" id="profile-${group}" ${modal.errors?.[group]?'aria-describedby="error-'+group+'"':''}>${options.map(value=>`<button class="choice ${(multi?selected.includes(value):selected===value)?'selected':''}" aria-pressed="${multi?selected.includes(value):selected===value}" data-action="profile-choice" data-group="${group}" data-value="${esc(value)}" ${multi?'data-multi="true"':''}>${esc(value)}${(multi?selected.includes(value):selected===value)?icon('check'):''}</button>`).join('')}</div>${fieldError(group)}`;
}
function fieldError(field) { return modal.errors?.[field] ? `<p class="field-error" id="error-${field}" role="alert">${modal.errors[field]}</p>` : ''; }
function inputField(label, field, type = 'text', extra = '') { return `<div class="field"><label for="profile-${field}">${label}</label><input class="input" id="profile-${field}" data-profile-field="${field}" type="${type}" value="${esc(modal.draft[field])}" ${extra} ${modal.errors?.[field]?'aria-invalid="true" aria-describedby="error-'+field+'"':''}>${fieldError(field)}</div>`; }
function selectField(label, field, options) { return `<div class="field"><label for="profile-${field}">${label}</label><select class="input" id="profile-${field}" data-profile-field="${field}">${options.map(v=>`<option ${modal.draft[field]===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`; }
function onboardingModal() {
  const p = modal.draft, step = modal.step;
  let fields;
  if (step === 0) fields = `${dialogHeading('01 / THE BASICS', 'Start with you.', 'Three short steps. Use sample details while you explore.')}<div class="field-grid">${inputField('First name', 'name', 'text', 'maxlength="40" autocomplete="given-name"')}${inputField('Age · 18 or older', 'age', 'number', 'min="18" max="100" inputmode="numeric"')}</div>${selectField('I describe myself as', 'gender', ['Not specified','Man','Woman','Non-binary'])}<div class="field"><span class="field-label">I’d like to meet</span>${choices(['Everyone','Man','Woman','Non-binary'],p.meet,'meet')}</div><div class="field"><span class="field-label">I’m looking for</span>${choices(['A long-term relationship','Open to exploring'],p.intent,'intent')}</div>`;
  if (step === 1) fields = `${dialogHeading('02 / YOUR PERSONALITY', 'Your kind of good time.', 'Pick a few interests and the qualities you value. We’ll start with common ground.')}<div class="field"><span class="field-label">Things you enjoy · choose at least one</span>${choices(interestOptions,p.interests,'interests',true)}</div><div class="field"><span class="field-label">Qualities that matter · choose at least one</span>${choices(valueOptions,p.values,'values',true)}</div>${selectField('Dietary preferences', 'diet', ['No restrictions','Vegetarian','Vegan','Gluten-free'])}<details class="optional-details"><summary>Political compatibility <span>Optional</span></summary>${selectField('How important are similar views?', 'politics', ['Prefer not to say','Similar views matter to me','Open to different views'])}<p class="caption">This answer stays private. Political matching isn’t connected in the prototype.</p></details>`;
  if (step === 2) fields = `${dialogHeading('03 / YOUR PREFERENCES', 'A connection that fits.', 'Set your boundaries. We won’t silently widen them to produce a match.')}<div class="field"><label for="profile-radius">Travel radius <strong><span id="radius-value">${p.radius}</span> km</strong></label><input class="range-input" id="profile-radius" data-profile-field="radius" type="range" min="5" max="50" step="5" value="${p.radius}"><div class="range-labels"><span>5 km</span><span>From Vancouver</span><span>50 km</span></div></div><fieldset class="age-fields"><legend>Age range you’d like to meet</legend><div class="field-grid">${inputField('From', 'minAge', 'number', 'min="18" max="100" inputmode="numeric"')}${inputField('To', 'maxAge', 'number', 'min="18" max="100" inputmode="numeric"')}</div></fieldset><div class="field"><span class="field-label">Smoking preference</span>${choices(['Flexible','Non-smoker only'],p.smoking,'smoking')}</div><div class="info-note">${icon('lock')}Your full profile stays hidden. No height questions, public browsing or appearance rankings.</div>`;
  return `${wizardProgress(step,['Basics','Personality','Preferences'])}<div class="dialog-content">${fields}</div>${dialogFooter(step?'Back':'Save & close',step?'onboarding-back':'close-modal',step===2?'Save preferences':'Continue','onboarding-next')}`;
}
function filteredVenues(filter = modal?.filter || 'All spots', diet = state.profile.diet) {
  return venues.filter(v => (filter === 'Under $30' ? v.price < 30 : filter === 'All spots' || v.tags.includes(filter)) && (diet !== 'Gluten-free' || v.tags.includes('Gluten-free')) && (diet !== 'Vegan' || v.id === 'fig'));
}
function plannerModal() {
  const step = modal.step, venue = venueById(modal.venueId);
  let content;
  if (step === 0) {
    const all = filteredVenues(), visible = modal.showAll ? all : all.slice(0,3);
    content = `${dialogHeading('01 / THE PLACE', 'Somewhere you’ll both like.', all.length > 3 ? 'Start with three suggestions. See all options whenever you want.' : 'Choose from the sample venues that fit your current filters.')}<div class="filter-row" role="group" aria-label="Venue filters">${['All spots','Vegetarian','Gluten-free','Under $30'].map(f=>`<button class="filter ${modal.filter===f?'selected':''}" data-action="venue-filter" data-value="${f}" aria-pressed="${modal.filter===f}">${f}</button>`).join('')}</div><div class="venue-list">${visible.map(v=>`<button class="venue-option ${modal.venueId===v.id?'selected':''}" data-action="venue-select" data-value="${v.id}" aria-pressed="${modal.venueId===v.id}" aria-label="Select ${v.name}"><img src="assets/${v.photo}" alt="Illustrative ${v.type.split(' · ')[0].toLowerCase()} space"><div class="venue-info"><div class="venue-name"><h3>${v.name}</h3>${v.id==='juniper'?'<span class="recommended-tag">Suggested</span>':''}</div><p>${v.area} · ${v.type.split(' · ')[0]}</p><span class="venue-meta">★ ${v.rating} <span>(${v.reviews} sample reviews)</span> · ~C$${v.price}/person</span><span class="venue-diet">${v.tags.join(' · ')}</span></div><span class="radio-mark">${icon('check')}</span></button>`).join('') || '<div class="empty-filter">No sample venues fit this combination. Try a different filter.</div>'}</div>${all.length>3?`<button class="show-more" data-action="show-venues">${modal.showAll?'Show fewer options':'See all '+all.length+' options'} ${icon('down')}</button>`:''}<p class="caption venue-caption">Names, ratings and travel estimates are fictional. Confirm serious allergy needs directly with the venue.</p>`;
  }
  if (step === 1) content = `${dialogHeading('02 / THE TIME', 'Make a little room.', 'A suggested time is selected. Change it to whatever works for you.')}<div class="selection-summary">${icon('pin')}<div><strong>${venue.name}</strong><span>${venue.travel}</span></div></div><div class="field"><span class="field-label">Choose a day</span><div class="date-choices">${modal.days.map((day,i)=>`<button class="day-choice ${modal.dayIndex===i?'selected':''}" data-action="day-select" data-value="${i}" aria-pressed="${modal.dayIndex===i}"><span>${dateLabel(day,{weekday:'short'})}</span><strong>${dateLabel(day,{day:'numeric'})}</strong><span>${dateLabel(day,{month:'short'})}</span></button>`).join('')}</div></div><div class="field"><span class="field-label">Choose a time · Vancouver time</span><div class="time-choices">${timeOptions.map(t=>`<button class="choice ${modal.time===t?'selected':''}" data-action="time-select" data-value="${t}" aria-pressed="${modal.time===t}">${displayTime(t)}</button>`).join('')}</div></div><div class="info-note">${icon('people')}These are sample overlapping times. Your match’s availability and acceptance are simulated.</div>`;
  if (step === 2) {
    const ts = selectedTimestamp();
    content = `${dialogHeading('03 / THE PLAN', 'Your next first hello.', 'Review the details. Confirm only when they feel right.')}<div class="review-venue"><img src="assets/${venue.photo}" alt="Illustrative dining space"><div><h3>${venue.name}</h3><p>${venue.area}, Vancouver</p></div></div><dl class="review-details"><div><dt>Date & time</dt><dd>${dateLabel(ts)}<br>${timeLabel(ts)} PT</dd></div><div><dt>Introduction fee</dt><dd><strong>C$0</strong> · first introduction</dd></div><div><dt>Food & drinks</dt><dd>~C$${venue.price}/person, paid separately</dd></div></dl><section class="cancellation-summary"><div>${icon('clock')}<h3>Free cancellation until</h3></div><strong>${dateLabel(ts-86400000)} at ${timeLabel(ts-86400000)} PT</strong><p>After that: C$20 late-cancellation/no-show fee. Safety concerns and emergencies are exempt. You can leave a date at any time.</p></section><label class="checkbox-label"><input id="booking-consent" type="checkbox" ${modal.consent?'checked':''}><span>I understand the example cancellation policy and that this is a demo booking. No reservation or payment will be made.</span></label>`;
  }
  const selectedVisible = filteredVenues().some(v=>v.id===modal.venueId);
  return `${wizardProgress(step,['Place','Time','Review'])}<div class="dialog-content">${content}</div>${dialogFooter(step?'Back':'Save & close',step?'planner-back':'close-modal',step===0?'Choose a time':step===1?'Review date':'Confirm demo date','planner-next',step===0?!selectedVisible:step===2?!modal.consent:false)}`;
}
function whyModal() {
  const match = currentMatch(), sharedValues = match ? state.profile.values.filter(x=>match.values.includes(x)) : [];
  return `<div class="dialog-content">${dialogHeading('WHY THIS INTRODUCTION', 'A little common ground.', 'Three foundations worth exploring. Chemistry is something you discover in person.')}<div class="reason-list"><div>${icon('heart')}<div><h3>Compatible intentions</h3><p>${state.profile.intent==='A long-term relationship'?'You’re both looking for a long-term relationship.':'Your intentions are compatible with this sample introduction.'}</p></div></div><div>${icon('spark')}<div><h3>Shared interests & values</h3><p>${[...matchTags(),...sharedValues].slice(0,4).map(esc).join(' · ')||'You can learn what you have in common in person.'}</p></div></div><div>${icon('pin')}<div><h3>Fits your preferences</h3><p>Your age and distance preferences fit. Your home address isn’t shared.</p></div></div></div><p class="caption">Sample person. No compatibility percentage or promise of attraction.</p></div>${dialogFooter('Pass on this match','skip-match','Plan a date','plan',!match)}`;
}
function safetyModal() {
  return `<div class="dialog-content">${dialogHeading('SAFETY & SUPPORT', 'You’re always in control.', 'A date is an invitation. You decide what happens next.')}<ul class="safety-list"><li>Meet in a public, staffed venue and arrange your own way home.</li><li>Share the date details with someone you trust.</li><li>Leave whenever you want. There’s no fee for ending a date early.</li><li>Safety concerns and emergencies are exempt from the example cancellation fee.</li></ul><div class="info-note">${icon('shield')}This prototype has no live support, identity verification or monitored reports. Preferences are saved in this browser.</div></div>${dialogFooter('Preview a report','report',state.booking?'Copy date details':'Done',state.booking?'share':'close-modal')}`;
}
function cancelModal() {
  const fee = cancellationFee(state.booking, modal.reason);
  return `<div class="dialog-content">${dialogHeading('CANCEL YOUR DATE', 'Plans change. That’s okay.', 'Review the cancellation details. There’s no charge in this prototype.')}<div class="field"><label for="cancel-reason">Reason for cancelling</label><select class="input" id="cancel-reason"><option value="">Choose a reason</option>${['Plans changed','Safety concern','Emergency','I’d prefer another introduction'].map(reason=>`<option ${modal.reason===reason?'selected':''}>${reason}</option>`).join('')}</select></div><div class="fee-display"><span>Example cancellation fee</span><strong>C$${fee}</strong></div><p class="body-small">${fee===0?'You’re before the deadline, or a safety/emergency exception applies.':'You’re inside the 24-hour deadline. In a live service, you could appeal this fee.'} Your introduction credit is restored.</p></div>${dialogFooter('Keep date','close-modal','Cancel demo date','confirm-cancel',!modal.reason)}`;
}
function planPreviewModal() { return `<div class="dialog-content">${dialogHeading('MEMBERSHIP PREVIEW', state.plan==='annual'?'Yearly membership.':'Monthly membership.', state.plan==='annual'?'C$299.99 upfront per year, before tax.':'C$29.99 per month, before tax.')}<ul class="feature-list"><li>${icon('check')} Two arranged-date credits each month</li><li>${icon('check')} Food and drinks paid separately</li><li>${icon('check')} No payment or subscription in this demo</li></ul></div>${dialogFooter('Go back','close-modal','Save plan for preview','confirm-plan')}`; }
function resetModal() { return `<div class="dialog-content">${dialogHeading('RESET PROTOTYPE', 'Start fresh?', 'This clears your demo profile, unfinished setup, planned date and plan selection from this browser.')}</div>${dialogFooter('Keep my demo','close-modal','Reset demo','confirm-reset')}`; }
function reportModal() { return `<div class="dialog-content">${dialogHeading('REPORT PREVIEW', 'Tell us what happened.', 'This previews a support flow. Reports are not sent or monitored.')}<div class="field"><label for="report-category">What would you like to report?</label><select class="input" id="report-category"><option>Something made me uncomfortable</option><option>A person didn’t attend</option><option>A profile concern</option><option>A venue concern</option></select></div><div class="field"><label for="report-details">Details · optional</label><textarea class="input" id="report-details" placeholder="Use sample information."></textarea></div></div>${dialogFooter('Back','safety','Preview receipt','demo-report')}`; }
function reportReceiptModal() { return `<div class="dialog-content"><span class="receipt-check">${icon('check')}</span>${dialogHeading('PREVIEW COMPLETE', 'Your voice matters.', 'A live report would go to the support team. In this prototype, nothing was sent and report details were not saved.')}${button('Done','close-modal')}</div>`; }

function startProfile(stepOverride) {
  const saved = validProfileDraft(state.drafts.profile);
  openModal('onboarding', { step: stepOverride ?? saved?.step ?? 0, draft: structuredClone(saved?.draft || state.profile), errors: {} });
}
function startPlanner(rescheduling = false) {
  if (state.booking && !rescheduling) { closeModal(); navigate('dates'); return; }
  const match = currentMatch();
  if (!match && !rescheduling) { startProfile(2); toast('No sample match fits. You can adjust your preferences.'); return; }
  const matchId = rescheduling ? state.booking.matchId : match.id;
  const saved = validPlannerDraft(state.drafts.planner);
  const canResume = saved && saved.matchId === matchId && Boolean(saved.rescheduling) === rescheduling;
  const options = filteredVenues('All spots');
  openModal('planner', canResume ? { ...saved, consent:false } : { step:0, filter:'All spots', showAll:false, venueId:rescheduling?state.booking.venueId:(options[0]?.id||venues[0].id), dayIndex:0, time:'18:30', days:availableDays(), consent:false, matchId, rescheduling });
}
function captureProfileFields() {
  if (modal?.type !== 'onboarding') return;
  modalRoot.querySelectorAll('[data-profile-field]').forEach(input => { modal.draft[input.dataset.profileField] = ['age','radius','minAge','maxAge'].includes(input.dataset.profileField) ? (input.value === '' ? '' : Number(input.value)) : input.value; });
}
function profileErrors(profile, step) {
  const errors = {};
  if (step === 0) {
    if (!profile.name.trim()) errors.name = 'Enter a first name. Spaces and accents are welcome.';
    if (!Number.isInteger(profile.age) || profile.age < 18 || profile.age > 100) errors.age = 'Enter an adult age from 18 to 100.';
  }
  if (step === 1) {
    if (!profile.interests.length) errors.interests = 'Choose at least one interest.';
    if (!profile.values.length) errors.values = 'Choose at least one quality.';
  }
  if (step === 2) {
    if (!Number.isInteger(profile.minAge) || profile.minAge < 18 || profile.minAge > 100) errors.minAge = 'Use an age from 18 to 100.';
    if (!Number.isInteger(profile.maxAge) || profile.maxAge < 18 || profile.maxAge > 100) errors.maxAge = 'Use an age from 18 to 100.';
    else if (profile.minAge > profile.maxAge) errors.maxAge = 'The upper age must be at least the lower age.';
  }
  return errors;
}
function firstInvalidProfileStep(profile) {
  for (let step=0; step<3; step++) {
    const errors=profileErrors(profile,step);
    if (Object.keys(errors).length) return {step,errors};
  }
  return null;
}
function navigate(view) { state.view = view; save(); render(); window.scrollTo({top:0,behavior:'instant'}); document.querySelector('.page-title')?.focus({preventScroll:true}); }
function updateCountdown() {
  const element = document.querySelector('[data-countdown]'); if (!element || !state.booking) return;
  const seconds = Math.max(0, Math.floor((state.booking.timestamp-Date.now())/1000));
  element.textContent = seconds ? `${Math.floor(seconds/86400)}d ${String(Math.floor(seconds%86400/3600)).padStart(2,'0')}h ${String(Math.floor(seconds%3600/60)).padStart(2,'0')}m` : 'Time for hello.';
}
async function shareDate() {
  const b = state.booking; if (!b) return;
  const v = venueById(b.venueId), details = `blinddate · DEMO ONLY, not a reservation\n${v.name}, ${v.area}, Vancouver (fictional venue)\n${dateLabel(b.timestamp,{weekday:'long',month:'long',day:'numeric',year:'numeric'})} at ${timeLabel(b.timestamp)} PT\nMystery match #${b.matchId}\nFree cancellation until ${dateLabel(b.timestamp-86400000)} at ${timeLabel(b.timestamp-86400000)} PT.`;
  try { await navigator.clipboard.writeText(details); toast('Demo date details copied.'); }
  catch { openModal('report-receipt'); modalRoot.querySelector('.dialog-content').innerHTML = `${dialogHeading('COPY DATE DETAILS','Your plan, in one place.','Select and copy the details below.')}<textarea class="input copy-fallback" readonly aria-label="Date details">${esc(details)}</textarea>${button('Done','close-modal')}`; modalRoot.querySelector('textarea').select(); }
}
async function handleAction(action, target) {
  switch (action) {
    case 'navigate': navigate(target.dataset.view); break;
    case 'onboarding': startProfile(); break;
    case 'preferences': startProfile(2); break;
    case 'onboarding-back': captureProfileFields(); modal.step--; persistDraft(); renderModal(true); break;
    case 'onboarding-next': {
      captureProfileFields();
      const invalid = modal.step===2 ? firstInvalidProfileStep(modal.draft) : null;
      if (invalid) modal.step=invalid.step;
      modal.errors = invalid?.errors || profileErrors(modal.draft,modal.step);
      if (Object.keys(modal.errors).length) { renderModal(); const key=Object.keys(modal.errors)[0]; modalRoot.querySelector('#profile-'+key)?.focus(); break; }
      if (modal.step < 2) { modal.step++; persistDraft(); renderModal(true); }
      else {
        state.profile = {...modal.draft, name:modal.draft.name.trim().replace(/\s+/g,' '), complete:true};
        state.matchIndex=0; state.drafts.profile=null; state.drafts.planner=null; save();
        modal=null; closeModal(); toast(currentMatch()?'Preferences saved. Your sample introduction is updated.':'Preferences saved. No sample person fits yet.');
      } break;
    }
    case 'profile-choice': {
      captureProfileFields(); const group=target.dataset.group,value=target.dataset.value;
      if (target.dataset.multi) modal.draft[group]=modal.draft[group].includes(value)?modal.draft[group].filter(x=>x!==value):[...modal.draft[group],value];
      else modal.draft[group]=value;
      if (modal.errors) delete modal.errors[group]; persistDraft(); renderModal(); break;
    }
    case 'plan': startPlanner(); break;
    case 'reschedule': startPlanner(true); break;
    case 'venue-filter': modal.filter=target.dataset.value; modal.showAll=false; modal.consent=false; if (!filteredVenues().some(v=>v.id===modal.venueId)) modal.venueId=filteredVenues()[0]?.id||''; persistDraft(); renderModal(); break;
    case 'show-venues': modal.showAll=!modal.showAll; persistDraft(); renderModal(); break;
    case 'venue-select': modal.venueId=target.dataset.value; modal.consent=false; persistDraft(); renderModal(); break;
    case 'day-select': modal.dayIndex=Number(target.dataset.value); modal.consent=false; persistDraft(); renderModal(); break;
    case 'time-select': modal.time=target.dataset.value; modal.consent=false; persistDraft(); renderModal(); break;
    case 'planner-back': modal.step--; modal.consent=false; persistDraft(); renderModal(true); break;
    case 'planner-next':
      if (modal.step<2) { modal.step++; modal.consent=false; persistDraft(); renderModal(true); }
      else if (modal.consent) { state.booking={venueId:modal.venueId,timestamp:selectedTimestamp(),matchId:modal.matchId,createdAt:Date.now()}; state.drafts.planner=null; state.view='dates'; save(); modal=null; closeModal(); window.scrollTo({top:0,behavior:'instant'}); toast('Demo date confirmed. Your plan is saved.'); }
      break;
    case 'why': openModal('why'); break;
    case 'skip-match': state.matchIndex++; state.drafts.planner=null; save(); modal=null; closeModal(); toast('Introduction passed. No fee. Another sample is ready.'); break;
    case 'safety': openModal('safety'); break;
    case 'report': openModal('report'); break;
    case 'demo-report': openModal('report-receipt'); break;
    case 'cancel': openModal('cancel',{reason:''}); break;
    case 'confirm-cancel': if (!modal.reason) break; state.booking=null; state.drafts.planner=null; save(); modal=null; closeModal(); toast('Demo date cancelled. Credit restored. No charge.'); break;
    case 'share': await shareDate(); break;
    case 'billing': state.plan=target.dataset.value; save(); render(); break;
    case 'select-plan': openModal('plan-preview'); break;
    case 'confirm-plan': state.previewPlan=state.plan; save(); modal=null; closeModal(); toast('Plan saved for preview. No subscription or payment.'); break;
    case 'reset': openModal('reset'); break;
    case 'confirm-reset': state=defaultState(); save(); modal=null; closeModal(); window.scrollTo({top:0,behavior:'instant'}); toast('Demo reset.'); break;
    case 'close-modal': closeModal(); break;
  }
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target&&!target.disabled)handleAction(target.dataset.action,target);});
document.addEventListener('input',event=>{
  if (event.target.matches('[data-profile-field]') && modal?.type==='onboarding') {
    captureProfileFields(); persistDraft();
    if (event.target.id==='profile-radius') modalRoot.querySelector('#radius-value').textContent=event.target.value;
  }
});
document.addEventListener('change',event=>{
  if (event.target.matches('[data-profile-field]') && modal?.type==='onboarding') { captureProfileFields(); persistDraft(); }
  if (event.target.id==='booking-consent') { modal.consent=event.target.checked; modalRoot.querySelector('[data-action="planner-next"]').disabled=!modal.consent; }
  if (event.target.id==='cancel-reason') { modal.reason=event.target.value; renderModal(); }
});
modalRoot.addEventListener('click',event=>{if(event.target.classList.contains('dialog-backdrop'))closeModal();});
document.addEventListener('keydown',event=>{
  if (!modal) return;
  if (event.key==='Escape') { closeModal(); return; }
  if (event.key==='Enter' && event.target.matches('input:not([type="checkbox"]):not([type="range"])')) { event.preventDefault(); modalRoot.querySelector('[data-action="onboarding-next"]')?.click(); }
  if (event.key==='Tab') {
    const elements=[...modalRoot.querySelectorAll('button:not([disabled]),input,select,textarea,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=elements[0],last=elements.at(-1); if(!first)return;
    if(event.shiftKey&&(document.activeElement===first||!elements.includes(document.activeElement))) {event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!elements.includes(document.activeElement))) {event.preventDefault();first.focus();}
  }
});
setInterval(updateCountdown,30000);
render();
