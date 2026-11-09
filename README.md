# Present · Ellenial

Show a PowerPoint, a PDF or pictures on any TV, without a cable, an account or PowerPoint.

1. **Choose your presentation.** It stays on your phone or computer. Nothing is uploaded.
2. **Put it on the screen.** Cable? You're set. No cable: Screen Mirroring on iPhone, iPad and Mac, Cast or Smart View on Android, Windows + K on Windows.
3. **Present.** Tap right for next, left for back, or use the arrow keys or a clicker. Your screen stays awake. Close the tab and it's gone.

Made for the moments when presenting is needlessly hard: a PowerPoint at home with no cable, a file someone just sent you at an off-site, an old conference laptop without PowerPoint.

## How it works

- Plain HTML, CSS and JavaScript, no build step, no backend, no database.
- The file is read in the browser (`File.arrayBuffer()`), drawn by [pdf.js](https://github.com/mozilla/pdf.js) or [@aiden0z/pptx-renderer](https://github.com/aiden0z/pptx-renderer), and dropped when the tab closes. Nothing is sent anywhere, nothing is stored, no analytics.
- The screen is kept awake from the first tap (Screen Wake Lock, with a tiny muted looping video as a fallback), not just while presenting, so an intro or a forgotten "start presenting" never ends with a locked room PC. The chip "Screen stays on" turns it off.
- Works offline after the first visit (service worker, readers included).
- English and Swedish (`lang.js`), Auto / Light / Dark (`ellenial-theme.js`), the shared "?" help (`ellenial-help.js`).

## Run it locally

Serve the folder with any static server, for example `python3 -m http.server`, and open it. Test with `?lang=sv|en` and `?theme=light|dark` (not saved).

## Licence

Code: AGPL-3.0 (see `LICENSE`). The Ellenial name and logo: see `TRADEMARK.md`. Vendored libraries: see `vendor/README.md`.

Drawn and designed by Ellen Nilsson, coded with the help of AI.
