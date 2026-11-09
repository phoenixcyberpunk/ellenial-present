# Present · Project Guide

Read this first in every session. Present is an Ellenial app: open a PowerPoint, PDF or pictures in the browser and show them full screen, so a cable or the device's own mirroring puts them on a TV. Project notes live in the claude.ai Project "Ellenial - Brand identity - Master", doc `claude/ellenial-idea-present.md` (idea, mock-up, decisions).

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
- **Screen stays awake from the first tap, not only while presenting** (Ellen, 09:05): presenters talk first and forget to start presenting, and a locked room PC means someone runs over to log in. Screen Wake Lock, asked for again on every tap and on returning to the tab; fallback a 2 s muted looping 16 px video (`media/keep-awake.mp4`). The "Screen stays on" chip turns it off. Honest limits: only while the tab is showing; a work laptop's lock policy may still win. **That's fine and stays so** (Ellen, 09:50: "lock screens are automatic for a reason"): never simulate input, never suggest mouse jigglers or other ways around a forced lock, no nudges to "use presentation mode".
- Presenting: black stage, slide letterboxed, controls fade after 2 s. Right half = next, left half = back, swipe, arrows, PageUp/PageDown (clickers), Space, Home/End, F full screen, B or . black screen, Esc leaves full screen then ends. End goes back to the "Ready" view with the file still open.
- Closed-source `pptx-preview` was tried and rejected: it doesn't fit an open-source app.
- Icon: placeholder (a plain screen glyph on slate #D6D9E0) until Ellen draws one. Tile colour not decided.
- Languages: English (main) and Swedish (`lang.js`, keyed by English). The app is called Present in both.

## Brand
- Tokens copied from ellenial quiz (`styles.css` top); fonts self-hosted in `fonts/`; `ellenial-theme.js` and `ellenial-help.js/.css` copied unchanged (key `ep:theme-pref`).
- Header: small "Ellenial" eyebrow above "Present"; tab title "Present · Ellenial"; footer credit line "Drawn and designed by me, coded with the help of AI."

## Testing
- Local server must send the same headers as `vercel.json` (CSP!). Playwright + Chrome (/usr/bin/google-chrome): open the test .pptx, PDF and three pictures, present, arrows, Esc, controls fade, Swedish, old .ppt message, wake lock on/off. Playwright's `wait_for_function` is blocked by the CSP (no eval): poll with `evaluate` instead.
- To do on real devices: iPhone (incl. Low Power Mode) with AirPlay, iPad, Android Cast, Mac, Windows + K, a locked-down work laptop; Ellen's own PowerPoint that failed at home.
