// app.js - Screen-Flow (Aufnahme -> Zuschneiden -> Versenden), Betreff-Bildung, Foto-Handling

const APP_VERSION = 'v0.3.0';

// ── Globales Fehlernetz (Muster aus 260225): fängt unbehandelte Fehler ab, statt stumm zu bleiben ──
window.addEventListener('error', (e) => {
  const msg = `JS-Fehler: ${e.message} (${e.filename}:${e.lineno})`;
  console.error(msg, e.error);
  showToast(msg, 8000);
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = `Async-Fehler: ${e.reason}`;
  console.error(msg, e.reason);
  showToast(msg, 8000);
});

// ── Zustand (bewusst nur im Speicher - v1 braucht keine dauerhafte Beleg-Speicherung) ──
// capturedPhotos: [{ id, dataUrl, file }] - Fotos des GERADE erfassten Belegs.
// `file` ist die Original-Datei aus dem Datei-/Kamera-Feld; sie wandert mit in die
// Sammlung, damit ein Foto SPÄTER noch einmal zugeschnitten werden kann. Bewusst die
// File-Referenz und nicht die dataUrl: die base64-Zeichenkette läge dauerhaft im
// Speicher (rund ein Drittel größer als die Datei), die File-Referenz nicht.
let capturedPhotos = [];
let croppedResults = [];   // [{ id, blob, file, cropState }] - parallel zu capturedPhotos
let cropIndex = 0;
// Sammlung fertig zugeschnittener Belege: [{ id, photos: [{ id, blob, file, cropState }] }]
let belegCollection = [];
// Nachbearbeiten: zeigt auf das Foto in der Sammlung, das gerade erneut im
// Zuschnitt-Screen liegt ({ belegId, photoId }) - null = regulärer Erfassungs-Durchlauf.
let editContext = null;
let editSourceUrl = null;  // Object-URL der Quelldatei, nach dem Laden freigegeben
let subjectCommitted = false;
let subjectBase = '';      // JJMMDD_Spesenbeleg_# - einmal je Sammlung vergeben (Tageszähler)
let currentSubject = '';   // subjectBase + Beleg-Anzahl - was tatsächlich angezeigt/geteilt wird

// ── Bildqualität (Export-Zielgröße, S3) - Auswahl bleibt geräteweit über localStorage erhalten ──
const QUALITY_STORAGE_KEY = 'spesenbeleg-quality';
function getQualityLevel() {
  const v = localStorage.getItem(QUALITY_STORAGE_KEY);
  return (v === 'hoch' || v === 'niedrig') ? v : 'mittel'; // 'mittel' = Default, zielt auf ~1 MB
}
function setQualityLevel(v) {
  localStorage.setItem(QUALITY_STORAGE_KEY, v);
}

// ── Toast ──
function showToast(msg, duration = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tid);
  showToast._tid = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Navigation (linear, drei Screens - kein Verlauf/Deep-Link nötig für dieses schlanke v1) ──
const SCREENS = ['screen-aufnahme', 'screen-zuschneiden', 'screen-versenden'];
let currentScreenIndex = 0;

function showScreen(index) {
  currentScreenIndex = index;
  SCREENS.forEach((id, i) => {
    document.getElementById(id).classList.toggle('active', i === index);
  });
  document.getElementById('btn-back').style.display = index > 0 ? 'flex' : 'none';
  const labels = ['Schritt 1: Aufnahme', 'Schritt 2: Zuschneiden', 'Schritt 3: Sammlung & Versand'];
  document.getElementById('header-step-label').textContent = labels[index];
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('step-dot-' + i);
    dot.classList.toggle('active', i - 1 === index);
    dot.classList.toggle('done', i - 1 < index);
  }
  window.scrollTo(0, 0);
}

function goBack() {
  if (currentScreenIndex === 1 && editContext) {
    // Nachbearbeitung abbrechen - das Foto in der Sammlung bleibt, wie es war.
    cancelPhotoEdit();
  } else if (currentScreenIndex === 1) {
    // Zurück zur Aufnahme (Fotos bleiben erhalten; "Weiter" startet den Zuschnitt neu)
    showScreen(0);
  } else if (currentScreenIndex === 2) {
    // Der gerade fertiggestellte Beleg steckt schon in der Sammlung (kein Zuschnitt mehr
    // offen) - "zurück" heißt hier: nächsten Beleg erfassen, genau wie der Sammlung-Button.
    showScreen(0);
  }
}

// ── Datum / Betreff-Bildung ──
function todayJJMMDD() {
  const d = new Date();
  const jj = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const tt = String(d.getDate()).padStart(2, '0');
  return jj + mm + tt;
}

// Nächste Nummer: neuer Tag -> 1, sonst letzte gespeicherte Nummer + 1
function computeNextCounter() {
  const today = todayJJMMDD();
  const raw = localStorage.getItem('spesenbeleg-counter');
  const data = raw ? JSON.parse(raw) : null;
  if (!data || data.date !== today) return 1;
  return (data.count || 0) + 1;
}

function commitCounter(n) {
  localStorage.setItem('spesenbeleg-counter', JSON.stringify({ date: todayJJMMDD(), count: n }));
}

// ── Screen 1: Aufnahme ──
function renderAufnahmeThumbs() {
  const wrap = document.getElementById('aufnahme-thumbs');
  if (capturedPhotos.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch kein Foto aufgenommen.</div>';
  } else {
    wrap.innerHTML = capturedPhotos.map((p, i) => `
      <div class="photo-thumb">
        <span class="thumb-num">${i + 1}</span>
        <img src="${p.dataUrl}" alt="Foto ${i + 1}">
        <button class="thumb-del" data-id="${p.id}" title="Entfernen">&times;</button>
      </div>`).join('');
  }
  document.getElementById('btn-weiter-zuschnitt').disabled = capturedPhotos.length === 0;
}

function addPhotoFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      capturedPhotos.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        dataUrl: reader.result,
        file   // Original behalten - Grundlage für späteres Nachbearbeiten
      });
      renderAufnahmeThumbs();
      resolve();
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhotoInput(input) {
  const files = Array.from(input.files || []);
  for (const f of files) {
    await addPhotoFromFile(f);
  }
  input.value = ''; // gleiche Datei erneut wählbar machen, nächste Aufnahme sofort möglich
}

function removePhoto(id) {
  capturedPhotos = capturedPhotos.filter(p => p.id !== id);
  renderAufnahmeThumbs();
}

// Setzt nur den GERADE erfassten Beleg zurück (Aufnahme-Screen leer für den nächsten
// Beleg) - die Sammlung (belegCollection) bleibt dabei unangetastet.
function resetCurrentBelegCapture() {
  capturedPhotos = [];
  croppedResults = [];
  cropIndex = 0;
  renderAufnahmeThumbs();
}

// ── Screen 2: Zuschneiden ──

// Setzt die beiden Schieberegler auf einen Zustand (oder auf null zurück).
function setCropSliders(state) {
  const rot = state && Number.isFinite(state.rotation) ? state.rotation : 0;
  const hell = state && Number.isFinite(state.brightness) ? state.brightness : 0;
  document.getElementById('crop-rotate').value = rot;
  document.getElementById('crop-brightness').value = hell;
  document.getElementById('crop-rotate-val').textContent = rot + '°';
  document.getElementById('crop-brightness-val').textContent = hell;
}

function loadCropStep() {
  const total = capturedPhotos.length;
  document.getElementById('crop-counter').textContent = `Foto ${cropIndex + 1} von ${total}`;
  document.getElementById('btn-crop-zurueck').style.display = cropIndex > 0 ? 'block' : 'none';
  // Beim erneuten Durchlauf (Nutzer ging im Zuschnitt einen Schritt zurück) den
  // zuletzt gewählten Zustand wieder herstellen statt stumpf auf 0 zu setzen.
  const zustand = croppedResults[cropIndex] ? croppedResults[cropIndex].cropState : null;
  setCropSliders(zustand);
  CropTool.loadFromDataUrl(capturedPhotos[cropIndex].dataUrl, zustand);
}

function startCropFlow() {
  if (capturedPhotos.length === 0) return;
  editContext = null;
  croppedResults = [];
  cropIndex = 0;
  showScreen(1);
  loadCropStep();
}

// ── Nachbearbeiten: ein Foto aus der Sammlung erneut zuschneiden ──
function findSammlungPhoto(belegId, photoId) {
  const beleg = belegCollection.find(b => b.id === belegId);
  if (!beleg) return null;
  const index = beleg.photos.findIndex(p => p.id === photoId);
  if (index < 0) return null;
  return { beleg, photo: beleg.photos[index], index };
}

async function startPhotoEdit(belegId, photoId) {
  const treffer = findSammlungPhoto(belegId, photoId);
  if (!treffer) return;
  if (!treffer.photo.file) {
    showToast('Dieses Foto lässt sich nicht mehr anpassen — bitte neu aufnehmen', 4000);
    return;
  }
  const belegNr = belegCollection.indexOf(treffer.beleg) + 1;
  editContext = { belegId, photoId };
  showScreen(1);
  document.getElementById('crop-counter').textContent =
    `Beleg ${belegNr}, Foto ${treffer.index + 1} — anpassen`;
  document.getElementById('btn-crop-zurueck').style.display = 'none';
  setCropSliders(treffer.photo.cropState);
  freigebenEditSource();
  editSourceUrl = URL.createObjectURL(treffer.photo.file);
  try {
    await CropTool.loadFromDataUrl(editSourceUrl, treffer.photo.cropState);
  } catch {
    showToast('Foto konnte nicht geladen werden', 4000);
    cancelPhotoEdit();
    return;
  } finally {
    // Der Object-URL wird nur zum Dekodieren gebraucht; das Bild liegt danach als
    // Canvas im CropTool. Nicht freigeben hieße: Blob bleibt bis zum Neuladen offen.
    freigebenEditSource();
  }
}

function freigebenEditSource() {
  if (editSourceUrl) {
    URL.revokeObjectURL(editSourceUrl);
    editSourceUrl = null;
  }
}

function cancelPhotoEdit() {
  editContext = null;
  freigebenEditSource();
  renderSammlungThumbs();
  showScreen(2);
}

async function confirmCrop() {
  const btn = document.getElementById('btn-crop-uebernehmen');
  btn.disabled = true;
  try {
    const blob = await CropTool.getCroppedBlob(getQualityLevel());
    if (!blob) { showToast('Bild noch nicht bereit — kurz warten und erneut tippen', 3000); return; }

    // Nachbearbeitung: Ergebnis an Ort und Stelle ersetzen, zurück zur Sammlung.
    if (editContext) {
      const treffer = findSammlungPhoto(editContext.belegId, editContext.photoId);
      if (treffer) {
        treffer.photo.blob = blob;
        treffer.photo.cropState = CropTool.getState();
      }
      editContext = null;
      renderSammlungThumbs();
      showScreen(2);
      showToast('Foto angepasst');
      return;
    }

    croppedResults[cropIndex] = {
      id: capturedPhotos[cropIndex].id,
      blob,
      file: capturedPhotos[cropIndex].file || null,
      cropState: CropTool.getState(),
    };
    cropIndex++;
    if (cropIndex < capturedPhotos.length) {
      loadCropStep();
    } else {
      // Beleg fertig zugeschnitten -> wandert komplett in die Sammlung, Aufnahme-Screen
      // wird für den nächsten Beleg geleert.
      belegCollection.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        photos: croppedResults.slice()
      });
      resetCurrentBelegCapture();
      enterSammlung();
    }
  } finally {
    btn.disabled = false;
  }
}

// ── Screen 3: Sammlung & Versand ──
let sammlungThumbUrls = [];   // erzeugte Object-URLs, damit sie wieder freigegeben werden können

function renderSammlungThumbs() {
  const wrap = document.getElementById('versand-thumbs');
  // Vorherige Vorschau-URLs freigeben (sonst Blob-Leak über mehrere Sammlung-Durchläufe)
  sammlungThumbUrls.forEach(u => URL.revokeObjectURL(u));
  sammlungThumbUrls = [];

  if (belegCollection.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch kein Beleg in der Sammlung.</div>';
  } else {
    wrap.innerHTML = belegCollection.map((beleg, gi) => {
      const thumbsHtml = beleg.photos.map((p, pi) => {
        const url = URL.createObjectURL(p.blob);
        sammlungThumbUrls.push(url);
        // „Anpassen" nur, wenn die Originaldatei noch vorliegt (sie ist die
        // Grundlage für einen erneuten Zuschnitt).
        const editBtn = p.file
          ? `<button class="thumb-edit" data-beleg="${beleg.id}" data-photo="${p.id}"
                     title="Foto anpassen" aria-label="Foto ${pi + 1} anpassen">&#9998;</button>`
          : '';
        return `<div class="photo-thumb"><img src="${url}" alt="Beleg ${gi + 1}">${editBtn}</div>`;
      }).join('');
      const countLabel = beleg.photos.length > 1 ? ` (${beleg.photos.length} Fotos)` : '';
      return `
        <div class="beleg-group">
          <div class="beleg-group-head">
            <span>Beleg ${gi + 1}${countLabel}</span>
            <button class="beleg-group-del" data-id="${beleg.id}" title="Beleg entfernen">&times;</button>
          </div>
          <div class="photo-thumbs beleg-group-thumbs">${thumbsHtml}</div>
        </div>`;
    }).join('');
  }
  updateSammlungSummary();
}

// Betreff besteht aus einem einmal je Sammlung vergebenen Tageszähler (subjectBase)
// plus der aktuellen Beleg-Anzahl - Anzahl aktualisiert sich beim Hinzufügen/Entfernen.
function updateSammlungSummary() {
  const belegCount = belegCollection.length;
  const photoCount = belegCollection.reduce((sum, b) => sum + b.photos.length, 0);
  document.getElementById('sammlung-summary').textContent = belegCount === 0
    ? 'Sammlung ist leer.'
    : `Sammlung: ${belegCount} ${belegCount === 1 ? 'Beleg' : 'Belege'}, ${photoCount} ${photoCount === 1 ? 'Foto' : 'Fotos'}`;
  document.getElementById('btn-share').disabled = belegCount === 0;

  currentSubject = belegCount > 0 ? `${subjectBase}_${belegCount}Belege` : subjectBase;
  document.getElementById('subject-display').textContent = currentSubject;
}

function enterSammlung() {
  // Tageszähler wird genau einmal je Sammlung vergeben - auch wenn danach weitere Belege
  // dazukommen oder der Share/Fallback später wiederholt wird (kein Doppel-Zählen).
  if (!subjectCommitted) {
    const n = computeNextCounter();
    subjectBase = `${todayJJMMDD()}_Spesenbeleg_${n}`;
    commitCounter(n);
    subjectCommitted = true;
  }
  renderSammlungThumbs();
  document.getElementById('fallback-box').style.display = 'none';
  showScreen(2);
}

function removeBelegFromCollection(id) {
  belegCollection = belegCollection.filter(b => b.id !== id);
  renderSammlungThumbs();
  showToast('Beleg entfernt');
}

function addAnotherBeleg() {
  showScreen(0); // aktueller Beleg ist bereits in der Sammlung, Aufnahme-Screen ist schon leer
}

function copySubject() {
  const text = currentSubject;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Betreff kopiert'),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

// Betreff still in die Zwischenablage legen (ohne Toast) - Sicherheitsnetz vor dem
// Teilen: übernimmt die gewählte Mail-App den mitgegebenen Betreff nicht, lässt er
// sich mit einem Tipp einfügen. Ohne das Stichwort „Spesenbeleg" im Betreff findet
// die Dokumentenverwaltung die Mail später nicht.
function copySubjectSilently() {
  const text = currentSubject;
  if (!text) return Promise.resolve(false);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true, () => false);
  }
  return Promise.resolve(false);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Betreff kopiert');
  } catch {
    showToast('Kopieren fehlgeschlagen - bitte Betreff manuell markieren');
  }
  document.body.removeChild(ta);
}

// Alle Fotos ALLER gesammelten Belege gemeinsam in EINEM Web-Share-Aufruf (eine Mail,
// mehrere Anhänge) - der Nutzer wählt im Teilen-Menü selbst Outlook + Empfänger.
async function doShare() {
  if (belegCollection.length === 0) return;
  const btn = document.getElementById('btn-share');
  btn.disabled = true;
  try {
    const files = [];
    let n = 1;
    belegCollection.forEach(beleg => {
      beleg.photos.forEach(p => {
        // Dateiname trägt den Betreff mit - so ist auch am Anhang erkennbar,
        // wozu das Bild gehört, wenn die Mail von Hand nachbearbeitet wird.
        files.push(new File([p.blob], `${currentSubject}_${n}.jpg`, { type: 'image/jpeg' }));
        n++;
      });
    });
    // Vor dem Teilen-Menü, nicht danach: der Klick des Nutzers ist noch „frisch",
    // nur dann lässt der Browser den Zugriff auf die Zwischenablage zu.
    const kopiert = await copySubjectSilently();
    const result = await ShareTool.shareFiles(files, currentSubject);
    if (result === 'shared') {
      showToast(
        kopiert
          ? 'Übergeben — Betreff prüfen, er liegt zum Einfügen bereit'
          : `Übergeben — Betreff muss lauten: ${currentSubject}`,
        6000,
      );
      discardEverything();
      return;
    }
    if (result === 'aborted') {
      return; // Nutzer hat das Teilen-Menü selbst geschlossen - Sammlung bleibt erhalten
    }
    // 'unsupported' oder 'failed' -> Fallback-Box anzeigen (Download + Betreff kopieren)
    document.getElementById('fallback-box').style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}

function downloadFallbackImages() {
  let n = 1;
  belegCollection.forEach(beleg => {
    beleg.photos.forEach(p => {
      const url = URL.createObjectURL(p.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSubject}_${n}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      n++;
    });
  });
  showToast('Bild(er) heruntergeladen');
}

// Vollständiger Reset: aktuelle Erfassung + gesamte Sammlung + Betreff/Zähler-Vergabe.
// Aufgerufen nach erfolgreichem "Alle senden" sowie über "Sammlung verwerfen und neu beginnen".
function discardEverything() {
  editContext = null;
  freigebenEditSource();
  resetCurrentBelegCapture();
  sammlungThumbUrls.forEach(u => URL.revokeObjectURL(u));
  sammlungThumbUrls = [];
  belegCollection = [];
  subjectCommitted = false;
  subjectBase = '';
  currentSubject = '';
  showScreen(0);
}

// ── Event-Wiring ──
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('header-version').textContent = APP_VERSION;
  renderAufnahmeThumbs();
  showScreen(0);

  CropTool.init('#crop-wrap', '#crop-canvas', '#crop-rect');

  document.getElementById('photo-input-camera').addEventListener('change', (e) => handlePhotoInput(e.target));
  document.getElementById('photo-input-gallery').addEventListener('change', (e) => handlePhotoInput(e.target));
  document.getElementById('aufnahme-thumbs').addEventListener('click', (e) => {
    const del = e.target.closest('.thumb-del');
    if (del) removePhoto(del.dataset.id);
  });
  document.getElementById('btn-weiter-zuschnitt').addEventListener('click', startCropFlow);

  document.getElementById('crop-rotate').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    document.getElementById('crop-rotate-val').textContent = v + '°';
    CropTool.setRotation(v);
  });
  document.getElementById('crop-brightness').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    document.getElementById('crop-brightness-val').textContent = v;
    CropTool.setBrightness(v);
  });
  document.getElementById('btn-crop-zuruecksetzen').addEventListener('click', () => {
    document.getElementById('crop-rotate').value = 0;
    document.getElementById('crop-brightness').value = 0;
    document.getElementById('crop-rotate-val').textContent = '0°';
    document.getElementById('crop-brightness-val').textContent = '0';
    CropTool.resetAll();
  });
  document.getElementById('btn-crop-uebernehmen').addEventListener('click', confirmCrop);
  document.getElementById('btn-crop-zurueck').addEventListener('click', () => {
    if (cropIndex > 0) { cropIndex--; loadCropStep(); }
  });
  document.getElementById('crop-quality').value = getQualityLevel();
  document.getElementById('crop-quality').addEventListener('change', (e) => setQualityLevel(e.target.value));

  document.getElementById('btn-copy-subject').addEventListener('click', copySubject);
  document.getElementById('subject-display').addEventListener('click', copySubject);
  document.getElementById('btn-add-beleg').addEventListener('click', addAnotherBeleg);
  document.getElementById('btn-share').addEventListener('click', doShare);
  document.getElementById('btn-fallback-download').addEventListener('click', downloadFallbackImages);
  document.getElementById('versand-thumbs').addEventListener('click', (e) => {
    const edit = e.target.closest('.thumb-edit');
    if (edit) { startPhotoEdit(edit.dataset.beleg, edit.dataset.photo); return; }
    const del = e.target.closest('.beleg-group-del');
    if (del) removeBelegFromCollection(del.dataset.id);
  });
  document.getElementById('btn-neuer-beleg').addEventListener('click', discardEverything);
});

// ── Service Worker Registrierung + Update-System ──
// Angepasst gegenüber 260225: hier liegen erfasste Fotos NUR im Speicher (keine
// IndexedDB) - ein automatischer Reload mitten in der Erfassung würde sie unwiderruflich
// löschen. Ein bereits fertig heruntergeladenes Update wird daher nur beim (Neu-)Start
// der App übernommen (Aufnahme ist dann garantiert leer), nie mitten in der Session.
let swRegistration = null;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('sw.js');

    // Update aus einer früheren Sitzung wartet bereits -> jetzt gefahrlos übernehmen
    if (swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Update geladen - wird beim nächsten Start aktiv', 4000);
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (e) {
    console.error('SW-Registration fehlgeschlagen:', e);
  }
}

registerServiceWorker();
