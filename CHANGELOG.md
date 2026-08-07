# Changelog — E1 Spesenbeleg-App

## v0.2.0 (07.08.2026, 13:25 Uhr)

### Neu
- **Belege sammeln, am Ende EINE Mail mit mehreren Anhängen** — bisher wurde nach jedem Beleg sofort einzeln geteilt. Jetzt landet ein fertig zugeschnittener Beleg automatisch in einer Sammlung (Screen 3); von dort aus entweder „Weiteren Beleg erfassen" (zurück zur Aufnahme, Sammlung bleibt erhalten) oder „Alle senden" — dann gehen alle gesammelten Belege gemeinsam als Anhänge einer einzigen `navigator.share`-Mail raus. Jeder Beleg lässt sich vor dem Versand einzeln wieder aus der Sammlung entfernen. Der Betreff bekommt zusätzlich zum Tageszähler die aktuelle Beleg-Anzahl angehängt (`JJMMDD_Spesenbeleg_#_XBelege`) und aktualisiert sich live beim Hinzufügen/Entfernen.
- **Bildqualität einstellbar, Default ~1 MB je Foto** — auf dem Zuschneiden-Screen steht jetzt eine Qualitätsauswahl (Hoch/Mittel/Niedrig) zur Verfügung, die Wahl bleibt geräteweit gespeichert (localStorage). Der JPEG-Export drückt Qualität und bei Bedarf zusätzlich die Kantenlänge iterativ so weit herunter, bis eine Zielobergrenze unterschritten wird (Mittel = Default = 1,2 MB Deckel, zielt im Regelfall auf ca. 1 MB; Hoch = 1,8 MB Deckel; Niedrig = 0,6 MB Deckel) — robust auch bei sehr detailreichen Fotos, ohne kleine helle Belege unnötig zu verkleinern.

### Intern
- Vorschau-Object-URLs der Sammlung werden bei jedem Re-Render und beim vollständigen Zurücksetzen freigegeben (kein Blob-Leak über mehrere Belege/Sammlungen hinweg).

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
