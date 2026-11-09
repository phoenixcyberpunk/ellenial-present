/*! Present · an Ellenial app · AGPL-3.0 · https://github.com/phoenixcyberpunk/ellenial-present
 *
 * Open a PowerPoint, PDF or pictures in the browser and show them full screen, so a cable or the
 * phone's own screen mirroring can put them on a TV. The file never leaves this device: it is read
 * here, drawn here, and dropped when the tab closes. No server, no account, nothing saved.
 *
 * The screen follows the device's own sleep and lock settings (Ellen, 9 Nov 2026: the stay-on
 * screen was removed; it worked a little too well).
 *
 * Libraries (served from this site, loaded only when needed): pdf.js (Apache-2.0) for PDFs and
 * @aiden0z/pptx-renderer (Apache-2.0) for PowerPoint files. See vendor/README.md.
 */

const tx = window.tx || ((s) => s);
const LANG = window.EllenialLang ? window.EllenialLang.lang : 'en';

const PDFJS = '/vendor/pdfjs/pdf.min.mjs';
const PDFJS_WORKER = '/vendor/pdfjs/pdf.worker.min.mjs';
const PPTX = '/vendor/pptx-renderer/aiden0z-pptx-renderer.browser.es.js';
const MAX_BYTES = 400 * 1024 * 1024;

const app = document.getElementById('app');
const stage = document.getElementById('stage');

/* ---------------- tiny DOM helper ---------------- */

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

const ICONS = {
  screen: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  upload: '<path d="M12 15V4M7 9l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
};
function icon(name, size) {
  const s = size || 22;
  return h('span', { class: 'ic', 'aria-hidden': 'true', html: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>` });
}

/* ---------------- opening files ---------------- */

function kindOf(file) {
  const n = (file.name || '').toLowerCase();
  const ext = n.includes('.') ? n.slice(n.lastIndexOf('.') + 1) : '';
  if (['pptx', 'ppsx', 'pptm', 'ppsm', 'potx', 'potm'].includes(ext)) return 'pptx';
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (ext === 'ppt' || ext === 'pps') return 'old-ppt';
  if (ext === 'key') return 'keynote';
  if (ext === 'odp') return 'odp';
  if ((file.type || '').startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'heic'].includes(ext)) return 'image';
  return 'other';
}

const NOT_YET = {
  'old-ppt': () => tx('This is an old PowerPoint file (.ppt). Open it in PowerPoint and save it as .pptx or PDF, and it will work here.'),
  keynote: () => tx('Keynote files can’t be opened in a browser. In Keynote, export it as a PDF (File → Export To → PDF), then choose that here.'),
  odp: () => tx('LibreOffice files can’t be opened here yet. Save it as .pptx or export it as a PDF, then choose that here.'),
  other: () => tx('I can’t open that kind of file. Choose a PowerPoint file (.pptx), a PDF or pictures.')
};

let doc = null; // the open presentation: { kind, name, count, preview(el), show(i), destroy() }
let lastError = '';

async function openFiles(fileList) {
  const files = Array.from(fileList || []).filter(Boolean);
  if (!files.length) return;
  lastError = '';
  const images = files.filter((f) => kindOf(f) === 'image');
  const main = files.find((f) => kindOf(f) !== 'image');
  if (main && !['pptx', 'pdf'].includes(kindOf(main))) { lastError = NOT_YET[kindOf(main)](); renderHome(); return; }
  const total = files.reduce((n, f) => n + (f.size || 0), 0);
  if (total > MAX_BYTES) { lastError = tx('That file is very large. Try a smaller copy, or save it as a PDF.'); renderHome(); return; }

  closeDoc();
  renderLoading(main ? main.name : images.length === 1 ? images[0].name : `${images.length} ${tx('pictures')}`);
  try {
    if (main && kindOf(main) === 'pdf') doc = await openPdf(main);
    else if (main) doc = await openPptx(main);
    else doc = await openImages(images);
    if (!doc.count) throw new Error('empty');
    renderReady();
  } catch (e) {
    console.error(e);
    closeDoc();
    lastError = e && e.name === 'PasswordException'
      ? tx('That PDF has a password. Open it, save a copy without the password, and try again.')
      : tx('Sorry, I couldn’t open that file. If it’s a PowerPoint file, try saving it as a PDF and open that instead.');
    renderHome();
  }
}

function closeDoc() {
  if (doc) { try { doc.destroy(); } catch (e) { /* ignore */ } }
  doc = null;
  stage.innerHTML = '';
}

/* PDF: each page is drawn into a canvas the size of the screen, sharp on high-density screens. */
async function openPdf(file) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false, enableXfa: false }).promise;
  const cache = new Map();
  async function draw(i, w, hgt) {
    const key = `${i}:${w}x${hgt}`;
    if (cache.has(key)) return cache.get(key);
    const job = (async () => {
      const page = await pdf.getPage(i + 1);
      const v1 = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const scale = Math.min(w / v1.width, hgt / v1.height) * dpr;
      const vp = page.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      c.style.width = `${Math.floor(vp.width / dpr)}px`; c.style.height = `${Math.floor(vp.height / dpr)}px`;
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', `${tx('Slide')} ${i + 1}`);
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp, canvas: c }).promise;
      return c;
    })();
    cache.set(key, job);
    if (cache.size > 8) cache.delete(cache.keys().next().value);
    return job;
  }
  return {
    kind: 'pdf', name: file.name, count: pdf.numPages,
    async preview(el) { const r = el.getBoundingClientRect(); const c = await draw(0, r.width || 480, r.height || 270); el.replaceChildren(c.cloneNode(false)); el.firstChild.getContext('2d').drawImage(c, 0, 0); },
    async show(i) {
      const area = flatArea();
      const w = area.clientWidth, hgt = area.clientHeight;
      const c = await draw(i, w, hgt);
      if (current === i) area.replaceChildren(c);
      if (i + 1 < pdf.numPages) draw(i + 1, w, hgt); // get the next one ready
    },
    destroy() { cache.clear(); pdf.destroy(); }
  };
}

/* Pictures: shown one by one, sorted by file name (how phones and cameras number them). */
async function openImages(images) {
  const sorted = images.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const urls = sorted.map((f) => URL.createObjectURL(f));
  function img(i) { return h('img', { src: urls[i], alt: `${tx('Slide')} ${i + 1}`, draggable: 'false' }); }
  return {
    kind: 'images', name: sorted.length === 1 ? sorted[0].name : `${sorted.length} ${tx('pictures')}`, count: urls.length,
    async preview(el) { el.replaceChildren(img(0)); },
    async show(i) { flatArea().replaceChildren(img(i)); if (urls[i + 1]) new Image().src = urls[i + 1]; },
    destroy() { urls.forEach((u) => URL.revokeObjectURL(u)); }
  };
}

/* PowerPoint: parsed and drawn here by pptx-renderer. One host element lives in the stage and the
   renderer fits each slide into it ("contain"). */
async function openPptx(file) {
  const lib = await import(PPTX);
  const buf = await file.arrayBuffer();
  const files = await lib.parseZip(buf, lib.RECOMMENDED_ZIP_LIMITS);
  const presentation = lib.buildPresentation(files);
  // The renderer fits a slide to its container's width, so the container gets the width at which
  // the whole slide fits the screen (letterboxed, like PowerPoint's own slide show).
  const host = h('div', { class: 'pptx-host' });
  const wrap = h('div', { class: 'pptx-wrap' }, host);
  stage.replaceChildren(wrap);
  const aspect = presentation.width && presentation.height ? presentation.width / presentation.height : 16 / 9;
  function fit() {
    const W = stage.clientWidth || window.innerWidth, H = stage.clientHeight || window.innerHeight;
    host.style.width = `${Math.floor(Math.min(W, H * aspect))}px`;
  }
  const viewer = new lib.PptxViewer(host, { fitMode: 'contain', pdfjs: { moduleUrl: PDFJS, workerUrl: PDFJS_WORKER } });
  viewer.load(presentation);
  let rendered = false;
  let thumb = null;
  return {
    kind: 'pptx', name: file.name, count: viewer.slideCount, fit,
    async preview(el) {
      const r = el.getBoundingClientRect();
      if (thumb) { try { thumb.dispose(); } catch (e) { /* ignore */ } }
      // Fit the whole slide in the 16:9 box, so older 4:3 decks aren't cut off at the top.
      const w = r.width && r.height ? Math.min(r.width, r.height * aspect) : r.width;
      thumb = viewer.renderThumbnailToContainer(0, el, { width: Math.round(w) || 480 });
      if (thumb && thumb.ready) await thumb.ready;
    },
    async show(i) {
      if (!wrap.isConnected) stage.prepend(wrap);
      fit();
      if (!rendered) { await viewer.renderSlide(i); rendered = true; } else await viewer.goToSlide(i);
    },
    destroy() { if (thumb) { try { thumb.dispose(); } catch (e) { /* ignore */ } } viewer.destroy(); }
  };
}

function flatArea() {
  let a = stage.querySelector('.flat');
  if (!a) { a = h('div', { class: 'flat' }); stage.prepend(a); }
  return a;
}

/* ---------------- shared bits of the page ---------------- */

function themeSwitch() {
  if (!window.EllenialTheme) return null;
  return window.EllenialTheme.control({ label: tx('Theme'), labels: { auto: tx('Auto'), light: tx('Light'), dark: tx('Dark') } });
}

const STEPS = () => [
  { title: tx('Choose your presentation'), text: tx('A PowerPoint, a PDF or pictures. It stays on your phone or computer. Nothing is uploaded.') },
  { title: tx('Put it on the screen'), text: tx('Cable? You’re set. No cable: Screen Mirroring on iPhone, iPad and Mac, Cast or Smart View on Android, Windows + K on Windows.') },
  { title: tx('Present'), text: tx('Tap right for next, left for back, or use the arrow keys or a clicker. Close the tab and it’s gone.') }
];

function helpButton() {
  if (!window.EllenialHelp) return null;
  return window.EllenialHelp.button({
    label: tx('How it works'),
    onclick: () => window.EllenialHelp.open({
      title: tx('How it works'), lead: tx('Three steps, and your slides are on the big screen.'),
      steps: STEPS(), done: tx('Got it'), close: tx('Close'),
      note: tx('Nothing is uploaded and nothing is saved. Your file is opened right here, on this device, and is gone when you close the tab.')
    })
  });
}

function topBar(left, withTheme = true) {
  return h('header', { class: 'bar' }, left, h('div', { class: 'bar-right' }, withTheme ? themeSwitch() : null, helpButton()));
}

function brand() {
  return h('div', { class: 'brand' },
    h('img', { src: '/icons/icon-192.png', alt: '', width: '44', height: '44' }),
    h('div', { class: 'brand-words' }, h('span', { class: 'eyebrow', text: 'Ellenial' }), h('h1', { text: tx('Present') })));
}

// The shared Ellenial footer (9 Nov 2026): Present's own line on top, then the same block as every app.
function footer() {
  return h('footer', { class: 'ell-foot' },
    h('div', { class: 'ell-notes' }, h('p', null, tx('Your file is never uploaded or saved.'))),
    h('div', { class: 'ell-shared' },
      h('p', null, h('a', { href: 'https://ellenial.app/drawings', text: tx('Drawn') }), ' ', tx('and designed by me, coded with the help of AI.')),
      h('p', null, tx('Free · no ads · no trackers')),
      h('p', null, tx('In this app: a simple visit counter')),
      h('p', null, h('a', { href: 'https://ellenial.app', text: tx('An Ellenial tool') }), ' · ',
        h('a', { href: 'https://github.com/phoenixcyberpunk/ellenial-present', text: tx('Source') }), ' · ',
        h('a', { href: 'https://ellenial.app/thanks', text: tx('Thanks') }))),
    window.EllenialLang ? h('div', { class: 'ell-controls' }, h('button', { class: 'chip-btn', type: 'button', lang: window.EllenialLang.other, 'aria-label': window.EllenialLang.otherAria, onclick: () => window.EllenialLang.set(window.EllenialLang.other) }, window.EllenialLang.otherLabel)) : null);
}

/* ---------------- views ---------------- */

let picker = null;
function filePicker() {
  if (picker) return picker;
  picker = h('input', { type: 'file', class: 'sr-only', accept: '.pptx,.ppsx,.pptm,.potx,.pdf,application/pdf,image/*,.ppt,.key,.odp', multiple: true, tabindex: '-1', 'aria-hidden': 'true' });
  picker.addEventListener('change', () => { const f = picker.files; openFiles(f); picker.value = ''; });
  document.body.appendChild(picker);
  return picker;
}

const GUIDES = () => [
  { name: 'Google Slides', steps: tx('On a computer: File → Download → PDF document. In the phone app: ⋮ → Share & export → Save as → PDF.') },
  { name: 'Keynote', steps: tx('On a Mac: File → Export To → PDF. On iPhone or iPad: ··· → Export → PDF.') },
  { name: 'Canva', steps: tx('Share → Download → File type: PDF Standard → Download.') }
];

function renderHome() {
  view = 'home';
  const pick = () => filePicker().click();
  const guideBox = h('div', { class: 'guide', hidden: true, 'aria-live': 'polite' });
  let openGuide = null;
  const chips = GUIDES().map((g) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-expanded': 'false', text: g.name });
    b.addEventListener('click', () => {
      const same = openGuide === g.name;
      chips.forEach((c) => c.setAttribute('aria-expanded', 'false'));
      if (same) { openGuide = null; guideBox.hidden = true; return; }
      openGuide = g.name; b.setAttribute('aria-expanded', 'true');
      guideBox.replaceChildren(h('strong', { text: g.name }), h('span', { text: g.steps }));
      guideBox.hidden = false;
    });
    return b;
  });

  app.replaceChildren(h('div', { class: 'page home' },
    topBar(brand()),
    h('div', { class: 'home-grid' },
      h('div', { class: 'home-main' },
        h('p', { class: 'lead', text: tx('Show your slides on any TV, without a cable, an account or PowerPoint.') }),
        lastError ? h('p', { class: 'note-error', role: 'alert', text: lastError }) : null,
        h('button', { class: 'drop', type: 'button', onclick: pick },
          icon('upload', 32),
          h('span', { class: 'drop-title', text: tx('Choose a presentation') }),
          h('span', { class: 'drop-sub desk', text: tx('or drop it here') }),
          h('span', { class: 'drop-sub', text: tx('PowerPoint, PDF or pictures') }),
          h('span', { class: 'drop-small', text: tx('It stays on this device. Nothing is uploaded. Works for files someone just sent you, too.') })),
        h('div', { class: 'guides' },
          h('p', { class: 'small muted', text: tx('Made in Google Slides, Keynote or Canva? Save it as a PDF first:') }),
          h('div', { class: 'chips' }, chips),
          guideBox)),
      h('aside', { class: 'home-side' },
        h('section', { class: 'card steps', 'aria-labelledby': 'how' },
          h('h2', { id: 'how', text: tx('How it works') }),
          h('ol', null, STEPS().map((s, i) => h('li', null, h('span', { class: 'n', 'aria-hidden': 'true', text: String(i + 1) }), h('span', { class: 'step' }, h('strong', { text: s.title }), h('span', { text: s.text })))))),
        h('section', { class: 'card keys desk' },
          h('h2', { text: tx('Keys') }),
          h('div', { class: 'keylist' }, [['→', tx('next')], ['←', tx('back')], ['F', tx('full screen')], ['B', tx('black screen')], ['Esc', tx('end')]].map(([k, t]) => h('span', null, h('kbd', { text: k }), ' ', t)))))),
    footer()));
}

function renderLoading(name) {
  view = 'loading';
  app.replaceChildren(h('div', { class: 'page' },
    topBar(brand()),
    h('div', { class: 'loading', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('p', null, tx('Opening'), ' ', h('strong', { text: name }), '…'), h('p', { class: 'small muted', text: tx('Right here on this device. Nothing is uploaded.') }))));
}

function renderReady() {
  view = 'ready';
  const preview = h('div', { class: 'preview', 'aria-label': tx('First slide') });
  app.replaceChildren(h('div', { class: 'page ready' },
    topBar(h('div', { class: 'bar-left' },
      h('button', { class: 'round', type: 'button', 'aria-label': tx('Choose another presentation'), onclick: () => { closeDoc(); renderHome(); } }, icon('back')),
      h('div', { class: 'ready-title' }, h('span', { class: 'eyebrow', text: tx('Ready') }), h('h1', { text: doc.name }))), false),
    h('div', { class: 'ready-grid' },
      h('div', { class: 'ready-main' },
        preview,
        h('p', { class: 'small muted count', text: `${doc.count} ${doc.count === 1 ? tx('slide') : tx('slides')}` })),
      h('div', { class: 'ready-side' },
        h('button', { class: 'btn big', type: 'button', onclick: () => startPresenting(0) }, icon('play'), tx('Start presenting')),
        h('p', { class: 'small muted', text: tx('Put your screen on the TV first: plug in the cable, or use Screen Mirroring or Cast.') }),
        h('p', { class: 'small muted phone-only', text: tx('Turn your phone sideways for the biggest slides.') }),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { closeDoc(); renderHome(); filePicker().click(); } }, tx('Choose another'))))));
  requestAnimationFrame(() => { doc && doc.preview(preview).catch((e) => console.error(e)); });
}

/* ---------------- presenting ---------------- */

let view = 'home';
let current = 0;
let hideTimer = 0;
let black = false;

function controls() {
  const counter = h('span', { class: 'counter', 'aria-live': 'polite' });
  const prev = h('button', { class: 'zone prev', type: 'button', 'aria-label': tx('Previous slide') }, h('span', { class: 'dot' }, icon('back')));
  const next = h('button', { class: 'zone next', type: 'button', 'aria-label': tx('Next slide') }, h('span', { class: 'dot' }, icon('next')));
  prev.addEventListener('click', (e) => { e.stopPropagation(); go(-1); });
  next.addEventListener('click', (e) => { e.stopPropagation(); go(1); });
  const end = h('button', { class: 'end', type: 'button', onclick: (e) => { e.stopPropagation(); stopPresenting(); } }, tx('End'));
  const full = document.fullscreenEnabled ? h('button', { class: 'pill-btn', type: 'button', 'aria-label': tx('Full screen'), onclick: (e) => { e.stopPropagation(); toggleFull(); } }, icon('full', 18)) : null;
  return {
    el: h('div', { class: 'controls' },
      h('div', { class: 'ctl-top' }, counter, h('div', { class: 'ctl-right' }, full, end)),
      prev, next,
      h('p', { class: 'ctl-hint', text: tx('Controls fade after 2 seconds · tap to show') })),
    counter
  };
}

let ctl = null;
let cover = null;

async function startPresenting(i) {
  view = 'present';
  current = Math.max(0, Math.min(i, doc.count - 1));
  black = false;
  ctl = controls();
  cover = h('div', { class: 'cover', hidden: true });
  for (const el of stage.querySelectorAll('.controls,.cover,.flat')) el.remove();
  stage.append(cover, ctl.el);
  stage.hidden = false;
  document.body.classList.add('presenting');
  app.setAttribute('inert', '');
  try { if (document.fullscreenEnabled && !document.fullscreenElement) await stage.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { /* fine without */ }
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* ignore */ }
  await paint();
  poke();
  stage.focus({ preventScroll: true });
}

async function stopPresenting() {
  if (view !== 'present') return;
  view = 'ready';
  clearTimeout(hideTimer);
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* ignore */ }
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ignore */ }
  for (const el of stage.querySelectorAll('.controls,.cover,.flat')) el.remove();
  stage.hidden = true;
  document.body.classList.remove('presenting');
  app.removeAttribute('inert');
  renderReady();
}

async function paint() {
  if (!doc) return;
  ctl.counter.textContent = `${current + 1} / ${doc.count}`;
  try { await doc.show(current); } catch (e) { console.error(e); }
}

function go(step) {
  if (view !== 'present' || !doc) return;
  if (black) { setBlack(false); return; }
  const n = Math.max(0, Math.min(current + step, doc.count - 1));
  poke();
  if (n === current) return;
  current = n;
  paint();
}
function goTo(n) { if (view !== 'present') return; current = Math.max(0, Math.min(n, doc.count - 1)); paint(); poke(); }

function setBlack(on) { black = on; if (cover) cover.hidden = !on; }

function poke() {
  stage.classList.add('show-ctl');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => stage.classList.remove('show-ctl'), 2000);
}

function toggleFull() {
  try { document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { /* ignore */ }
}

stage.tabIndex = -1;
// A tap: right half = next, left half = back (the controls show for a moment either way).
let down = null;
stage.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: Date.now() }; });
stage.addEventListener('pointerup', (e) => {
  if (!down || view !== 'present') return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  const d = down; down = null;
  if (e.target.closest('button')) return;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; } // swipe
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - d.t < 600) go(e.clientX > window.innerWidth / 2 ? 1 : -1);
});
stage.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') poke(); });

document.addEventListener('keydown', (e) => {
  if (view !== 'present' || e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key;
  // Clickers send PageDown / PageUp (some send arrows, "." or "b" for black).
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N'].includes(k)) { e.preventDefault(); go(1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P'].includes(k)) { e.preventDefault(); go(-1); }
  else if (k === 'Home') { e.preventDefault(); goTo(0); }
  else if (k === 'End') { e.preventDefault(); goTo(doc.count - 1); }
  else if (k === 'f' || k === 'F' || k === 'F5') { e.preventDefault(); toggleFull(); }
  else if (k === 'b' || k === 'B' || k === '.') { e.preventDefault(); setBlack(!black); poke(); }
  // Esc leaves full screen first (most browsers do that themselves), then ends on the next press.
  else if (k === 'Escape') { if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (er) { /* ignore */ } } else stopPresenting(); }
});
function refit() { if (view !== 'present' || !doc) return; if (doc.fit) doc.fit(); else paint(); }
document.addEventListener('fullscreenchange', () => { if (view === 'present') { poke(); setTimeout(refit, 60); } });
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refit, 120); });

/* ---------------- drag and drop (laptops) ---------------- */

let dragDepth = 0;
document.addEventListener('dragenter', (e) => { if (view !== 'home' && view !== 'ready') return; if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return; e.preventDefault(); dragDepth++; document.body.classList.add('dragging'); });
document.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove('dragging'); });
document.addEventListener('dragover', (e) => { if (view === 'home' || view === 'ready') e.preventDefault(); });
document.addEventListener('drop', (e) => {
  dragDepth = 0; document.body.classList.remove('dragging');
  if (view !== 'home' && view !== 'ready') return;
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) openFiles(e.dataTransfer.files);
});

/* ---------------- start ---------------- */

renderHome();

// Offline after the first visit (the libraries are cached too, so it works on a venue with bad Wi-Fi).
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

// For the browser tests only (never used by the page itself).
window.__present = { get doc() { return doc; }, get view() { return view; }, get current() { return current; }, openFiles };
