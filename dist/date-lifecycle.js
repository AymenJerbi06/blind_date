/* Date lifecycle rules. Pure commands and selectors, with no DOM, storage or transport.
   Demo time overrides are explicit inputs; a real service must use a trusted clock. */
const DateLifecycle = (() => {
  const dateDuration = 3 * 60 * 60 * 1000;
  const cancellationReasons = ['Plans changed', 'Safety concern', 'Emergency', 'I’d prefer another introduction'];
  const validOutcomes = ['revealed', 'no-match', 'no-show', 'passed'];
  const count = value => Number.isFinite(Number(value)) ? Math.min(100000, Math.max(0, Math.trunc(Number(value)))) : 0;
  const record = raw => ({dates: count(raw?.dates), noShows: count(raw?.noShows), lateCancels: count(raw?.lateCancels)});
  const bookingId = booking => booking?.id || (booking ? `date:${booking.matchId}:${booking.timestamp}:${booking.proposalRevision || 0}` : '');

  function phase(booking, override = 'auto', now = Date.now()) {
    if (!booking) return null;
    if (['upcoming', 'during', 'after'].includes(override)) return override;
    return now < booking.timestamp ? 'upcoming' : now < booking.timestamp + dateDuration ? 'during' : 'after';
  }

  function emptyFeedback(booking) {
    return {bookingId: bookingId(booking), showed: '', stars: 0, tags: [], fake: false, again: '', contact: '', note: '', submitted: false, their: ''};
  }

  function normalizeFeedback(raw, booking) {
    if (!raw || !booking || (raw.bookingId && raw.bookingId !== bookingId(booking))) return null;
    const answer = value => ['yes', 'no'].includes(value) ? value : '';
    const feedback = {
      ...emptyFeedback(booking),
      showed: answer(raw.showed),
      stars: Number.isInteger(raw.stars) && raw.stars >= 1 && raw.stars <= 5 ? raw.stars : 0,
      tags: [...new Set((Array.isArray(raw.tags) ? raw.tags : [])
        .map(tag => tag === 'Looked like their photos' ? 'Matched their description' : tag)
        .filter(tag => [...Trust.goodTags, ...Trust.badTags].includes(tag)))],
      fake: raw.fake === true,
      again: answer(raw.again),
      contact: String(raw.contact || '').slice(0, 40),
      note: String(raw.note || '').slice(0, 300),
    };
    if (feedback.again !== 'yes') feedback.contact = '';
    feedback.submitted = raw.submitted === true && feedback.showed === 'yes' && feedback.again === 'yes' && !Object.keys(Trust.feedbackErrors(feedback)).length;
    feedback.their = feedback.submitted ? answer(raw.their) : '';
    return feedback;
  }

  function feedbackFor(state) {
    return normalizeFeedback(state.feedback, state.booking) || emptyFeedback(state.booking);
  }

  function canEditFeedback(state, now = Date.now()) {
    return !!state.booking && phase(state.booking, state.dateClock, now) === 'after' && !feedbackFor(state).submitted;
  }

  function canReveal(state, now = Date.now()) {
    const f = normalizeFeedback(state.feedback, state.booking);
    return !!f && phase(state.booking, state.dateClock, now) === 'after' && f.submitted && f.showed === 'yes' && Trust.revealed(f.again, f.their) && !Trust.contactErrors(f.contact);
  }

  function recognitionVisible(state, now = Date.now()) {
    return !!state.booking && (state.dateClock === 'during' || state.dateClock === 'after' || Dating.isoDate(state.booking.timestamp) === Dating.isoDate(now));
  }

  const failure = error => ({ok: false, error});
  const success = (state, extra = {}) => ({ok: true, state, ...extra});

  function updateFeedback(state, field, value, now = Date.now()) {
    if (!canEditFeedback(state, now)) return failure('Feedback is available after this date and before you submit it.');
    const f = feedbackFor(state);
    if (field === 'showed' || field === 'again') {
      if (!['yes', 'no'].includes(value)) return failure('Choose yes or no.');
      f[field] = value;
      if (field === 'again' && value === 'no') f.contact = '';
      if (field === 'showed' && value === 'no') Object.assign(f, {stars: 0, tags: [], fake: false, again: '', contact: ''});
    } else if (field === 'stars') {
      if (!Number.isInteger(value) || value < 1 || value > 5) return failure('Choose one to five stars.');
      f.stars = value;
    } else if (field === 'tag') {
      if (![...Trust.goodTags, ...Trust.badTags].includes(value)) return failure('Choose a review tag from the list.');
      f.tags = f.tags.includes(value) ? f.tags.filter(tag => tag !== value) : [...f.tags, value];
    } else if (field === 'fake') {
      f.fake = !f.fake;
      if (f.fake && !f.tags.includes('Not as described')) f.tags.push('Not as described');
    } else if (field === 'contact' || field === 'note') {
      f[field] = String(value).slice(0, field === 'contact' ? 40 : 300);
    } else return failure('That feedback field is not supported.');
    return success({...state, feedback: f});
  }

  function archive(state, outcome) {
    if (!state.booking || !validOutcomes.includes(outcome)) return failure('There is no date to finish.');
    const b = state.booking, f = feedbackFor(state);
    const entry = {id: bookingId(b), matchId: b.matchId, venueId: b.venueId, timestamp: b.timestamp, outcome, stars: f.stars || null};
    const overrides = {...state.reliabilityOverrides};
    if (outcome === 'no-show') {
      const current = record(overrides[b.matchId]);
      overrides[b.matchId] = {...current, noShows: current.noShows + 1};
    }
    return success({
      ...state,
      pastDates: [...state.pastDates.filter(date => date.id !== entry.id), entry].slice(-20),
      record: {...record(state.record), dates: count(state.record.dates) + 1},
      reliabilityOverrides: overrides,
      booking: null, feedback: null, session: null,
      drafts: {...state.drafts, proposal: null}, dateClock: 'auto',
    }, {outcome});
  }

  function submitFeedback(state, now = Date.now()) {
    if (!canEditFeedback(state, now)) return failure('These answers cannot be submitted for this date now.');
    const f = feedbackFor(state), errors = Trust.feedbackErrors(f);
    if (Object.keys(errors).length) return {ok: false, errors};
    if (f.showed === 'no') return archive({...state, feedback: f}, 'no-show');
    if (f.again === 'no') return archive({...state, feedback: f}, 'passed');
    return success({...state, feedback: {...f, submitted: true, their: ''}});
  }

  function partnerDecision(state, dateId, decision, now = Date.now()) {
    const f = normalizeFeedback(state.feedback, state.booking);
    if (!f?.submitted || f.their || bookingId(state.booking) !== dateId || phase(state.booking, state.dateClock, now) !== 'after' || !['yes', 'no'].includes(decision)) {
      return failure('This reply is no longer current.');
    }
    return success({...state, feedback: {...f, their: decision}});
  }

  function finish(state, now = Date.now()) {
    if (canReveal(state, now)) return archive(state, 'revealed');
    const f = normalizeFeedback(state.feedback, state.booking);
    if (f?.submitted && f.their === 'no' && phase(state.booking, state.dateClock, now) === 'after') return archive(state, 'no-match');
    return failure('Wait for the current date’s mutual decision before finishing.');
  }

  function cancel(state, reason, now = Date.now()) {
    if (!state.booking || !cancellationReasons.includes(reason) || phase(state.booking, 'auto', now) !== 'upcoming') return failure('This date cannot be cancelled now. Safety tools remain available.');
    const due = Dating.cancellationFee(state.booking, reason, now), waived = due > 0 && Plans.waiverAvailable(state, now), fee = waived ? 0 : due;
    // A waived fee still counts as a late cancellation: the other person was still let down.
    return success({...state, waiverUsedAt: waived ? now : state.waiverUsedAt || 0, record: {...record(state.record), lateCancels: count(state.record.lateCancels) + (due > 0 ? 1 : 0)}, booking: null, feedback: null, session: null, drafts: {...state.drafts, proposal: null}, dateClock: 'auto'}, {fee, waived});
  }

  function introductionKey(session) {
    return session?.person ? `${session.id}:${session.person.id}` : '';
  }

  return {phase, bookingId, emptyFeedback, normalizeFeedback, feedbackFor, canEditFeedback, canReveal, recognitionVisible, updateFeedback, submitFeedback, partnerDecision, finish, cancel, introductionKey, record};
})();
