# blinddate prototype

A personality-first blind dating prototype with the approved romance/mystery identity: ivory, raspberry, peach, lilac and an optional plum theme. Faces stay hidden. The home experience is a swipe-style deck about the person you would like to meet, after completing your own private profile.

Four persistent tabs: **Preferences / Dates / Availability / Profile**. There is no separate Matches tab. An introduction stays inside the Preferences flow until both people agree on one exact plan; confirmed dates live in Dates. Only one active date is supported in this prototype.

This is a **demo with simulated services**; publishing its source does not deploy a live service. The supplied iOS skill informs shapes, icons, touch targets, sheets and spring motion; the user's approved dating identity overrides its literal finance-dashboard example. [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) records the latest structural review, fixes and next steps. [FLOW-MODEL.md](FLOW-MODEL.md) documents the data and agreement rules. [UX-PRINCIPLES.md](UX-PRINCIPLES.md) records the law-by-law review and verification limits. [ASSET-NOTES.md](ASSET-NOTES.md) records artwork and provenance.

## Run locally

Requires Node.js 18 or later. No dependency installation is needed.

```sh
npm run dev
```

Open http://localhost:4173. To check the JavaScript and domain behavior:

```sh
npm run check
node verify.mjs
```

`dist/` is the complete static application. Models, state hydration, persistence, image processing and feature renderers are separate; see the architecture review for responsibilities. Schema v3 migrates earlier local data without dropping valid photos or dates. `server.mjs` is a small local preview server; it is not a production backend.

## Interactive flows

1. **Who you are:** five private setup steps (You, Background, Vibe, Interests, Bill). Drafts resume at the saved step.
   - **Required:** adult age, gender, education, languages, energy, activity, workout, pets, smoking, drinking, diet, interests, values, intentions, family plans and bill comfort.
   - **Optional:** work or study, height (cm), religion, ethnicity, zodiac, political views, communication style and love style.
   - **Privacy:** background answers are used only for matching and never shown on an introduction.
2. **Who you would like to meet:** ten home cards.
   - **The cards:** weekend pace, workout, social energy, pets, shared interests, values, lifestyle must-haves (smoking, drinking, politics), family plans, faith and background, and finally gender, age range, height, distance and intentions.
   - **Faith and background:** these are "open to" lists, and an empty list means everyone. Someone who prefers not to say isn't introduced to a person who requires a specific answer.
   - **Height:** "taller" or "shorter than me" needs your own height.
   - **Mutual:** every requirement is checked in both directions.
   - **Ranking only:** shared languages and communication or love style raise a match but never exclude anyone.
   - **Controls:** swipe horizontally, use the arrow keys on the card grip, or use Previous/Next.
   - Your own profile and your desired-partner answers are kept separate.
3. **Save or explore once:** Save my type explicitly stores reusable preferences. Explore just this time uses the draft answers without changing a previously saved type. Drafts still persist locally for recovery. Use saved type restores the saved answers.
4. **When and where:** choose specific dates, editable time ranges of at least one hour, and one or more of five fictional venues. Dietary tags filter venues. Changed dietary needs leave earlier incompatible selections visibly removable. Time is explicitly America/Vancouver.
5. **Search:** a short, labeled demo animation precedes local matching. Cancel and Skip are available. Matching checks both sides' age/gender/distance, compatible intentions, desired personality/lifestyle boundaries, and bill comfort. Desired shared interests and values rank remaining introductions. Shared time/place is prioritized; a schedule conflict still permits an introduction.
6. **Agree on the plan:** compare both sets of dates/ranges and restaurant choices. Adopt theirs, ask them to try yours, or propose another date/time/place/bill arrangement with a short note. A clearly labeled demo reply control simulates accepting, countering or declining. Every changed offer has a new revision and resets the other person's acceptance. Both must accept the same revision before fresh review and confirmation.
7. **Dates:** view/copy the itinerary, request a change, cancel, or open safety information. An existing confirmed date remains until a replacement is mutually accepted and confirmed. An unconfirmed declined introduction can rematch without a cancellation fee.
8. **Trust & safety** (`dist/trust.js`, tested in `verify.mjs`):
   - **Photos:**
     - at least one photo is required (up to 3);
     - photos are stored as separate local assets and hidden until a mutual yes after the date; routine draft saves do not rewrite them.
   - **ID + selfie verification:** a demo only. The images are never read or stored. Your date sees a Verified badge.
   - **Recognition note:** before confirming a date, each person builds "how you'll recognise me" from lists (colour, clothing, extra, how you'll arrive, car colour and type). It's never free text, so nothing can be smuggled in. Theirs appears on the day.
   - **No contact details before the reveal:**
     - proposal notes come from a preset list;
     - `Trust.leak()` flags common @handles, links, emails, spoken/digit phone numbers and obfuscations. The public-field allowlist is the main constraint; frontend heuristics cannot establish production security or block every possible encoded message.
   - **During the date:**
     - a safety check-in ("I'm okay" / "I need help");
     - the help sheet offers 911, alerting a trusted contact, and reporting;
     - you can save a trusted contact and share where and when you're meeting.
   - **After the date:**
     - did they show up? A no-show goes on their record;
     - a 1–5 star rating and description/conversation tags (no photo comparison before reveal);
     - a fake-profile report;
     - a private note to the team;
     - "see them again?" with the contact to share. Date-scoped photos/contact reveal requires valid submitted feedback and both yes answers. Stale replies are ignored.
   - **Records:** no-shows and late cancellations lower sample priority; local demo counterpart no-show adjustments persist. Real counterpart reports and moderation are not connected.
   - **Paid** (demo, no payments):
     - seeing someone's rating, show-up record and reviews before meeting costs C$1.99 per introduction, or is included in blinddate+;
     - "show me people slightly outside my age and distance if there's no one" is blinddate+ only. It stretches age by 3 years and distance by 10 km; deal-breakers never stretch.
     - Safety, verification and giving ratings stay free. Per-introduction record unlocks do not become lifetime access to that person.
   - **Demo controls:** "jump in time" on the Dates tab lets you try before, during and after a date.

Bill options distinguish **each pays for their own food and drinks** from splitting a combined total. A man can accept paying his own or offer to cover both. A woman can accept paying her own or the other person covering both. Non-binary/unspecified profiles can choose all three arrangements. More than one acceptable option is allowed. An offer to pay is never inferred as acceptance by the other person.

Profile also contains theme, membership previews (C$29.99 monthly / C$299.99 annual, no checkout), safety/report previews and Reset. Notifications are saved local events and navigate to the relevant current flow. Every fresh launch opens home. Reloading an unfinished search returns to planning; restored proposals require fresh final consent.

## Prototype boundaries

This is a frontend prototype, not a live dating service. There is no authentication, server database, real matching pool, person-to-person delivery, push notifications, reservation, payment processing, verification, live venue data, geocoding/routing, neighborhood-safety score, or monitored support. All partner replies, people, venues, ratings and availability are fictional sample data. The proposed first-introduction fee is C$0; meals/drinks are separate. No actual subscription or cancellation fee is charged.

The model uses a small fixture pool and cannot promise a match. Geography is a sample distance field rather than actual coordinates. All fixture partners accept all genders and ages 18–55, while the model supports mutual preferences. A suggested meeting is one hour; custom offers can be outside saved availability because both sides must explicitly accept a change. Time ranges do not span midnight. Vegan and other dietary support is illustrative, not allergy verification.

Use fictional information. Browser localStorage is not a production private-profile datastore. Production work needs authenticated accounts, protected data storage, server-authoritative matching/proposal revisions and consent, delivery/notification infrastructure, identity/moderation support, real venue/dietary data, and calendar conflict handling. Membership/fee policies remain product proposals.

## Design references and assets

The interaction design draws on [Hinge's personality prompts](https://hinge.co/newsroom/prompt-feedback) and [Breeze's date-planning flow](https://www.breeze.social/faq), with an original visual identity and hidden introductions.

The heart logo is original SVG. Icons use locally bundled [Phosphor](https://github.com/phosphor-icons/core) SVG paths under MIT; the license is in `dist/assets/phosphor-LICENSE.txt`. `build-icons.py` regenerates the subset from the official repository. Spring math follows the analytic response/damping model described by [b3ll/Motion](https://github.com/b3ll/Motion). Illustrative venue photos are from Unsplash:

- https://images.unsplash.com/photo-1414235077428-338989a2e8c0
- https://images.unsplash.com/photo-1554118811-1e0d58224f24
- https://images.unsplash.com/photo-1517248135467-4c7edcad34c4

Photos, icons and code are bundled locally. Typography uses Georgia display headings and the system font stack for body text and controls. The application makes no external requests during use.

## Hosting

`.openai/hosting.json` records the owner-private Site identity and serves `dist/`. Keep that identity for future updates.
