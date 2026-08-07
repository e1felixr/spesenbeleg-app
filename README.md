# E1 Spesenbeleg

Progressive Web App (PWA) zum mobilen Erfassen von Spesenbelegen: Beleg fotografieren, zuschneiden (begradigen/aufhellen) und per Teilen-Menü an die eigene Mail-Adresse senden. Läuft komplett im Browser, funktioniert offline und lässt sich auf dem Smartphone wie eine native App installieren.

**App starten:** [https://e1felixr.github.io/spesenbeleg-app/](https://e1felixr.github.io/spesenbeleg-app/)

**aktuelle Version:** v0.1.1 · **Letzte Änderung:** 05.08.2026

## So funktioniert's

Drei Schritte, oben als Punkte 1 – 2 – 3 angezeigt:

1. **Fotografieren** — Beleg mit der Kamera aufnehmen oder aus der Galerie wählen. Mehrere Fotos gehören zu EINEM Beleg (z. B. Vorder- und Rückseite oder mehrere Zettel). Für einen neuen, eigenständigen Beleg auf „Fertig — neuer Beleg" tippen.
2. **Zuschneiden** — den Rahmen an den Ecken auf den Beleg ziehen; bei Bedarf zuvor begradigen und aufhellen.
3. **Versenden** — über das native Teilen-Menü an die eigene Mail-Adresse senden (im Teilen-Menü Outlook wählen). Der Betreff `JJMMDD_Spesenbeleg_#` wird automatisch gebildet und groß zum Kopieren angezeigt. Unterstützt ein Gerät kein Teilen mit Datei-Anhang, lädt die App die Bilder herunter — der Betreff steht dann bereits zum Kopieren bereit.

## Installation auf dem Smartphone

Die App-URL im Browser öffnen und dann je nach Browser installieren:

**Chrome (Android) — empfohlen:**
1. Menü (drei Punkte oben rechts) antippen
2. „Zum Startbildschirm hinzufügen" oder „App installieren" wählen
3. Namen bestätigen → „Hinzufügen"

**Edge (Android):**
1. Menü (drei Punkte unten mittig) antippen
2. „Zum Smartphone hinzufügen" wählen
3. „Installieren" bestätigen

**Samsung Internet:**
1. Menü (drei Striche unten rechts) antippen
2. „Seite hinzufügen zu" → „Startbildschirm" wählen
3. Namen bestätigen → „Hinzufügen"

**iPhone (Safari):**
1. Teilen-Symbol (Quadrat mit Pfeil nach oben) antippen
2. „Zum Home-Bildschirm" wählen
3. Namen bestätigen → „Hinzufügen"

Die App erscheint danach als Icon auf dem Startbildschirm und öffnet sich ohne Browser-Leiste im Vollbildmodus.

## Updates & Versionierung

Die App nutzt eine **Network-first-Strategie**: Solange das Gerät online ist, werden beim Öffnen automatisch die aktuellsten Dateien geladen. Ein Update wird beim **nächsten App-Start** übernommen — kein manuelles Eingreifen nötig. Die aktuelle Version steht im Kopf der App.

### Muss ich neu installieren?

Die meisten Updates (Code, Styles, Funktionen) kommen automatisch. Nur Änderungen an der `manifest.json` (App-Name, Icons, Orientierung) greifen erst nach einer **Neuinstallation**: App vom Startbildschirm entfernen → im Browser neu öffnen → erneut zum Startbildschirm hinzufügen.

## Datenschutz & Datenspeicherung

Die App braucht **keinen Server und kein Backend** — sie läuft vollständig auf dem Gerät.

| Was | Wo | Bleibt erhalten? |
|-----|-----|-----------------|
| Belegfotos | nur im Arbeitsspeicher | Nein — werden nach dem Versand bzw. Verlassen freigegeben |
| Betreff-Tageszähler (`#`) | localStorage | Ja (nur die laufende Nummer, kein Bild) |
| App-Dateien (HTML/CSS/JS) | Service-Worker-Cache | Nein (wird automatisch neu geladen) |

Es werden **keine Belege und keine Bilddaten an einen Server übertragen** — der Versand läuft ausschließlich über das Teilen-Menü des Geräts (z. B. an Outlook).

## Hilfe / Probleme

Zeigt die App trotz Internet eine alte Version oder startet nicht sauber: den Browser-Cache leeren (Android: lange auf das App-Icon → App-Info → Speicher → Cache leeren) und die Seite neu öffnen. Der Tageszähler bleibt dabei erhalten.

Klappt das Teilen auf einem Gerät partout nicht: die Bild(er) herunterladen und wie gewohnt selbst per Mail anhängen — der Betreff steht bereit.
