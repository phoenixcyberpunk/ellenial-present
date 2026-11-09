/*! lang.js for Present · AGPL-3.0
 * Every Ellenial app comes in Swedish and English (Ellen, 8 Nov 2026). Present is written in English;
 * this file holds the Swedish. tx('English text') returns the text in the chosen language.
 * The choice follows the phone's language until someone taps the switch, then it's saved on this
 * device only (localStorage `ep:lang`). Test with ?lang=sv or ?lang=en (not saved).
 * Switching reloads the page, so it's only offered on the start page.
 * The app keeps its name, Present, in Swedish too (like Split, Quiz and Bingo).
 */
;(function () {
  'use strict'
  var KEY = 'ep:lang'
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'sv' || v === 'en' ? v : null } catch (e) { return null } }
  function fromPhone() {
    var n = (navigator.languages && navigator.languages[0]) || navigator.language || 'en'
    return /^(sv|nb|nn|no|da)\b/i.test(n) ? 'sv' : 'en'
  }
  var url = null
  try { url = new URLSearchParams(location.search).get('lang') } catch (e) {}
  var lang = url === 'sv' || url === 'en' ? url : saved() || fromPhone()
  document.documentElement.lang = lang

  var SV = {
    'Present': 'Present',
    'Show your slides on any TV, without a cable, an account or PowerPoint.': 'Visa dina bilder på vilken tv som helst, utan sladd, konto eller PowerPoint.',
    'Choose a presentation': 'Välj en presentation',
    'or drop it here': 'eller släpp den här',
    'PowerPoint, PDF or pictures': 'PowerPoint, PDF eller bilder',
    'It stays on this device. Nothing is uploaded. Works for files someone just sent you, too.': 'Den stannar på den här enheten. Inget laddas upp. Funkar även för filer någon nyss skickat till dig.',
    'Made in Google Slides, Keynote or Canva? Save it as a PDF first:': 'Gjord i Google Presentationer, Keynote eller Canva? Spara den som PDF först:',
    'On a computer: File → Download → PDF document. In the phone app: ⋮ → Share & export → Save as → PDF.': 'På en dator: Arkiv → Ladda ned → PDF-dokument. I mobilappen: ⋮ → Dela och exportera → Spara som → PDF.',
    'On a Mac: File → Export To → PDF. On iPhone or iPad: ··· → Export → PDF.': 'På en Mac: Arkiv → Exportera till → PDF. På iPhone eller iPad: ··· → Exportera → PDF.',
    'Share → Download → File type: PDF Standard → Download.': 'Dela → Ladda ned → Filtyp: PDF Standard → Ladda ned.',
    'How it works': 'Så funkar det',
    'Choose your presentation': 'Välj din presentation',
    'A PowerPoint, a PDF or pictures. It stays on your phone or computer. Nothing is uploaded.': 'En PowerPoint, en PDF eller bilder. Den stannar på din telefon eller dator. Inget laddas upp.',
    'Put it on the screen': 'Få upp den på skärmen',
    'Cable? You’re set. No cable: Screen Mirroring on iPhone, iPad and Mac, Cast or Smart View on Android, Windows + K on Windows.': 'Sladd? Då är du klar. Ingen sladd: Skärmdubblering på iPhone, iPad och Mac, Casta eller Smart View på Android, Windows + K på Windows.',
    'Present': 'Present',
    'Tap right for next, left for back, or use the arrow keys or a clicker. Close the tab and it’s gone.': 'Tryck till höger för nästa, till vänster för tillbaka, eller använd piltangenterna eller en klicker. Stäng fliken så är den borta.',
    'Three steps, and your slides are on the big screen.': 'Tre steg, sen är dina bilder på den stora skärmen.',
    'Nothing is uploaded and nothing is saved. Your file is opened right here, on this device, and is gone when you close the tab.': 'Inget laddas upp och inget sparas. Din fil öppnas här, på den här enheten, och är borta när du stänger fliken.',
    'Got it': 'Uppfattat',
    'Close': 'Stäng',
    'Keys': 'Tangenter',
    'next': 'nästa',
    'back': 'tillbaka',
    'full screen': 'helskärm',
    'black screen': 'svart skärm',
    'end': 'avsluta',
    'Theme': 'Tema',
    'Auto': 'Auto',
    'Light': 'Ljust',
    'Dark': 'Mörkt',
    'Your file is never uploaded or saved.': 'Din fil laddas aldrig upp och sparas aldrig.',
    'Drawn': 'Ritat',
    'and designed by me, coded with the help of AI.': 'och designat av mig, kodat med hjälp av AI.',
    // shared Ellenial footer (9 Nov 2026)
    'Free · no ads · no trackers': 'Gratis · inga annonser · inga trackers',
    'In this app: a simple visit counter': 'I den här appen: en enkel besöksräknare',
    'An Ellenial tool': 'Ett Ellenial-verktyg',
    'Source': 'Källkod',
    'Thanks': 'Tack',
    'An Ellenial app': 'En Ellenial-app',
    'Open source': 'Öppen källkod',
    'Opening': 'Öppnar',
    'Right here on this device. Nothing is uploaded.': 'Här på den här enheten. Inget laddas upp.',
    'Ready': 'Redo',
    'First slide': 'Första bilden',
    'slide': 'bild',
    'slides': 'bilder',
    'Slide': 'Bild',
    'pictures': 'bilder',
    'Start presenting': 'Börja presentera',
    'Put your screen on the TV first: plug in the cable, or use Screen Mirroring or Cast.': 'Få upp skärmen på tv:n först: koppla in sladden, eller använd Skärmdubblering eller Casta.',
    'Turn your phone sideways for the biggest slides.': 'Vänd telefonen på sidan för störst bilder.',
    'Choose another': 'Välj en annan',
    'Choose another presentation': 'Välj en annan presentation',
    'Previous slide': 'Föregående bild',
    'Next slide': 'Nästa bild',
    'End': 'Avsluta',
    'Full screen': 'Helskärm',
    'Controls fade after 2 seconds · tap to show': 'Knapparna tonas bort efter 2 sekunder · tryck för att visa',
    'This is an old PowerPoint file (.ppt). Open it in PowerPoint and save it as .pptx or PDF, and it will work here.': 'Det här är en gammal PowerPoint-fil (.ppt). Öppna den i PowerPoint och spara som .pptx eller PDF, så funkar den här.',
    'Keynote files can’t be opened in a browser. In Keynote, export it as a PDF (File → Export To → PDF), then choose that here.': 'Keynote-filer går inte att öppna i en webbläsare. Exportera den som PDF i Keynote (Arkiv → Exportera till → PDF) och välj den här.',
    'LibreOffice files can’t be opened here yet. Save it as .pptx or export it as a PDF, then choose that here.': 'LibreOffice-filer går inte att öppna här än. Spara som .pptx eller exportera som PDF och välj den här.',
    'I can’t open that kind of file. Choose a PowerPoint file (.pptx), a PDF or pictures.': 'Den sortens fil kan jag inte öppna. Välj en PowerPoint-fil (.pptx), en PDF eller bilder.',
    'That file is very large. Try a smaller copy, or save it as a PDF.': 'Filen är väldigt stor. Prova en mindre kopia, eller spara den som PDF.',
    'That PDF has a password. Open it, save a copy without the password, and try again.': 'PDF:en har ett lösenord. Öppna den, spara en kopia utan lösenord och försök igen.',
    'Sorry, I couldn’t open that file. If it’s a PowerPoint file, try saving it as a PDF and open that instead.': 'Förlåt, jag kunde inte öppna filen. Om det är en PowerPoint-fil, prova att spara den som PDF och öppna den i stället.'
  }

  window.EllenialLang = {
    lang: lang,
    other: lang === 'sv' ? 'en' : 'sv',
    otherLabel: lang === 'sv' ? 'English' : 'Svenska',
    otherAria: lang === 'sv' ? 'Switch to English' : 'Byt till svenska',
    set: function (l) { try { localStorage.setItem(KEY, l) } catch (e) {} location.reload() }
  }
  window.tx = function (s) {
    if (lang === 'sv' && Object.prototype.hasOwnProperty.call(SV, s)) return SV[s]
    return s
  }
})()
