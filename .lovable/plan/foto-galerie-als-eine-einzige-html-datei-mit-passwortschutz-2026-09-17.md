# Foto-Galerie als eine einzige HTML-Datei mit Passwortschutz

## Ziel
Die Website soll ohne localhost und ohne Server laufen: Eine einzige Datei (z. B. `foto-galerie.html`), die der Nutzer doppelklickt und die sich in Chrome/Edge öffnet. Beim ersten Öffnen legt der Nutzer ein Passwort fest; danach öffnet sich die Galerie nur noch nach Eingabe dieses Passworts.

## Schritt 1: Passwortschutz in der App
- Beim allerersten Start: Bildschirm „Passwort festlegen" (zweimal eingeben).
- Das Passwort wird **nicht im Klartext** gespeichert, sondern nur als Prüfwert (Hash) in IndexedDB abgelegt.
- Bei jedem weiteren Öffnen: Sperrbildschirm mit Passwortfeld. Falsches Passwort → Hinweis, nichts wird angezeigt.
- Einmal entsperrt, bleibt die Sitzung im selben Browser-Tab geöffnet; nach dem Schließen des Tabs muss das Passwort erneut eingegeben werden (sessionStorage), so wie der Nutzer es wünscht („schließt sich automatisch, wenn man es beendet").
- Optional: Button „Sperren" oben in der Galerie.
- Ehrlicher Hinweis an den Nutzer: Ein Passwort in einer lokalen Datei schützt vor neugierigen Blicken, aber nicht vor technisch versierten Angreifern. Die Fotos selbst bleiben ohnehin im Ordner auf der Festplatte und stecken nicht in der Datei.

## Schritt 2: Einzel-HTML-Datei erzeugen
- Zusätzliche Build-Konfiguration (eigenes Vite-Config + Skript `npm run build:single`), die die App komplett – JavaScript und CSS – in **eine einzige HTML-Datei** bündelt (via `vite-plugin-singlefile`).
- Ergebnis liegt in einem Ordner wie `dist-single/foto-galerie.html` und wird dem Nutzer zum Herunterladen bereitgestellt (in Files).
- Die Datei funktioniert per Doppelklick (`file://`) in Chrome/Edge – File System Access API und IndexedDB funktionieren dort.
- Bestehender Dev-Server-Betrieb bleibt unverändert möglich; es wird nichts am aktuellen Verhalten geändert.

## Schritt 3: Anleitung
Kurze Anleitung (Deutsch) direkt im Chat:
1. Datei doppelklicken (Chrome/Edge).
2. Beim ersten Mal Passwort festlegen.
3. Foto-Ordner auswählen – fertig. Kennzeichen und Ausblendungen werden im Browser auf diesem Rechner gespeichert.

## Technische Details
- Passwort-Hash: SHA-256 über Web Crypto API mit zufälligem Salt, gespeichert in IndexedDB (gleiche Datenbank wie die bisherigen Galerie-Daten).
- Entsperr-Status: sessionStorage (pro Tab, geht beim Schließen verloren).
- Single-File-Build: `vite-plugin-singlefile` als Dev-Dependency, eigenes Entry-HTML ohne Serverfunktionen – die Galerie ist bereits vollständig clientseitig (IndexedDB + File System Access API), daher ist kein Server nötig.
- Sperrbildschirm-Komponente + Hook `usePasswordGate`, Einbindung in `src/routes/index.tsx` oberhalb der Galerie.
- Schriftarten werden weiterhin per Link geladen; ohne Internet fallen sie auf Systemschriften zurück (Funktion bleibt erhalten).
