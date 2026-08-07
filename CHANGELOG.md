# Changelog — E1 Spesenbeleg-App

## v0.1.1 (05.08.2026, 14:47 Uhr)

### Verbessert
- **Zuschneiden am Handy griffiger** — die vier Eck-Anfasser haben jetzt eine größere Trefferfläche (40 statt 32 px), näher an der empfohlenen Touch-Zielgröße.

### Behoben
- **Kopfzeile bleibt unter der Statusleiste frei** — auf iPhones mit Notch/Dynamic Island wurde der grüne Kopf bislang teilweise von Uhr/Statusleiste überdeckt (Folge von `black-translucent` + `viewport-fit=cover`). Jetzt hält die Kopfzeile den Sicherheitsabstand (`safe-area-inset`); ebenso der untere Rand über dem Home-Indikator.

### Intern
- Vorschaubilder auf dem Versand-Screen geben ihre Object-URLs wieder frei (kein Blob-Leak über mehrere Beleg-Durchläufe); Absicherung gegen einen leeren Zuschnitt-Export (kein Absturz bei sehr schnellem Tippen). `.nojekyll` ergänzt, damit GitHub Pages alle Dateien unverändert ausliefert.

## v0.1.0 (05.08.2026, 14:35 Uhr)

### Neu
- **Erste Version der Spesenbeleg-Erfassungs-PWA** — Beleg(e) mit dem Handy fotografieren (Kamera oder Galerie, mehrere Fotos nacheinander), präzise per Touch/Maus zuschneiden (inkl. optionaler Begradigung/Aufhellung) und direkt über das native Teilen-Menü an die eigene Mail-Adresse senden. Betreff `JJMMDD_Spesenbeleg_#` wird automatisch gebildet (Tageszähler in localStorage) und zusätzlich groß zum manuellen Kopieren angezeigt. Fallback ohne Web-Share/Dateien: Bild-Download + Betreff-Kopie.
- Offline-fähig als installierbare PWA (Service Worker, Network-first mit Auto-Update-Übernahme beim nächsten App-Start) — kein Server/Backend, keine Laufzeit-Abhängigkeit von Python.
