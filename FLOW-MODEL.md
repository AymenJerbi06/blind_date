# Profile, introduction and date agreement model

## Entry and account gate

Concept only → Create account / Log in → email confirmation when required → private five-step profile → Preferences with four tabs. `dist/entry-flow.js` centralizes stage/action policy. An incomplete signed-in account has only full-page profile creation: no tabs, bell, avatar or app navigation. Escape, direct navigation and unrelated action dispatch cannot bypass this gate. Completing the validated profile reveals the app; completed returning accounts open Preferences directly.

`server/auth.mjs` uses Supabase Auth, server-held provider tokens, opaque HttpOnly cookies and a PKCE email callback. `dist/auth-client.js` calls only same-origin routes. Account-specific local namespaces keep drafts/photos/dates separate; old unowned demo data is preserved without automatic assignment. Local profile/date models are still browser data, not server-authoritative records. Sessions currently end on server restart. See README for origin and email redirect configuration.

Implemented locally in `dist/dating-model.js` (pure validation and matching) and `dist/date-lifecycle.js` (date transitions), `dist/app-state.js` (hydration), `dist/local-repository.js` (local adapter), `dist/ui/` (renderers), and `dist/app.js` (coordination). `dist/core.js` holds the fictional people and venue fixtures. This is a reviewable prototype model, not a connected backend.

## Separate records

| Record | Contents | Save semantics |
|---|---|---|
| Own profile | Adult age, name, gender, education/work, own energy/activity/pets/smoking/diet, interests/values, intentions, optional politics, bill comfort | Five-step draft; explicit profile completion after full validation |
| Preference draft | Desired person's energy/activity/pets/lifestyle/intentions, gender, adult age bounds, radius, desired interests/values | Autosaved recovery draft, separate from reusable preferences |
| Saved preferences | Explicit reusable snapshot | Only Save my type replaces it; Explore once never does |
| Availability draft | Exact ISO dates, start/end local times, acceptable venue IDs | Preserves typed values; save/search validates and commits |
| Introduction | Immutable search preferences/availability snapshot, one sample counterpart, passed IDs, current phase | One active discussion; counterpart scheduling snapshot survives reload |
| Proposal | Date, local time, UTC timestamp, venue, bill mode, note, author, revision and both acceptance flags | An author accepts their own offer; a change requires new acceptance from the other side |
| Confirmed date | Exact timestamp, venue, counterpart, bill mode, accepted proposal revision | Created only by central confirmation guard |
| Inbox | Local event, title/detail, unread state, relevant view | Simulated events only; no delivery to another device |

Saving/exploring creates a planning session. The search button is on Availability, after time/place selection. Saving type alone never contacts or books anyone.

## Matching rules

1. Validate the completed own profile, desired bounds, bill choices and future availability.
2. Respect mutual age, gender and radius preferences, own/other relationship intentions, desired energy/activity/pet/smoking/political requirements, and at least one mutually acceptable bill arrangement.
3. Among eligible people, prioritize at least a 60-minute intersection on the same local date **and** a shared selected venue that meets both dietary tags.
4. Rank shared desired interests and values within that grouping. No compatibility percentage or guaranteed romantic outcome is shown.
5. Without time/place overlap, keep the introduction provisional and show both sets of choices. Do not confirm automatically. Rematch excludes already passed fixture people for that session. Finite fixture exhaustion has an explicit empty state.

Availability is scheduling input, rather than an unchangeable personal boundary. A custom proposal may fall outside it so two people can voluntarily adjust; bill/diet compatibility and a future valid timestamp remain required.

## Agreement transitions

```text
profile required → partner questions → save type / explore once
                                      ↓
                                  planning
                                      ↓ valid days/ranges/venues
                                  searching
                            ↙                     ↘
                         empty                  found
                                                  ↓ offer by either side
                                                waiting
                                       ↙             ↓              ↘
                                    declined      counteroffer     both accept
                                       ↓             ↓              ↓
                                    rematch       waiting          agreed
                                                                     ↓ fresh review
                                                                 confirmed date
```

- A proposal's author records only their own acceptance. A simulated reply applies only if its revision matches the current proposal.
- A counteroffer increments the revision, accepts for its author, and clears the other acceptance. Stale replies/drafts cannot accept or overwrite a newer revision.
- Final confirmation rechecks profile completion, compatible bill/diet, timestamp integrity/future date, both flags on the same proposal and a fresh checkbox. Reloads never restore final consent.
- A pending reschedule retains the original booking. Declining/withdrawing keeps it. Only accepted and confirmed replacement terms replace it.
- An unconfirmed introduction has no cancellation penalty. For a confirmed date, the example fee is zero until exactly 24 elapsed hours before the date, then C$20, with safety/emergency exceptions. No charges occur.
- The demo reply controls act as a fictional counterpart. They do not prove live delivery, identity or server-side authorization.

## Persistence and validation

Schema version 3 uses the existing browser key. Large photo values migrate to separate local asset keys; the state stores references and unchanged photos are not rewritten. Version 1/2 names, age, interests, valid photos and existing dates are preserved, but new own-personality answers are not invented and legacy filters are not silently opted into saved type. Corrupt storage recovers to a fresh usable state. Profile and proposal drafts preserve progress; proposal drafts are scoped to the current introduction and revision. Reloading a search returns to planning rather than leaving a timerless animation.

Dates/times are converted using America/Vancouver. Nonexistent calendar dates and spring DST clock times are rejected. Ranges must be on a future date, unique by date, same-day, and at least one hour. Model tests cover the exact one-hour boundary, adjacent/non-overlapping intervals and DST changes.

## Validation

`npm run check` covers syntax plus domain/state checks for profiles/minors, explicit preference saving, mutual eligibility, diet/bill compatibility, schedule intersections, conflicting plans, rematching, proposal revisions/stale replies, final consent, preserved reschedules, draft recovery, migration, DST, cancellation, escaping and analytic spring behavior. Browser testing exercises the rendered controls and persists sample data across reloads. See `UX-PRINCIPLES.md` for the visual audit and device-testing gaps.

## Trust and post-date state

Public proposal notes use canonical presets, including restored drafts before sending. The heuristic contact detector is defense in depth, not a security proof. Recognition notes are structured and revealed on the local calendar day. Record unlock keys are per introduction and person; demo membership includes access while active.

Feedback is bound to a stable date ID and the after-date phase. Submitting a yes does not reveal anything. A current partner reply, a valid submitted yes and valid sharing contact are required by the central reveal selector. Finishing, declining, no-show reporting and cancellation clear private sharing drafts and pending reschedules. Sample no-show adjustments are durable and included in ranking; no real moderation feed is connected.

Critical state changes commit through the persistence adapter before replacing the active state. Failed writes preserve the previous document/assets and do not produce a success transition. Ordinary incomplete text remains a recoverable draft, with saved/failed feedback. Photo input completion is scoped to its original dialog.
