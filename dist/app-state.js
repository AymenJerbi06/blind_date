/* Persistent-state schema and migration. No DOM or browser-storage dependency. */
const AppState = (() => {
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const validTime = value => Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
  const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
  const knownPerson = id => candidates.some(person => person.id === id);
  const knownVenue = id => venues.some(venue => venue.id === id);
  const views = ['home', 'dates', 'availability', 'profile'];
  const phases = ['planning', 'searching', 'found', 'waiting', 'agreed', 'declined', 'empty'];

  function create() {
    return {
      version: 3, skinVersion: 2, view: 'home', theme: 'light',
      profile: Dating.defaultProfile(), savedPreferences: null,
      deck: {step: 0, answers: Dating.defaultPreferences()},
      availability: Dating.defaultAvailability(), availabilityDraft: Dating.defaultAvailability(),
      session: null, booking: null, drafts: {profile: null, proposal: null},
      inbox: [], plan: 'monthly', previewPlan: null, unlocks: [], pastDates: [],
      record: {dates: 0, noShows: 0, lateCancels: 0}, reliabilityOverrides: {},
      trusted: {name: '', contact: ''}, dateClock: 'auto', feedback: null,
    };
  }

  function normalizeBooking(raw) {
    const b = object(raw);
    if (!knownVenue(b.venueId) || !knownPerson(b.matchId) || !validTime(b.timestamp)) return null;
    return {
      id: DateLifecycle.bookingId(b), venueId: b.venueId, matchId: b.matchId,
      timestamp: b.timestamp, createdAt: validTime(b.createdAt) ? b.createdAt : Date.now(),
      billMode: ['own', 'you-cover', 'date-covers'].includes(b.billMode) ? b.billMode : null,
      proposalRevision: Number.isInteger(b.proposalRevision) ? b.proposalRevision : null,
      marker: Trust.normalizeMarker(object(b.marker)),
      checkin: ['none', 'ok', 'help'].includes(b.checkin) ? b.checkin : 'none',
    };
  }

  function normalizeProposal(raw, person) {
    const p = object(raw), timestamp = Dating.timestamp(p.date, p.time);
    if (!person || !Number.isInteger(p.revision) || p.revision < 1 || !Number.isFinite(timestamp) || !knownVenue(p.venueId) || !['own', 'you-cover', 'date-covers'].includes(p.billMode)) return null;
    return {
      date: p.date, time: p.time, timestamp, venueId: p.venueId, billMode: p.billMode,
      revision: p.revision, author: p.author === 'partner' ? 'partner' : 'you',
      youAccepted: p.youAccepted === true, partnerAccepted: p.partnerAccepted === true,
      note: Trust.publicNote(p.note),
    };
  }

  function normalizeSession(raw, profile, booking) {
    const s = object(raw);
    if (!phases.includes(s.phase)) return null;
    const preferences = Dating.normalizePreferences(object(s.preferences));
    if (Object.keys(Dating.preferenceErrors(preferences, profile)).length) return null;
    const createdAt = validTime(s.createdAt) ? s.createdAt : Date.now();
    const base = Dating.person(s.person?.id, createdAt);
    const person = base ? {...base, ...Dating.normalizeAvailability(object(s.person))} : null;
    const availability = Dating.normalizeAvailability(object(s.availability));
    const proposal = normalizeProposal(s.proposal, person);
    let phase = s.phase === 'searching' ? 'planning' : s.phase;
    if (['found', 'waiting', 'agreed', 'declined'].includes(phase) && !person) phase = 'planning';
    if (['waiting', 'agreed'].includes(phase)) phase = !proposal ? 'found' : proposal.youAccepted && proposal.partnerAccepted ? 'agreed' : 'waiting';
    return {
      id: text(s.id, 160) || 'restored-' + createdAt, phase,
      scope: s.scope === 'saved' ? 'saved' : 'once', preferences, availability,
      person, proposal, createdAt, marker: Trust.normalizeMarker(object(s.marker)),
      stretched: s.stretched === true,
      suggested: person ? Dating.sharedPlan(availability, person, profile) : null,
      passedIds: Array.isArray(s.passedIds) ? [...new Set(s.passedIds.filter(knownPerson))] : [],
      isReschedule: !!(s.isReschedule && booking && person?.id === booking.matchId),
      history: Array.isArray(s.history) ? s.history.slice(-8).filter(item => item && typeof item.note === 'string').map(item => ({author: item.author === 'partner' ? 'partner' : 'you', note: Trust.publicNote(item.note), revision: Number.isInteger(item.revision) && item.revision > 0 ? item.revision : 1})) : [],
    };
  }

  function normalizeDrafts(raw, version, session) {
    const draft = object(raw?.profile), offer = object(raw?.proposal);
    const profile = draft.draft && typeof draft.draft.name === 'string' ? {
      step: version === 1 ? 0 : Math.max(0, Math.min(Dating.profileSteps - 1, Math.trunc(Number(draft.step)) || 0)),
      draft: Dating.normalizeProfile(object(draft.draft)),
    } : null;
    const proposal = session && offer.sessionId === session.id && offer.baseRevision === (session.proposal?.revision || 0) && offer.draft ? {
      sessionId: session.id, baseRevision: offer.baseRevision,
      draft: Object.fromEntries(['date', 'time', 'venueId', 'billMode', 'note'].map(key => [key, text(offer.draft[key], key === 'note' ? 240 : 40)])),
    } : null;
    return {profile, proposal};
  }

  function normalizeUnlocks(raw, session) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter(id => typeof id === 'string').map(id => {
      if (!knownPerson(id)) return id; // v3: introduction-scoped key.
      return session?.person?.id === id ? DateLifecycle.introductionKey(session) : ''; // v2 migration.
    }).filter(id => id.includes(':') && id.length < 200))].slice(-50);
  }

  function hydrate(raw, {deckLast = 9} = {}) {
    const base = create();
    if (!raw || ![1, 2, 3].includes(raw.version)) return base;
    try {
      const profile = Dating.normalizeProfile(object(raw.profile));
      const booking = normalizeBooking(raw.booking);
      const session = normalizeSession(raw.session, profile, booking);
      const saved = raw.savedPreferences ? Dating.normalizePreferences(object(raw.savedPreferences)) : null;
      const availability = Dating.normalizeAvailability(object(raw.availability));
      return {
        ...base, profile, booking, session,
        theme: raw.skinVersion === 2 && raw.theme === 'dark' ? 'dark' : 'light',
        savedPreferences: saved && !Object.keys(Dating.preferenceErrors(saved, profile)).length ? saved : null,
        deck: {
          step: raw.deck?.step === 'review' ? 'review' : Number.isInteger(raw.deck?.step) ? Math.max(0, Math.min(deckLast, raw.deck.step)) : 0,
          answers: Dating.normalizePreferences(object(raw.deck?.answers || raw.profile)),
        },
        availability, availabilityDraft: Dating.normalizeAvailability(object(raw.availabilityDraft || availability)),
        drafts: normalizeDrafts(raw.drafts, raw.version, session),
        inbox: Array.isArray(raw.inbox) ? raw.inbox.slice(-30).filter(n => n && typeof n.id === 'string' && typeof n.title === 'string').map(n => ({id: text(n.id, 160), title: text(n.title, 100), detail: String(n.detail || '').slice(0, 240), view: views.includes(n.view) ? n.view : 'home', read: n.read === true, at: validTime(n.at) ? n.at : 0})) : [],
        plan: raw.plan === 'annual' ? 'annual' : 'monthly',
        previewPlan: ['annual', 'monthly'].includes(raw.previewPlan) ? raw.previewPlan : null,
        unlocks: normalizeUnlocks(raw.unlocks, session),
        pastDates: Array.isArray(raw.pastDates) ? raw.pastDates.slice(-20).filter(d => d && knownPerson(d.matchId) && knownVenue(d.venueId) && validTime(d.timestamp)).map(d => ({id: DateLifecycle.bookingId(d), matchId: d.matchId, venueId: d.venueId, timestamp: d.timestamp, outcome: ['revealed', 'no-match', 'no-show', 'passed'].includes(d.outcome) ? d.outcome : 'passed', stars: Number.isInteger(d.stars) && d.stars >= 1 && d.stars <= 5 ? d.stars : null})) : [],
        record: DateLifecycle.record(raw.record),
        reliabilityOverrides: Object.fromEntries(Object.entries(object(raw.reliabilityOverrides)).filter(([id]) => knownPerson(id)).map(([id, value]) => [id, DateLifecycle.record(value)])),
        trusted: {name: String(raw.trusted?.name || '').slice(0, 40), contact: String(raw.trusted?.contact || '').slice(0, 20)},
        dateClock: ['auto', 'upcoming', 'during', 'after'].includes(raw.dateClock) ? raw.dateClock : 'auto',
        feedback: DateLifecycle.normalizeFeedback(raw.feedback, booking),
      };
    } catch {
      return base;
    }
  }

  return {create, hydrate, normalizeSession, normalizeFeedback: DateLifecycle.normalizeFeedback};
})();
