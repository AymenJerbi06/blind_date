# Dating flow and UX review

## Halal and gender-specific bill labels — October 20, 2026

Halal is selectable in setup and profile editing, persists with the profile, and uses the existing mutual dietary checks for venues and proposals. The fictional Olive & Oak fixture now has a Halal tag; Vegetarian or Vegan alone does not imply Halal. Men see Split the bill / I’ll pay, and women see Split the bill / I accept if he pays. Either or both can be selected. Profile and restaurant summaries reuse these labels. Splitting still means each pays for their own food and drinks. Existing saved choice IDs and the other gender options are preserved.

The supplied iOS reference favors familiar grouped controls and clear choices. This change retains the existing dropdown and selectable bill rows, with no layout, color, icon or motion change. Review against the 20 laws:

| Law | Application |
|---|---|
| 01 Jakob | Existing profile and restaurant navigation. |
| 02 Hick | Exactly two bill options for men and women. |
| 03 Fitts | Existing full-width bill targets and diet select. |
| 04 Von Restorff | Existing single primary form action. |
| 05 Zeigarnik | Existing setup progress and selected answers. |
| 06 Doherty | Existing immediate choice feedback and draft save. |
| 07 Tesler | Dietary filters and mutual bill checks do the work. |
| 08 Parkinson | No new step or deadline. |
| 09 Peak–End | Existing review and save endpoint. |
| 10 Response time | No added network call or artificial wait. |
| 11 Miller | Two related bill choices grouped together. |
| 12 Proximity | Each label retains its explanation beside it. |
| 13 Similarity | Setup, profile and restaurant summary share labels. |
| 14 Serial position | Existing question and option order. |
| 15 Aesthetic–Usability | Existing visual system; no measured usability claim. |
| 16 Anchoring | No payment arrangement is preselected. |
| 17 Loss aversion | Saved choice IDs remain compatible. |
| 18 Scarcity | No new urgency or availability claims. |
| 19 Sunk cost | Both choices remain optional individually and editable. |
| 20 Postel | Profile normalization retains Halal and removes bill choices incompatible with a changed gender. |

Automated checks exercise saved Halal profiles, tagged and untagged venues, both sides' proposal restrictions, rendered gender-specific bill rows, accepting both options and incompatible bill choices. Local browser control remains disabled in Work settings, so a fresh two-theme/two-phone screenshot and contrast audit is unverified.

## Signup request-verification correction — October 20, 2026

The reported “Reload the app and try again” message was the app's pre-provider request-origin rejection. The account API now verifies a synchronizer token bound to a browser session, retaining explicit foreign-origin, Fetch Metadata, JSON-content-type and body/rate guards. Missing or opaque Origin is accepted only with valid browser-bound proof. Expired tokens renew once; provider errors and ambiguous transport failures are not replayed. Known sender-restriction/email-limit errors have specific copy. `pastDatesList`, found missing in a browser console trace from the earlier build, is restored with empty/history tab-rendering regressions.

UX principles for this narrow fix: Jakob/Similarity retain the existing forms and navigation; Hick/Von Restorff retain one submit action; Fitts/Miller retain existing target/text sizes; Zeigarnik/Loss aversion/Postel keep entered fields and renew expired proof without a forced reload; Doherty/Response time keep actual request feedback and bounded recovery; Tesler performs request validation for the user; Parkinson/Scarcity add no invented deadline; Peak–End/Serial position preserve account → profile → app; Proximity puts the error beside the form; Aesthetic–usability adds no cosmetic redesign; Anchoring/Sunk cost add no price pressure or navigation trap. No new visual quality or usability measurement is claimed.

Verification: full six-suite check passes, now including missing/null Origin with a valid token, cross-browser token substitution, expiration, callback-origin allowlisting, foreign origins, cross-site requests, content types and one-time client recovery. A real request to the running local signup route without Origin reached field validation with browser proof (400), while missing proof and an explicit foreign origin returned 403. These probes submitted empty bodies, never actual credentials or signup emails. The user then confirmed reaching “Check your inbox” after submitting the refreshed signup form; completing email confirmation and the first authenticated session remain unverified. Browser control was disabled in Work settings for this correction, so no fresh browser screenshots or phone/theme audit is claimed. The earlier screenshots/audit below describe the previous pass. Email-confirmation verifiers remain in server memory in this prototype, so restarting the server invalidates pending links.

## Newcomer, account and required-profile flow — October 20, 2026

New visitors see the concept and Create account / Log in only. Supabase account access (including email confirmation when required) precedes full-page profile creation. App tabs, notifications, avatar/settings, dates, availability and membership appear only after a valid profile is saved. Returning completed accounts enter Preferences. Incomplete accounts resume their own saved step. This explicitly overrides the supplied iOS skill's usual always-visible signed-in tabs rule **during required initial profile creation**, as requested by the founder; ordinary profile editing still keeps the tabs.

| Law | Application in this change |
|---|---|
| 01 Jakob | Familiar welcome, sign up, log in, setup and then stable four-tab navigation. |
| 02 Hick | Two entry choices; setup exposes only the current profile topic and its progression. |
| 03 Fitts | Inspected targets are at least 44px; Create account fits within the short phone's first screen. |
| 04 Von Restorff | One primary action per entry/setup screen; Show password and back/log out stay secondary. |
| 05 Zeigarnik | Five real steps; drafts resume on reload and are scoped to the authenticated account. |
| 06 Doherty | Immediate validation/press feedback; account requests show a busy state and prevent duplicate submissions. |
| 07 Tesler | Stage policy controls rendering, navigation and action dispatch instead of making users find setup. |
| 08 Parkinson | No invented signup countdown or time pressure. |
| 09 Peak–End | Saving the valid final profile opens Preferences and its app tabs. |
| 10 Response time | Existing shared springs/reduced-motion behavior retained; no forced animation delay on account responses. |
| 11 Miller | Concept in three short points; email/password in one group; five named profile topics. |
| 12 Proximity | Password hint/toggle next to password; validation next to the form; progress next to profile questions. |
| 13 Similarity | Existing warm palette, Georgia headings, filled inputs, Phosphor icons and pill actions reused. |
| 14 Serial position | Concept → account → profile → partner preferences; unrelated app destinations stay out of setup. |
| 15 Aesthetic–usability | Approved romance styling retained and visually inspected; no claim of measured usability or native quality. |
| 16 Anchoring | No promotional prices, sample ratings or membership anchors on account entry. |
| 17 Loss aversion | Back/reload retains profile drafts. Account changes clear transient UI and keep each person's local data separate. |
| 18 Scarcity | No fabricated people, demand badges or expiring offers. |
| 19 Sunk cost | Back returns from account forms; initial profile creation offers Log out, preserving its draft. No bypass into an incomplete app. |
| 20 Postel | Email whitespace normalized; passwords preserved exactly; specific errors, bounded requests and strict session validation. |

Verification: all six automated suites pass, including real local HTTP tests with a mocked Supabase provider. New checks cover origin/body/rate guards, opaque cookies, token refresh/logout, one-use PKCE callback, password preservation at the API, stage/action gates, legacy-data preservation and account-specific draft isolation. Real Supabase Auth settings were read successfully: email signup is enabled and confirmation is required. No real accounts or email sends were created during QA.

Browser: 51 phone layout observations at 390×844 / 375×668 CSS pixels, both themes, plus three preliminary wider-view observations. Coverage includes welcome, sign up/log in/validation, inbox confirmation, all five required-profile steps, actual photo chooser, Escape/reload, completion, returning login, logout and account switching. No recorded overflow, text below 12px, inspected targets below 44px or navigation leakage. Twelve flat-background contrast audits made 172 comparisons with no failures. Final captured error/warning log was empty. Artifacts: `qa/newcomer-audit.json`, `qa/newcomer-welcome-light.jpg`, `qa/newcomer-profile-dark.jpg`.

Limits: live email delivery and the project's redirect allowlist need an end-to-end check; README gives the callback configuration. Server sessions are memory-only, so a restart signs users out. Profile/date data remains browser-local. Physical iPhone safe areas/keyboard/reachability, VoiceOver, large/Dynamic Type, exhaustive composite/transient contrast and real-user testing remain open. Browser zoom rounds the short requested height from 667 to 668 pixels. This pass is local; it was not pushed or deployed.

## Current architecture and UX pass — October 20, 2026

The current app has **five profile steps and ten preference cards**. This pass preserves the approved romance/mystery palette, card shapes, Phosphor icons, motion and four tabs. It uses the supplied `iOSPremiumSkill.md` with the founder's explicit dating-app direction taking precedence over its financial-app colour examples. All changes remain local.

| # | Principle | Current application / limit |
|---|---|---|
| 01 | Jakob | Stable labeled Preferences, Dates, Availability and Profile tabs; fresh launches return home; answer tiles open the relevant setup step. |
| 02 | Hick | One topic per preference card, five profile steps, optional details disclosed progressively, preset public notes. |
| 03 | Fitts | Phone-size DOM checks cover 44px targets, persistent navigation and settled sheet clearance. File upload controls now have visible keyboard focus. Physical thumb reach remains untested. |
| 04 | Von Restorff | Existing rose primary actions and checkmarked choices remain. Profile completion and demo verification now have distinct meanings/icons. |
| 05 | Zeigarnik | Real step counts and recoverable drafts remain; corrupt optional state is repaired without discarding a valid booking. |
| 06 | Doherty | Immediate press feedback remains. Photos are stored once rather than rewritten on unrelated edits; image preparation has an explicit busy state. No device latency claim. |
| 07 | Tesler | One predicate checks both people's requirements. The app computes overlap and rechecks eligibility before confirmation after profile changes. |
| 08 | Parkinson | Only actual appointment/cancellation times create deadlines. Recognition notes use the date's Vancouver calendar day. |
| 09 | Peak–End | Confirmation and mutual reveal remain distinct endings. Reopening an archived mutual connection is a recommended next improvement. |
| 10 | Response time | Existing interruptible springs stay; completed/cancelled presses release both event listeners. Reduced-motion and keyboard paths remain. |
| 11 | Miller | Five named setup steps, ten topic cards and grouped profile settings; tested visible text remains at least 12px. |
| 12 | Proximity | Car details appear only beside driving; recognition, meal terms, fees and final consent stay next to their relevant decisions. |
| 13 | Similarity | Feature renderers reuse shared components, the existing icon family and shared motion instead of adding another visual system. |
| 14 | Serial position | Own profile → desired partner → save/explore → availability → introduction → mutual plan → date → consent-bound reveal. Tabs never reorder. |
| 15 | Aesthetic–usability | Existing warm art and colours are preserved. Browser inspection supports layout quality; it does not establish measured usability or native-iOS quality. |
| 16 | Anchoring | Full demo prices remain visible. Record access applies to one introduction; no fabricated venue partnership or perk was added. |
| 17 | Loss aversion | Failed storage commits keep the previous state/photos. Existing dates survive rescheduling; stale replies cannot replace consent. |
| 18 | Scarcity | No fabricated urgency was added. Fictional replies, membership, records and verification are explicitly demo behavior. |
| 19 | Sunk cost | Explore/rematch/cancel paths remain. Optional review detail still gates completion in the existing flow; a graceful skip/exit is recommended rather than marking this fully solved. |
| 20 | Postel | Hydration bounds malformed data, preserves valid drafts, normalizes old tags and validates actual file types/sizes. Consent and public-note allowlists stay strict. |

### Verification for this pass

- Final `npm run check` passed all four suites; `node --check server.mjs` and `git diff --check` passed. Suites cover shipped script order, existing rules, migration, photo deduplication/rollback, scoped unlocks, symmetric eligibility, date-scoped feedback/replies, mutual reveal, calendar-day privacy and 100-tap listener cleanup.
- Real-browser coverage used isolated localhost data at **390×844 and 375×668 CSS pixels, light and plum**. It covered all five setup steps, all ten preference cards, review, primary tabs, introduction/proposals, recognition/agreement, date phases, help, feedback, waiting, mutual reveal, record access and verification. Monthly/annual membership and local support flows also received functional checks.
- Actual interactions included file selection and reload, keyboard progression, horizontal drags in both directions, clipboard content, a second introduction of the same person, stale-draft profile editing and a persisted no-show adjustment. Only fictional people/contact details and local venue photographs were used. No real ID, payment, alert, report or external message was sent.
- Recorded layout checks found one defect: `.field-grid` overrode `[hidden]` on car fields. The root selector was corrected and rechecked. Other inspected states had no horizontal overflow, visible text below 12px, checked hit targets below 44px or settled sheet gaps below 16px. Final captured browser error/warning log was empty.
- Screenshot: `qa/architecture-review-home.jpg`. Coverage summary: `qa/architecture-review-audit.json`. Synthetic storage evidence: `qa/review-performance.json`. These ignored QA artifacts are local evidence, not production telemetry. Historical screen/contrast counts below belong to earlier passes and are not new measurements from this review.
- Only narrow layout/focus fixes and existing copy/components changed; no new colour system was introduced. This pass does **not** claim a new exhaustive contrast audit. Flat-background checks from earlier passes do not establish image/composite/transient contrast.

Still open: physical iPhone keyboard/safe-area/reachability, VoiceOver, large/Dynamic Type, exhaustive composited contrast and real-user testing. Browser zoom rounds the requested small height from 667 to 668 CSS pixels. A native implementation still needs platform screens and device adapters; local storage, fixture replies and local flags do not provide production identity, entitlements, moderation or reveal security. See `ARCHITECTURE-REVIEW.md` for the complete boundaries and next updates.

## Historical implementation notes (earlier passes)

The sections below retain the earlier design history. Their counts, step/card totals and verification claims describe those revisions, not the current October 20 audit.

The user's approved warm romance/mystery design stays: ivory, raspberry, peach, lilac and optional plum; Georgia headings, Phosphor icons, rounded cards and analytic spring motion. This revision changes the interaction: private self profile → desired-partner question deck → explicit save/explore choice → availability/venues → provisional introduction → mutually accepted plan → confirmed date. The home deck uses a compact heading so the actual question gets the space.

**Implemented locally; not committed, pushed or deployed.** The supplied `iOSPremiumSkill.md` guides components and interaction quality. The user's dating design direction overrides its literal financial-dashboard hero. The twenty laws from `LawsToFollow.jpg` are heuristics, not measured proof of usability or romantic outcomes.

| # | Law | Concrete application |
|---|---|---|
| 01 | Jakob | ✓ Four familiar labeled tabs: Preferences, Dates, Availability, Profile. Home is a question deck; profile setup gates searching. Bell, avatar and pushed-page back button retain familiar roles. |
| 02 | Hick | ✓ One personality topic per card; four own-profile steps; initially three restaurants with access to all five. Optional political details stay disclosed on demand. |
| 03 | Fitts | ✓ Large answer rows, 44px minimum targets, reachable fixed Previous/Next and persistent tabs; sheets settle 16px above the tabs. |
| 04 | Von Restorff | ✓ Raspberry/rose primary action, neutral secondary controls and checkmarked selections. No invented compatibility score. |
| 05 | Zeigarnik | ✓ Real question/step count, saved profile/proposal/availability drafts and resume actions. No arbitrary completion percentage. |
| 06 | Doherty | ✓ Immediate local feedback and synchronous draft saves; visible errors and saved states. The short search animation is explicitly a demo with Skip/Back controls; latency was not benchmarked. |
| 07 | Tesler | ✓ Matching compares both sides' bounds and bill comfort, prioritizes shared time/place and exposes conflicts for a voluntary decision. The user never has to compare fake scores. |
| 08 | Parkinson | ✓ Five scoped self-profile steps and ten partner cards. Only a confirmed demo appointment has a real cancellation cutoff; no preference urgency. |
| 09 | Peak–End | ✓ A possible connection becomes a clear reviewed plan, then a confirmed itinerary. A respectful rematch path follows a scheduling mismatch. |
| 10 | Response time | ✓ Existing spring feedback stays. Keyboard/reduced-motion paths settle promptly. Search cancellation/timer guards and reload recovery prevent a stranded animation. |
| 11 | Miller | ✓ Questions split personality topics, interests, values and practical bounds into named groups; supporting text stays at least 12px. |
| 12 | Proximity | ✓ Date ranges sit next to their selected days, venue choices next to dietary copy, bill terms in every proposal, and fees next to final consent. |
| 13 | Similarity | ✓ Consistent answer rows, form inputs, icons, proposal cards, buttons and state colours across both themes. |
| 14 | Serial position | ✓ Self-profile precedes partner preferences; save/explore follows review; mutual plan review precedes confirmation. Tab order remains fixed. |
| 15 | Aesthetic–usability | ✓ Approved colour and date-night art remain; screens were visually inspected alongside functional checks. No claim of measured usability or native iOS quality. |
| 16 | Anchoring | ✓ Editable suggested time/place, visible individual meal budgets, explicit own-meal versus covering-both terms, and full monthly/annual preview prices. No fake popularity or discounts. |
| 17 | Loss aversion | ✓ Draft recovery protects effort; changing an offer clears old acceptance. Safety/emergency fee exceptions stay visible. An original date remains during rescheduling. |
| 18 | Scarcity | ✓ No fabricated activity, scarce people or expiring offers. Inbox badges derive from saved sample events; the appointment countdown is based on an actual selected demo timestamp. |
| 19 | Sunk cost | ✓ Explore once leaves saved preferences intact. Voluntary adjustment, counteroffers, decline, rematch and abandoning an unconfirmed introduction remain available without a penalty. |
| 20 | Postel | ✓ Names tolerate spaces/accents; adult age, ranges, dietary tags and dates are validated. Invalid typed drafts survive recovery, incompatible old venues remain removable, corrupt storage recovers safely, and consent stays strict. |

## Verified

- `npm run check`: syntax and meaningful model/state checks pass. Coverage includes own-profile validation/minors, save versus explore snapshots, mutual eligibility, bills/diet, exact one-hour schedule overlap, conflicts, exclusion on rematch, proposal revisions and stale replies, counteroffers, central confirmation/fresh consent, preserved reschedules, draft reloads, legacy migration, Vancouver DST, cancellation boundaries, escaping and spring math.
- Browser: completed own profile, all seven home cards, explicit save and explore-once, saved-type recovery, specific date/range and venue selection, search, overlap and conflict introductions, voluntary adoption, custom proposal, draft reload, simulated counteroffer/accept/decline, rematch, horizontal browser drag in both directions, keyboard progression, confirmation, inbox navigation, keeping the original date during discussion, cancellation, dietary-change recovery and reset.
- 149 recorded layout/state checks and 120 computed-contrast checks cover both light/plum themes at 390 × 844 and 375 × 668 CSS pixels. Recorded checks include every profile step, optional politics, every question card, review, availability, introductions, explanation/proposal sheets, pending/counter/agreed plans and primary tab pages. No horizontal overflow, checked targets below 44 × 44, text below 12px or settled sheet gaps below 16px were found. Current audit records the actual page heading to identify the state checked.
- Computed text contrast passed against audited flat CSS backgrounds at the applicable 4.5:1 body / 3:1 large-text thresholds. The flat-background calculation flags the white welcome-photo heading in light mode because it cannot see the photograph and pseudo-element scrim. This is an image-compositing exclusion, not a verified flat-background failure: the image and existing dark scrim were inspected visually. Gradient profile decoration is also excluded. An exhaustive pixel-level image/transient contrast audit remains open.
- Browser console: no captured JavaScript errors or warnings in the tested session. Screenshot proof is in ignored `qa/flow-preference-cards.jpg`, `qa/flow-preference-cards-plum.jpg` and `qa/flow-agreed-plan.jpg`; audit records are in `qa/flow-redesign-audit.json`. Older `ios-*` images show the rejected design and are not this revision.
- The new deck was rechecked at both sizes/themes after its final compact heading change. A clean fictional profile was created from empty required fields for screenshots, then test data was reset before handoff.

## Tinder-inspired pass (October 19, 2026)

The founder supplied Tinder screenshots in `../Tinder/`. Only interaction and layout patterns were borrowed; no Tinder assets, photos or branding were copied. The product idea and all matching, agreement and booking logic are unchanged (`npm run check` passes unchanged). The four tabs stay.

| Tinder pattern | Applied here |
|---|---|
| Photo story bars and a card stack on Swipe | The preference deck has 7 story bars on the card and two stacked cards behind it. The swipe gesture is unchanged. |
| "Looking for [Women ›] in … ages [18–31 ›] within [100 km ›]" | Question 7 is a sentence builder with pill selects and inputs, using the same field hooks and validation. The review page repeats the sentence as tappable pills that jump back to that question. |
| The serif "Your vibe screams…" card | The review page has a rose "vibe" card: a playful read-back of the person's own answers, labelled "not a score". |
| Chat "Your turn" badge, red dot on the tab | Dates shows the introduction as a conversation row with a mystery avatar and a "Your turn"/"Waiting" pill. A red dot on Preferences appears only when the person needs to act. Both are derived from the existing session phase. |
| The plum "Well…" Explore card | Empty and declined states use a plum card with a serif headline and pink pill buttons. |
| Profile header, completion pill, fact chips, prompt/interest tiles, Platinum banner, grouped settings, Logout pill | The profile has an initial "photo" card, a green completion seal, a "Complete your profile" pill, scrolling fact chips (missing ones show +), 2-column answer and interest tiles with pencil circles, a blinddate+ banner, grouped settings and a full-width Reset pill. |
| The round ✓ on Settings and Preferences sheets | The profile and proposal sheets close with a round ✓ ("Save and close"). Other sheets keep ×. |

Not adopted, because they conflict with the product: photos and faces, Super Likes, Boosts, "Priority Likes" upsell claims, like counts, popularity numbers, "people who liked you", and the zodiac and photo-count filters. Laws 16 to 18 (anchoring, loss aversion, scarcity) rule out fabricated urgency or counts.

**Verified** in Chromium via Playwright:
- 390×844 and 375×667, light and dark themes.
- Screens: deck, sentence step, review, Dates with "Your turn", introduction, empty state, availability, profile and membership.
- No sideways overflow (one 4px chip-strip overflow at 375px was found and fixed).
- No text under 12px and no targets under 44×44.
- 34 new text/background pairs are at least 4.5:1.
- No JavaScript errors.
- Test data was cleared afterwards.

The only console warning is the existing unused welcome-photo preload.

## Lifestyle and background preferences (October 19, 2026)

The founder asked for drinking, workout ("healthy or not"), height, ethnicity/nationality and religion preferences, plus the other Tinder settings fields. This reverses the earlier "no height questions" rule at the founder's request.

**Added:**
- **Lifestyle:** drinking, workout and family plans. Each is an "about me" answer plus an optional partner requirement.
- **Height:** in cm, optional. "Taller" or "shorter than me" needs your own height.
- **Faith and ethnicity:** optional answers with "open to" lists. Empty means everyone; prefer-not-to-say is allowed but can't meet a specific requirement.
- **Ranking only:** languages, communication style and love style.
- **For fun:** zodiac, not used for matching.
- **Fixtures:** five more fictional sample people. Three of them have their own requirements (faith and drinking, faith, and height), which exercises mutual matching.

**Laws:**
- Hick: one topic per card, and the setup steps went from 4 to 5. Only the current step's label shows, so the step row fits a 375px phone.
- Tesler: these choices are optional and default to open.

**Verified:**
- `npm run check`, with new assertions for every new filter and for mutuality.
- 44 rendered screen, size and theme combinations: no overflow, no text under 12px, no target under 44px, no JavaScript errors.

## Trust, safety and the after-date reveal (October 19, 2026)

The founder asked for:
- the after-date reveal (share contact if both say yes, or say no and rate);
- ID and selfie verification;
- at least one required photo;
- ratings and comments, and fake-date reports;
- safety check-ins;
- a "how you'll find each other" note that can't leak Instagram, TikTok, ads or acrostics;
- no-show records;
- "slightly outside my preferences";
- paid access to ratings, records and the stretch option (C$1–2 per first date, or free with a subscription).

**Design decisions:**
- **Recognition note:** picked from lists, not filtered free text. A filter can always be out-guessed (acrostics, misspellings, other languages); lists can't be.
- **Proposal notes:** became presets for the same reason. `Trust.leak()` stays as a second check on anything sent.
- **Reviews:** public reviews are star ratings plus preset tags. The free-text note is private to the team. That stops contact details and insults spreading through comments.
- **Ratings and reports:** labelled "reviewed before they affect a record", because one angry review shouldn't sink someone without moderation.
- **Paywall boundaries:**
  - Safety tools stay free for everyone: check-in, the help sheet, trusted contact, verification, and reporting.
  - Giving ratings is free. Charging for it would starve the records of data.
  - Seeing ratings is paid: C$1.99 per introduction, or blinddate+.
  - The stretch option is blinddate+ only.
- **Stretch limits:** stretching only widens age (±3) and distance (+10 km, within the 50 km cap). Faith, background, drinking, family and other deal-breakers never stretch, and stretched introductions are labelled.
- **ID images:** in this prototype the verification images are never read or stored.

**Verified:**
- `npm run check` covers:
  - 16 leak attempts blocked, including leetspeak, spaced letters, spelled-out numbers and acrostics;
  - every preset note and ordinary plans allowed;
  - the recognition note required before confirming, and car details when arriving by car;
  - feedback validation, mutual reveal, no-show ranking, and labelled stretch only with blinddate+.
- Playwright audit: 60 new screen, size and theme combinations (wizard photos, verification, locked and unlocked records, recognition note, before/during/after the date, help sheet, feedback, waiting, reveal, past dates, stretch toggle, membership, profile). No overflow, no text under 12px, no target under 44px, no JavaScript errors.
- New text passes 4.5:1 contrast in both themes. The earlier 44-scene audit was rerun and also passes.

**Not real yet:**
- verification provider;
- payments;
- moderation queue;
- delivery to the other person;
- automatic check-in timing;
- emergency alerts;
- a server-side leak filter (it must run on the server in a live app, not only in the browser).

## UX pass after the account and onboarding changes (October 20, 2026)

A full walkthrough (welcome, sign-up, setup, deck, review, availability, search, introduction, proposal, agreement, dates before/during/after, profile, membership) found six things working against the goal: a quick personality deck, then one agreed plan, then a real first hello.

| Finding | Change | Laws |
|---|---|---|
| A raspberry box flashed around every page title after navigation (programmatic focus for screen readers) | Headings focused with `tabindex="-1"` no longer draw a focus ring; real controls keep theirs | Aesthetic–usability |
| The 10-card deck needed two taps per card | Single-choice cards advance about 0.4 s after an answer is tapped; multi-select and form cards still use Next; Back/swipe still revisit | Fitts, Doherty, Zeigarnik |
| The introduction buried its one job (agree on a plan) under a large locked "record" block and a schedule comparison that repeated the suggested plan | The plan comes first. The comparison folds into "Compare both schedules" when a shared plan exists (still shown open when plans differ). The locked record is one row: "Their rating & show-up record · C$1.99 · Unlock", with "Included with blinddate+" below | Hick, Serial position, Von Restorff |
| The Dates countdown, the most anticipatory element, sat near the bottom | The countdown is the hero at the top. Cancellation terms sit under "Manage your date", next to Request change / Cancel | Peak–end, Proximity |
| Profile "My record" looked editable (pencil) and left an orphan tile; one photo stretched full width | A read-only stat strip (dates · no-shows · late cancels; red only when above zero) under the header chips, like Tinder's counts row. Six even tiles. Photos show as a 3-slot portrait grid with empty slots | Similarity, Jakob |
| The recognition-note dropdowns cut off "Nothing else" / "Not saying" | Placeholders are now "None" / "Skip" | Postel |

**Verified:**
- `npm run check`: all 7 suites pass.
- Playwright walkthrough: 18 screens × 390×844 and 375×667 × light and dark. No sideways overflow, no text under 12px, no target under 44×44, no JavaScript errors.
- A real click on a deck answer advanced to card 2.
- Page titles report no focus outline.
- One regression from an older full-width `.trust-card.locked .button` rule was found in a screenshot and removed at its source, along with the unused `.trust-blur` styles.

The walkthrough simulated a signed-in user in the browser (`activateAccount`); no Supabase account was created.

## Still open

Physical iPhone safe areas, real touch drag feel/reachability, keyboard overlap, large/Dynamic Type text, VoiceOver order/announcements, exhaustive image/composited/transient contrast and real user testing. The browser's 90% zoom rounds the small requested height to 668 rather than exactly 667 CSS pixels. Screenshot capture below a supported physical width is unavailable, so screenshots use the supported phone presentation while DOM checks verify the exact CSS widths above.

All counterpart identities, schedule windows, venues, ratings, replies, notifications, reservations, subscriptions and fees are simulated fixtures. The backend is a documented local model, not a live service. No live service was changed.
