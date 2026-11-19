# niclasrotermund.com

Die Website von Niclas Rotermund: Termine mit Kalender-Export, Videos, Fotos, Kontakt und ein interner Bereich für Booking und Orga.

- `src/site.html`: die Seite. Dieselbe Datei läuft auch als claude.ai-Entwurf.
- `public/`: das, was online geht. `index.html` wird mit `node scripts/build.mjs` aus `src/site.html` gebaut.
- `public/platform.js`: verbindet die Seite mit Supabase (Termine, Fotos, Login für den internen Bereich).
- `supabase/website.sql`: Tabelle, Zugriffsregeln und Foto-Speicher.
- `public/impressum.html`, `public/datenschutz.html`: Pflichtseiten.

Die Website nutzt **dieselbe Supabase-Datenbank wie das Tourbuch**, aber eine eigene Tabelle (`site_docs`) und einen eigenen Foto-Speicher (`website`). Am Tourbuch ändert sich nichts. Bearbeiten darf nur der Hauptadmin des Tourbuchs, also du mit deinem Tourbuch-Login. Besucher brauchen kein Konto.

## Einrichtung

### 1. Supabase (einmalig, 2 Minuten)

1. Im Tourbuch-Projekt auf supabase.com **SQL Editor → New query** öffnen.
2. Den Inhalt von `supabase/website.sql` einfügen und **Run** klicken.

### 2. Vercel

1. Auf vercel.com **Add New → Project** wählen und das GitHub-Repository `website` importieren.
2. Framework Preset: **Other**. Build Command bleibt leer, Output Directory ist `public` (steht schon in `vercel.json`).
3. **Deploy** klicken. Danach läuft die Seite unter einer Test-Adresse wie `website-xyz.vercel.app`.
4. Dort testen: Termine im internen Bereich (`/#intern`) anlegen, Fotos hochladen, Videos eintragen.

### 3. Domain bei Strato umstellen (erst, wenn alles passt)

1. In Vercel unter **Settings → Domains** `niclasrotermund.com` und `www.niclasrotermund.com` hinzufügen. Vercel zeigt an, welche Einträge nötig sind (meist ein A-Record für die Hauptdomain und ein CNAME für `www`).
2. Bei Strato unter **Domains → Domainverwaltung → niclasrotermund.com → DNS**:
   - **A-Record** auf die IP von Vercel setzen.
   - Für `www` einen **CNAME-Record** auf den Wert von Vercel setzen.
   - **Die MX-Einträge (E-Mail) nicht anfassen.** Dann funktioniert info@niclasrotermund.com weiter wie bisher.
3. Nach ein paar Minuten bis Stunden zeigt die Domain auf die neue Seite. HTTPS richtet Vercel selbst ein.
4. Das alte WordPress bei Strato erst abschalten, wenn die neue Seite sicher läuft.

## Änderungen

`src/site.html` bearbeiten, dann `node scripts/build.mjs` ausführen und beides committen. Vercel veröffentlicht jeden Push auf `main` automatisch.

## Was der Entwurf anders macht als die echte Seite

| | Entwurf (claude.ai) | Echte Seite |
|---|---|---|
| YouTube | öffnet in neuem Tab | spielt direkt auf der Seite (erst nach Klick, über youtube-nocookie) |
| Instagram | öffnet in neuem Tab | spielt in einem Player über der Seite (erst nach Klick) |
| Apple-Kalender | gesperrt | lädt die .ics-Datei |
| Kontaktformular | verschickt nichts | öffnet das Mailprogramm mit fertiger Nachricht an info@ |
| Schriften | Google Fonts | vom eigenen Server (DSGVO) |
