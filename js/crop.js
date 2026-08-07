// crop.js - Canvas-Zuschnitt mit Touch- UND Maus-Unterstützung (Pointer Events)
// Liefert das zugeschnittene Bild als JPEG-Blob. Optional: Begradigung (Rotation) + Aufhellung.

const CropTool = (() => {
  const MAX_SRC_DIM = 2400;        // Kappung der Arbeitsauflösung (Speicher/Performance am Handy)
  const MAX_DISPLAY_DIM = 900;     // Anzeige-Canvas (skaliert, nur für die Interaktion)
  const MIN_CROP_FRACTION = 0.12;  // kleinste erlaubte Rahmengröße (Anteil der Bildkante)
  const DEFAULT_CROP = { x0: 0.06, y0: 0.06, x1: 0.94, y1: 0.94 };

  let wrapEl, canvasEl, rectEl, ctx;
  let originalCanvas = null;   // Quellbild, bereits auf MAX_SRC_DIM gekappt
  let baseCanvas = null;       // rotiert + aufgehellt, volle Arbeitsauflösung
  let rotation = 0;
  let brightness = 0;
  let crop = { ...DEFAULT_CROP };  // Anteile 0..1 relativ zu baseCanvas

  let dragMode = null;   // null | 'move' | 'nw' | 'ne' | 'sw' | 'se'
  let dragStart = null;

  function init(wrapSelector, canvasSelector, rectSelector) {
    wrapEl = document.querySelector(wrapSelector);
    canvasEl = document.querySelector(canvasSelector);
    rectEl = document.querySelector(rectSelector);
    ctx = canvasEl.getContext('2d');
    wireEvents();
    window.addEventListener('resize', () => {
      if (baseCanvas && wrapEl.offsetParent) renderDisplay();
    });
  }

  function loadFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        originalCanvas = capToMaxDim(img, MAX_SRC_DIM);
        rotation = 0;
        brightness = 0;
        crop = { ...DEFAULT_CROP };
        rebuildBase();
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // Bild auf maxDim (längste Seite) kappen; Ergebnis als Canvas, damit wiederholtes
  // Neu-Rotieren/Aufhellen immer vom selben Ausgangsmaterial ausgeht (kein Qualitätsverlust
  // über mehrere Zwischenstufen).
  function capToMaxDim(img, maxDim) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.max(w, h) > maxDim ? maxDim / Math.max(w, h) : 1;
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    c.getContext('2d').drawImage(img, 0, 0, cw, ch);
    return c;
  }

  function rebuildBase() {
    const w = originalCanvas.width, h = originalCanvas.height;
    const rad = rotation * Math.PI / 180;
    const newW = Math.max(1, Math.round(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))));
    const newH = Math.max(1, Math.round(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))));
    const c = document.createElement('canvas');
    c.width = newW;
    c.height = newH;
    const bctx = c.getContext('2d');
    if (brightness !== 0) {
      // 'brightness' Canvas-Filter: 1.0 = unverändert, >1 heller
      bctx.filter = `brightness(${1 + brightness / 100})`;
    }
    bctx.translate(newW / 2, newH / 2);
    bctx.rotate(rad);
    bctx.drawImage(originalCanvas, -w / 2, -h / 2);
    baseCanvas = c;
    renderDisplay();
  }

  function renderDisplay() {
    if (!baseCanvas) return;
    const bw = baseCanvas.width, bh = baseCanvas.height;
    const wrapW = wrapEl.clientWidth || bw;
    let scale = Math.min(1, MAX_DISPLAY_DIM / Math.max(bw, bh));
    if (wrapW && bw * scale > wrapW) scale = wrapW / bw;
    const dw = Math.max(1, Math.round(bw * scale));
    const dh = Math.max(1, Math.round(bh * scale));
    canvasEl.width = dw;
    canvasEl.height = dh;
    ctx.drawImage(baseCanvas, 0, 0, dw, dh);
    wrapEl.style.height = dh + 'px';
    updateRectDom();
  }

  function updateRectDom() {
    const dw = canvasEl.width, dh = canvasEl.height;
    rectEl.style.left = (crop.x0 * dw) + 'px';
    rectEl.style.top = (crop.y0 * dh) + 'px';
    rectEl.style.width = ((crop.x1 - crop.x0) * dw) + 'px';
    rectEl.style.height = ((crop.y1 - crop.y0) * dh) + 'px';
  }

  function setRotation(deg) {
    rotation = deg;
    rebuildBase();
  }

  function setBrightness(val) {
    brightness = val;
    rebuildBase();
  }

  function resetAll() {
    rotation = 0;
    brightness = 0;
    crop = { ...DEFAULT_CROP };
    rebuildBase();
  }

  // ── Pointer-Interaktion: EIN Satz Handler für Touch UND Maus (Pointer Events) ──
  function wireEvents() {
    rectEl.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.crop-handle');
      dragMode = handle ? handle.dataset.h : 'move';
      dragStart = {
        px: e.clientX, py: e.clientY,
        crop: { ...crop },
        dw: canvasEl.width, dh: canvasEl.height
      };
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch { /* ignoriere */ }
      }
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragMode || !dragStart) return;
      const dx = (e.clientX - dragStart.px) / dragStart.dw;
      const dy = (e.clientY - dragStart.py) / dragStart.dh;
      applyDrag(dx, dy);
      e.preventDefault();
    });
    window.addEventListener('pointerup', () => { dragMode = null; dragStart = null; });
    window.addEventListener('pointercancel', () => { dragMode = null; dragStart = null; });
  }

  function applyDrag(dx, dy) {
    const c0 = dragStart.crop;
    const minSize = MIN_CROP_FRACTION;
    let { x0, y0, x1, y1 } = c0;

    if (dragMode === 'move') {
      const w = x1 - x0, h = y1 - y0;
      x0 = clamp(c0.x0 + dx, 0, 1 - w);
      y0 = clamp(c0.y0 + dy, 0, 1 - h);
      x1 = x0 + w;
      y1 = y0 + h;
    } else {
      if (dragMode.includes('w')) x0 = clamp(c0.x0 + dx, 0, c0.x1 - minSize);
      if (dragMode.includes('e')) x1 = clamp(c0.x1 + dx, c0.x0 + minSize, 1);
      if (dragMode.includes('n')) y0 = clamp(c0.y0 + dy, 0, c0.y1 - minSize);
      if (dragMode.includes('s')) y1 = clamp(c0.y1 + dy, c0.y0 + minSize, 1);
    }
    crop = { x0, y0, x1, y1 };
    updateRectDom();
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ── Export: zugeschnittenes Bild als JPEG-Blob (volle Arbeitsauflösung) ──
  function getCroppedBlob(quality = 0.9) {
    return new Promise((resolve) => {
      // Bild evtl. noch nicht dekodiert (sehr schneller Tap) -> null, Aufrufer fängt ab
      if (!baseCanvas) { resolve(null); return; }
      const bw = baseCanvas.width, bh = baseCanvas.height;
      const sx = Math.round(crop.x0 * bw);
      const sy = Math.round(crop.y0 * bh);
      const sw = Math.max(1, Math.round((crop.x1 - crop.x0) * bw));
      const sh = Math.max(1, Math.round((crop.y1 - crop.y0) * bh));
      const out = document.createElement('canvas');
      out.width = sw;
      out.height = sh;
      out.getContext('2d').drawImage(baseCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
      out.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
  }

  return { init, loadFromDataUrl, setRotation, setBrightness, resetAll, getCroppedBlob };
})();
