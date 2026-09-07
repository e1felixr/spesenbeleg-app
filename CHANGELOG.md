# Changelog — Belegfoto

## v0.4.1 (07.09.2026, 10:07 Uhr)

### Verbessert
- **Die App heißt jetzt „Belegfoto" und nennt keine Firma mehr** — Sie liegt in einem öffentlich einsehbaren Repository; darin gehört kein Rückschluss auf das Unternehmen, den internen Ablauf oder das Programm am Rechner. Name, Beschreibung im Manifest, Kopfzeile, README und Quelltext-Kommentare sind entsprechend entkleidet; die Anleitung mit den Firmen-Bezügen lebt dort, wo sie hingehört — im Werkzeug am Rechner. Geheimes stand nie darin: die App hat kein Backend, keine Zugangsdaten und speichert keine Belege.
- **Hinweis:** Weil sich der App-Name im Manifest geändert hat, greift er auf bereits installierten Telefonen erst nach einer Neuinstallation (App vom Startbildschirm entfernen, Adresse neu öffnen, wieder hinzufügen). Alles andere kommt wie gewohnt beim nächsten Start.

## v0.4.0 (07.09.2026, 09:41 Uhr)

### Neu
- **„Ohne Zuschnitt übernehmen"** — Unterwegs fehlt oft die Ruhe zum Rahmenziehen. Der neue Knopf unter „Weiter zum Zuschneiden" nimmt die Fotos, wie sie sind, und legt sie unmittelbar in die Sammlung. Zurechtgerückt wird später — hier über das Stift-Symbol in der Sammlung, oder später am Rechner, wo sich der Beleg ebenfalls zuschneiden, drehen und aufhellen lässt. Die gewählte Bildqualität gilt weiterhin: die Mail muss durch die Anhang-Grenze des Postfachs passen, und volle Kamera-Auflösung bringt bei einem Papierbeleg keinen lesbaren Gewinn.

## v0.3.0 (07.09.2026, 09:10 Uhr)

### Neu
- **Fotos lassen sich nach dem Zuschneiden erneut anpassen** — Bisher war ein Zuschnitt endgültig: wer den Rahmen zu eng gesetzt oder zu stark aufgehellt hatte, musste den Beleg entfernen und neu fotografieren. Jetzt trägt jedes Foto in der Sammlung unten rechts ein grünes Stift-Symbol; ein Tipp darauf öffnet es wieder im Zuschnitt-Screen — und zwar genau so, wie man es verlassen hat (Rahmen, Begradigung, Aufhellung sind vorbelegt). „Übernehmen" ersetzt das Bild an Ort und Stelle, der Zurück-Pfeil verwirft die Änderung. Auch innerhalb eines laufenden Zuschnitt-Durchgangs merkt sich „Vorheriges Foto erneut zuschneiden" nun die zuletzt gewählten Einstellungen.

### Verbessert
- **Der Betreff geht beim Versand nicht mehr verloren** — Ohne das Stichwort im Betreff wird die Mail am Rechner später nicht gefunden. Der Betreff wird dem Teilen-Menü weiterhin mitgegeben und jetzt zusätzlich automatisch in die Zwischenablage gelegt, ehe es aufgeht: übernimmt das Mail-Programm ihn nicht selbst, genügt ein Einfügen. Ein Hinweis über dem Betreff erklärt das, und die Anhänge tragen den Betreff nun im Dateinamen.

### Intern
- Die Originaldatei jedes Fotos bleibt als `File`-Referenz an der Sammlung hängen (Grundlage des Nachbearbeitens) — bewusst nicht als base64-`dataUrl`, die dauerhaft im Speicher läge. `CropTool` bekommt `getState()` und nimmt in `loadFromDataUrl` einen Zustand entgegen; der Object-URL der Quelldatei wird nach dem Dekodieren sofort freigegeben. Cache-Marken mitgezogen (`?v=103`, `e1-spesenbeleg-v3`).

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
- **Erste Version der Beleg-Erfassungs-PWA** — Beleg(e) mit dem Handy fotografieren (Kamera oder Galerie, mehrere Fotos nacheinander), präzise per Touch/Maus zuschneiden (inkl. optionaler Begradigung/Aufhellung) und direkt über das native Teilen-Menü an die eigene Mail-Adresse senden. Betreff `JJMMDD_Spesenbeleg_#` wird automatisch gebildet (Tageszähler in localStorage) und zusätzlich groß zum manuellen Kopieren angezeigt. Fallback ohne Web-Share/Dateien: Bild-Download + Betreff-Kopie.
- Offline-fähig als installierbare PWA (Service Worker, Network-first mit Auto-Update-Übernahme beim nächsten App-Start) — kein Server/Backend, keine Laufzeit-Abhängigkeit von Python.
