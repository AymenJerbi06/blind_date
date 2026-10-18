# UX redesign: all 20 principles, in the image's order

The image supplied by the user is a list of UX principles, not a visual style specification. This redesign applies the principles to the dating task. The last category is applied to prevent manipulative behavior. These are design heuristics, not a claim that an interface guarantees romantic success or that a particular number of choices is universally optimal.

| # | Principle | Change implemented | How to inspect it |
|---|---|---|---|
| 01 | Jakob’s Law | Familiar Discover / Dates / Profile / Membership navigation; recognizable pass and plan actions; ordinary Back, Continue and Close controls. | Switch tabs on desktop and phone. Plan a date using the persistent navigation. |
| 02 | Hick’s Law | One dominant action on the introduction card. Venue selection initially shows three suggestions, with progressive disclosure of all five. Optional political preferences are collapsed. | Open the planner, then expand all venues. Open profile step 2. |
| 03 | Fitts’s Law | At least 44px interactive targets for navigation, filters, close controls and choice chips; 48px primary buttons. Wizard actions stay in a sticky footer near the bottom on phones. | Inspect target dimensions and use the planner at 390px and 320px widths. |
| 04 | Von Restorff Effect | A strong magenta fill identifies the primary action. Secondary buttons use outlines. Selection is communicated with borders, checkmarks and pressed states, as well as color. | Compare Plan a date with Pass and Why this match. Select a venue. |
| 05 | Zeigarnik Effect | Real unfinished profile and planning drafts persist between visits. The UI names the saved step; it does not invent completion percentages. Closing saves; finishing clears the draft. | Type a different name, close, reload and resume. Repeat for venue/time choices. |
| 06 | Doherty Threshold | Local interactions update synchronously. Visual transitions are 120ms. No artificial waiting screens, delayed reveals or network dependency for navigation. | Select chips and filters; check immediate pressed states. Browser testing records interaction behavior; no universal latency guarantee is claimed. |
| 07 | Tesler’s Law | The prototype suggests a venue and an overlapping time so users can accept or change a complete starting point. Local filtering handles diet and budget; the review assembles details and the exact cutoff. | Enter the planner: a suggested venue and time are already selected. Availability remains explicitly simulated. |
| 08 | Parkinson’s Law | Profile setup and planning each have three bounded steps, with optional preferences separated. Users can save and leave without a fabricated deadline. | Check the step tracker and Save & close action. There is no time limit on setup. |
| 09 | Peak–End Rule | Confirmation leads with “You’re all set,” a clear demo confirmation, the venue and a readable itinerary. Management and cancellation remain easy to find afterward. | Complete the booking and view Dates. |
| 10 | Response Time | Selected states, disabled confirmation until consent, local save feedback, and success receipts explain the result of an action. No fake loading spinner. | Select an interest, toggle consent, confirm, and copy the itinerary. |
| 11 | Miller’s Law | Three-stage flows and three concise match foundations reduce the amount users must hold in memory. The review keeps venue, cost and cancellation information together. This does not treat 7±2 as a literal universal UI limit. | Open Why this match and the final booking review. |
| 12 | Law of Proximity | Related venue details share a single row; labels sit directly above fields; pricing and billing language are adjacent; cancellation information precedes confirmation. | Inspect venue cards, Profile and Membership. |
| 13 | Law of Similarity | Shared spacing, type, button, input, selection and status tokens across all four pages and dialogs. Comparable controls look and behave alike. | Compare profile choices, time choices, venue filters and billing choices. |
| 14 | Serial Position Effect | Each flow begins with the current task, presents related detail next, and ends with a clear action. The first introduction and final cancellation terms are visible where decisions occur. | Scan the introduction, wizard headings and review footer. |
| 15 | Aesthetic–Usability Effect | A restrained high-contrast system replaces the decorative dashboard: larger headings and body text, a single focal introduction, original abstract artwork, consistent alignment and fewer competing panels. | Compare desktop and phone screenshots. Appearance is paired with functional checks, not treated as proof of usability. |
| 16 | Anchoring Effect | Real monthly and annual totals appear prominently. Annual billing, equivalent monthly amount and approximate savings are explained together. No crossed-out invented price, hidden upfront annual amount or “most popular” claim. | Toggle Monthly / Yearly on Membership. |
| 17 | Loss Aversion | Passing before booking is free. Cancellation shows the applicable example fee before the final action. Safety/emergency waivers are explicit; no guilt copy or retention maze. | Pass an introduction, then inspect a booked date’s cancellation screen. |
| 18 | Scarcity Effect | Removed fake online indicators, pseudo-notifications and an unearned date badge. No limited-stock matches, reset countdowns or expiring offers. The date countdown represents a real selected demo appointment only. | Browse Discover and Membership; Dates gets a badge only after a confirmed demo booking. |
| 19 | Sunk Cost Fallacy | Back, Save & close, pass and cancellation remain accessible regardless of progress. Drafts preserve effort without using it as pressure to finish or pay. | Leave each wizard and return later; cancel without a retention detour. |
| 20 | Postel’s Law | Forgiving names, whitespace normalization, explicit field-level age/range errors, preserved typed answers, defensive browser-storage loading and valid saved-draft checks. Consent remains strict and is never restored automatically from a draft. | Try an accented name, an invalid age range, a reload and a resumed review. Domain checks cover malformed data and fresh consent. |

## Validation

- `node --check dist/core.js` and `node --check dist/app.js`.
- `node verify.mjs`: 50 passing checks for eligibility, input handling, dietary filters, storage recovery, saved drafts, consent, progressive disclosure, pricing clarity, DST and cancellation boundaries.
- The browser checklist is desktop/narrow-phone layouts, keyboard focus and modal containment, setup resumption, booking, cancellation and billing previews. Browser verification of this redesign is currently **unverified**: the browser tool denied access to the existing local preview under its URL/access policy. The earlier version's screenshots are not evidence for this redesign.
- All people, venue names, ratings, availability and bookings remain fictional. No real payments, reservations or reports occur.

## References

The supplied image determines the checklist. Terminology was cross-checked against the [Laws of UX collection](https://lawsofux.com/). The implementation and validation descriptions above refer to this prototype, not promises derived from that source.
