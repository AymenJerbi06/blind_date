# blinddate prototype

A responsive, interactive prototype of a personality-first blind dating service. Warm cream, coral, and plum styling; card-based introductions; a persistent desktop sidebar and mobile bottom navigation.

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

`dist/` is the complete static application. `server.mjs` is a small local preview server; it is not a production backend.

## Interactive flows

- Three-step private profile setup: identity, intentions, interests, values, diet, optional politics, age preferences, smoking preference, and travel radius. No height questions.
- Local sample matching filters age, desired gender, distance, smoking, and relationship intention, then ranks shared interests and values. The fixture people accept all genders. Political compatibility, routing, verification, and real candidate eligibility are not implemented.
- Introduction explanation, decline, and a different sample introduction.
- Five fictional restaurant/café options; dietary and budget filters; date and time selection; explicit simulated confirmation.
- Date details, live countdown, copying an itinerary, rescheduling, cancellation, and safety/emergency exceptions. Vancouver scheduling handles daylight saving changes, and the cancellation cutoff is exactly 24 elapsed hours before the date.
- C$29.99 monthly / C$299.99 annual membership previews. No checkout.
- Safety information and a report preview that does not transmit or save report contents.
- Preferences, booking, and selected demo plan persist in browser localStorage. Reset is available in Your world.

## Prototype boundaries

This is a frontend prototype, not a live dating service. There is no authentication, backend, payment processing, identity verification, actual reservation, live venue information, monitored support, or real person-to-person communication. Partner acceptance is simulated. All venue names, ratings, review counts, budgets, travel times, and people are fictional fixtures. No real subscription or cancellation fee is charged. The first-introduction service fee is waived; meals and drinks are separate.

Use sample information while exploring. The membership and cancellation policies are product proposals, not production terms. A production implementation will need legal/payment review, real reservation integrations, consent and data-retention controls, moderation, accessibility review, and operational support.

## Design references and assets

The interaction design draws on [Hinge's personality prompts](https://hinge.co/newsroom/prompt-feedback) and [Breeze's date-planning flow](https://www.breeze.social/faq), with an original visual identity and hidden introductions.

The hero illustration, logo, and icons are original inline SVG. Illustrative venue photos are from Unsplash:

- https://images.unsplash.com/photo-1414235077428-338989a2e8c0
- https://images.unsplash.com/photo-1554118811-1e0d58224f24
- https://images.unsplash.com/photo-1517248135467-4c7edcad34c4

Photos are bundled locally. DM Sans and Manrope load from Google Fonts, with system font fallbacks. The application itself makes no API calls.

## Hosting

`.openai/hosting.json` records the owner-private Site identity and serves `dist/`. Keep that identity for future updates.
