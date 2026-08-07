// share.js - Versand über die Web-Share-API (mit Dateien) an die eigene Mail-Adresse.
// Der Nutzer wählt im nativen Teilen-Menü sein Mailprogramm (i. d. R. Outlook) selbst.
// Fallback (kein Web-Share mit Dateien verfügbar) wird von app.js/index.html übernommen:
// Bilder zum Download anbieten + Betreff zum Kopieren.

const ShareTool = (() => {
  function canShareFiles(files) {
    return !!(navigator.canShare && navigator.share && navigator.canShare({ files }));
  }

  // Rückgabe:
  //   'shared'      → erfolgreich über das System-Teilen-Menü übergeben
  //   'aborted'     → Nutzer hat das Teilen-Menü selbst abgebrochen (kein Fallback nötig)
  //   'unsupported' → Web-Share (mit Dateien) auf diesem Gerät/Browser nicht verfügbar
  //   'failed'      → Teilen-Versuch warf einen anderen Fehler
  async function shareFiles(files, subject) {
    if (!canShareFiles(files)) return 'unsupported';
    try {
      await navigator.share({ files, title: subject, text: subject });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'aborted';
      console.error('Web-Share fehlgeschlagen:', err);
      return 'failed';
    }
  }

  return { canShareFiles, shareFiles };
})();
