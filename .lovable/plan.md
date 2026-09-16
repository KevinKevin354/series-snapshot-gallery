# Foto-Galerie aus Ihrem eigenen Ordner

Eine Seite, die Ihren Fotoordner direkt von der Festplatte liest. Keine Uploads, kein Server – die Fotos bleiben, wo sie sind. Alle Zusatzangaben (Kennzeichen, ausgeblendete Fotos) werden im Browser gespeichert und sind nach dem Schließen und erneuten Öffnen wieder da.

## Ordner einmal auswählen

Beim ersten Öffnen ein Klick auf "Fotoordner auswählen" und Ihr Hauptordner wird gewählt. Danach erkennt die Seite ihn automatisch wieder – nur einmal pro Sitzung ein kurzes "Zugriff erlauben".

Erwartete Struktur:

```text
Fotos/
  Suits/
    Harvey Specter/  foto1.jpg ...
    Louis Litt/      ...
  Breaking Bad/
    Walter White/    ...
```

Serien und Personen ergeben sich vollständig aus den Ordnernamen. Ein neuer Serien- oder Personenordner erscheint beim nächsten Öffnen (oder nach Klick auf "Neu einlesen") von selbst – nichts einzutragen.

## Ansicht

- Foto-Raster mit allen Fotos; Klick öffnet das Foto groß mit Serie, Person und Kennzeichen.
- Filterleiste oben mit drei Gruppen: Serien, Personen, Kennzeichen.
  - Ein Klick = einschließen. Mehrere Personen gleichzeitig zeigen alle Fotos, auf denen mindestens eine davon vorkommt.
  - Doppelklick = ausschließen (rot markiert). Solche Fotos werden nie angezeigt, auch wenn eine andere aktive Person darauf ist.
  - Nochmal klicken hebt die Auswahl auf; "Filter zurücksetzen" leert alles.
  - Die Personenliste zeigt nur Personen der gewählten Serien.
- Zwei eigene Bereiche, jeweils mit Anzahl:
  - **Neu gefunden** – Fotos, die seit dem letzten Besuch dazugekommen sind.
  - **Ohne Kennzeichen** – Fotos, denen noch kein Kennzeichen zugewiesen wurde.

## Kennzeichen

Eine von Ihnen gepflegte Liste: Kennzeichen anlegen, umbenennen, löschen. Am Foto (einzeln oder für mehrere ausgewählte Fotos gleichzeitig) werden Kennzeichen aus dieser Liste per Klick gesetzt oder entfernt. Speichern passiert automatisch.

## Fotos ausblenden

Jedes Foto hat "Von der Webseite entfernen". Es verschwindet aus der Galerie, die Datei auf Ihrer Festplatte bleibt unangetastet. Ein Bereich "Ausgeblendet" listet diese Fotos, damit Sie sie jederzeit zurückholen können. Damit lassen sich auch Fotos erledigen, die unter verschiedenen Namen doppelt in mehreren Personenordnern liegen.

## Technische Details

- TanStack Start, eine Route `/` (Galerie) plus Verwaltungs-Dialoge; keine Serverfunktionen, keine Datenbank.
- File System Access API: `showDirectoryPicker()`, rekursives Einlesen von Serie/Person/Datei, Anzeige über `URL.createObjectURL` aus dem `FileSystemFileHandle`.
- Verzeichnis-Handle und alle Metadaten in IndexedDB (`idb-keyval`): Handle, Kennzeichen-Liste, Zuordnung Kennzeichen→Foto, ausgeblendete Fotos, Liste bereits gesehener Fotos für "Neu gefunden".
- Foto-Identität = `Serie/Person/Dateiname`; Umbenennen einer Datei zählt als neues Foto.
- Filterlogik: Einschluss-Mengen als ODER, Ausschluss-Mengen mit Vorrang; Serien-, Personen- und Kennzeichen-Filter werden mit UND verknüpft.
- Alle Zustände (Ordner nicht gewählt, Zugriff verweigert, leerer Ordner, nicht unterstützter Browser) mit klarer Meldung abgedeckt.
