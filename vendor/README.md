# Vendored libraries

Served from this site so no third-party CDN sees who presents what. Both are loaded only when a file of that kind is opened, and both run entirely in the browser: the file never leaves the device.

- `pdfjs/pdf.min.mjs` and `pdfjs/pdf.worker.min.mjs`: [pdf.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) 6.5.438, Apache-2.0 licence, Copyright Mozilla Foundation. Unmodified `build/` files. Licence in `pdfjs/LICENSE.txt`.
- `pptx-renderer/aiden0z-pptx-renderer.browser.es.js`: [@aiden0z/pptx-renderer](https://github.com/aiden0z/pptx-renderer) 1.4.0, Apache-2.0 licence. Unmodified standalone browser build (bundles JSZip and ECharts). Licence in `pptx-renderer/LICENSE.txt`, third-party notices in `pptx-renderer/THIRD_PARTY_NOTICES.md` and `pptx-renderer/licenses/`.

Chosen 9 Nov 2026 over `pptx-preview`, which renders well but is closed source (its README says the source is paid and may not be republished), which doesn't fit an open-source Ellenial app.

To update: `npm i pdfjs-dist@<v> @aiden0z/pptx-renderer@<v>` in a scratch folder, copy the same files over, bump `VERSION` in `sw.js`, and test a PowerPoint and a PDF.
