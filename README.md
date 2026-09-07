# Belegfoto

Kleine Web-App (PWA) zum Fotografieren und Zuschneiden von Belegen: mehrere
Belege nacheinander aufnehmen, zurechtrücken (begradigen/aufhellen), in einer
Sammlung ansehen und am Ende alle zusammen in einer einzigen Mail über das
Teilen-Menü des Geräts versenden. Läuft vollständig im Browser, funktioniert
offline und lässt sich auf dem Smartphone wie eine App installieren.

**App starten:** <https://e1felixr.github.io/spesenbeleg-app/>

## So funktioniert's

Drei Schritte, oben als Punkte 1 – 2 – 3 angezeigt:

1. **Fotografieren** — Beleg mit der Kamera aufnehmen oder aus der Galerie
   wählen. Mehrere Fotos gehören zu EINEM Beleg (z. B. Vorder- und Rückseite
   oder mehrere Zettel). Wer unterwegs keine Ruhe zum Zuschneiden hat, nimmt
   „Ohne Zuschnitt übernehmen" und rückt später zurecht.
2. **Zuschneiden** — den Rahmen an den Ecken auf den Beleg ziehen; bei Bedarf
   zuvor begradigen und aufhellen. Über die Auswahl „Qualität"
   (Hoch/Mittel/Niedrig) lässt sich die Dateigröße steuern — Mittel ist
   voreingestellt und zielt auf etwa 1 MB je Foto, damit die Mail durch die
   Anhang-Grenze des Postfachs passt.
3. **Sammlung & Versand** — der fertige Beleg landet in der Sammlung. Von dort
   entweder „Weiteren Beleg erfassen" (zurück zu Schritt 1, Sammlung bleibt
   erhalten) oder „Alle senden" — dann gehen alle gesammelten Belege gemeinsam
   als Anhänge einer einzigen Mail über das Teilen-Menü raus (dort die
   Mail-App wählen, Empfänger selbst eintragen). Ein Betreff wird automatisch
   gebildet, groß zum Kopieren angezeigt und beim Senden zusätzlich in die
   Zwischenablage gelegt. Unterstützt ein Gerät kein Teilen mit Datei-Anhang,
   lädt die App die Bilder herunter.

Jedes Foto in der Sammlung trägt unten rechts ein grünes Stift-Symbol — damit
lässt sich der Zuschnitt jederzeit erneut ändern.

## Installation auf dem Smartphone

Die Adresse im Browser öffnen und dann je nach Browser installieren:

**Chrome (Android) — empfohlen:** Menü (drei Punkte oben rechts) →
„App installieren" bzw. „Zum Startbildschirm hinzufügen" → bestätigen.

**Edge (Android):** Menü (drei Punkte unten mittig) → „Zum Smartphone
hinzufügen" → „Installieren".

**Samsung Internet:** Menü (drei Striche unten rechts) → „Seite hinzufügen zu"
→ „Startbildschirm" → bestätigen.

**iPhone (Safari):** Teilen-Symbol (Quadrat mit Pfeil nach oben) → „Zum
Home-Bildschirm" → bestätigen.

Die App erscheint danach als Symbol auf dem Startbildschirm und öffnet sich
ohne Browser-Leiste im Vollbild.

## Updates

Die App lädt beim Öffnen die aktuellen Dateien (Network-first); ein Update
wird beim **nächsten App-Start** übernommen — ohne Zutun. Die laufende Version
steht im Kopf der App.

Nur Änderungen an der `manifest.json` (App-Name, Symbole, Ausrichtung) greifen
erst nach einer **Neuinstallation**: App vom Startbildschirm entfernen, im
Browser neu öffnen, erneut hinzufügen.

## Datenschutz & Datenspeicherung

Die App braucht **keinen Server und kein Backend** — sie läuft vollständig auf
dem Gerät.

| Was | Wo | Bleibt erhalten? |
|-----|-----|-----------------|
| Belegfotos (auch die gesamte Sammlung) | nur im Arbeitsspeicher | Nein — werden nach dem Versand bzw. Verlassen freigegeben |
| Laufende Nummer des Betreffs | localStorage | Ja (nur die Zahl, kein Bild) |
| Qualitätsstufe (Hoch/Mittel/Niedrig) | localStorage | Ja (nur die Einstellung, kein Bild) |
| App-Dateien (HTML/CSS/JS) | Service-Worker-Cache | Nein (wird automatisch neu geladen) |

Es werden **keine Belege und keine Bilddaten an einen Server übertragen** — der
Versand läuft ausschließlich über das Teilen-Menü des Geräts.

## Hilfe / Probleme

Zeigt die App trotz Internet eine alte Fassung oder startet nicht sauber: den
Browser-Cache leeren (Android: lange auf das App-Symbol → App-Info → Speicher →
Cache leeren) und die Seite neu öffnen. Die laufende Nummer bleibt erhalten.

Klappt das Teilen auf einem Gerät partout nicht: die Bilder herunterladen und
wie gewohnt selbst per Mail anhängen — der Betreff steht bereit.
