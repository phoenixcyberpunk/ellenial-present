# Present · Project Guide

Read this first in every session. Present is an Ellenial app: open a PowerPoint, PDF or pictures in the browser and show them full screen, so a cable or the device's own mirroring puts them on a TV. Project notes live in the claude.ai Project "Ellenial Present", doc `ellenial-idea-present.md` (idea, mock-up, decisions, log). Linked on ellenial.app as Alpha since 9 Nov, 20:42, with Ellen's drawn icon on the library card since 9 Nov.

## Infrastructure
- **Code:** GitHub `phoenixcyberpunk/ellenial-present` (public, AGPL-3.0).
- **Hosting:** Vercel team "The Ellenial Project" (`the-ellenial-project`), project `ellenial-present`, domain `present.ellenial.app`.
- **Stack:** plain HTML/CSS/JS, no build, no backend, no database. `app.js` is an ES module; the readers are imported only when a file of that kind is opened.
- **Libraries:** `vendor/pdfjs` (pdf.js 6.5.438) and `vendor/pptx-renderer` (@aiden0z/pptx-renderer 1.4.0), both Apache-2.0, see `vendor/README.md`.

## Decisions (9 Nov 2026)
- Ellen's idea (08:04) from real life: a PowerPoint at home without a cable didn't open; she had to remake it in Google Slides. Mock-up approved 08:46: https://claude.ai/artifact/7vubwgP4LrF135aDD53Wt3
- One device: the file never leaves the phone, iPad or laptop. A cable or the device's own mirroring (AirPlay, Cast, Smart View, Windows + K) puts it on the screen. No codes, no QR, no server.
- Must work for laptops and iPads too, and for files someone just sent you (off-sites, old conference laptops without PowerPoint).
- Formats: .pptx (and .ppsx/.pptm/.potx) via pptx-renderer, PDF via pdf.js, pictures (sorted by file name). Old .ppt, Keynote and .odp get a friendly "save it as .pptx or PDF" message. Google Slides, Keynote and Canva get "save as PDF" guide chips.
- **No stay-on screen** (Ellen, 9 Nov, 20:10: "just remove it"). It was built at 09:05 (Screen Wake Lock from the first tap plus a muted-video fallback) and removed because it "works a little too well". The screen follows the device's own sleep and lock settings. Still true: never simulate input, never suggest mouse jigglers or other ways around a lock, no nudges to "use presentation mode" (09:50: "lock screens are automatic for a reason").
- Presenting: black stage, slide letterboxed, controls fade after 2 s. Right half = next, left half = back, swipe, arrows, PageUp/PageDown (clickers), Space, Home/End, F full screen, B or . black screen, Esc leaves full screen then ends. End goes back to the "Ready" view with the file still open.
- Closed-source `pptx-preview` was tried and rejected: it doesn't fit an open-source app.
- Icon: Ellen's drawing (9 Nov: a phone and a big screen with ticks, an arrow between them) on the Ellenial tile: cream #FFFBF5 square, apricot circle #F6D2BF. Same as the card on ellenial.app; original in the ellenial repo, art/drawings/present.png. Maskable icon has the circle and drawing at 80% for the safe zone.
- Languages: English (main) and Swedish (`lang.js`, keyed by English). The app is called Present in both.
- **Visit counter** (9 Nov, 20:10, before linking on ellenial.app): `visit-counter.js`, copied from ellenial.app's. One +1 per device per Stockholm day, only on present.ellenial.app, no id or cookie. Server: `public.present_count_visit()` in the shared Supabase project (gillefeeling, `knvrvmqdxvcatsrvkrgx`), schema `ellenial_present`, migration `present_daily_visits`, same as Quiz/Poll/Bingo. The CSP's `connect-src` allows only that Supabase host. Footer says so.

## Security review (9 Nov 2026, 20:10, before linking)
- Headers: CSP without `unsafe-inline`/`unsafe-eval` (only `wasm-unsafe-eval` for the readers), no framing, HSTS, no referrer, `screen-wake-lock=()`.
- Tested with a booby-trapped .pptx (HTML in text, chart labels and titles; `javascript:` links on text and shapes) under the real headers: everything shows as text, nothing runs; the reader doesn't make slide links clickable. An injected inline handler, a `javascript:` link and an outside image were all blocked by the CSP (outside images can't reveal who opened a file).
- Readers: vendored files byte-identical to npm (pdfjs-dist 6.5.438, @aiden0z/pptx-renderer 1.4.0); `npm audit` 0 vulnerabilities (incl. bundled JSZip, ECharts). pdf.js runs with `isEvalSupported: false`. Apache-2.0 licences and third-party notices ship in `vendor/`.
- Only innerHTML in our own code: fixed icon SVG strings. File names are always set as text.
- Fixed in the review: 4:3 decks were cut off at the top of the Ready preview.

## Brand
- Tokens copied from ellenial quiz (`styles.css` top); fonts self-hosted in `fonts/`; `ellenial-theme.js` and `ellenial-help.js/.css` copied unchanged (key `ep:theme-pref`).
- Header: small "Ellenial" eyebrow above "Present"; tab title "Present · Ellenial"; footer credit line "Drawn and designed by me, coded with the help of AI."

## Testing
- Local server must send the same headers as `vercel.json` (CSP!). Playwright + Chrome (/usr/bin/google-chrome): open the test .pptx, PDF and three pictures, present, arrows, Esc, controls fade, Swedish, old .ppt message. Playwright's `wait_for_function` is blocked by the CSP (no eval): poll with `evaluate` instead.
- To do on real devices: iPhone (incl. Low Power Mode) with AirPlay, iPad, Android Cast, Mac, Windows + K, a locked-down work laptop; Ellen's own PowerPoint that failed at home.
