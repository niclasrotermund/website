// Baut public/index.html aus src/site.html (dieselbe Datei läuft auch als claude.ai-Entwurf):
// richtiger Kopf mit Titel und Vorschaubild, Schriften vom eigenen Server statt von Google,
// dann config.js, Supabase und platform.js vor dem Seiten-Script.
import fs from "fs";
const src = fs.readFileSync(new URL("../src/site.html", import.meta.url), "utf8");
const body = src
  .replace(/<title>[^<]*<\/title>\n?/, "")
  .replace(/<meta name="claude:[^>]*>\n?/g, "")
  .replace(/<link rel="preconnect"[^>]*>\n?/g, "")
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, "")
  .replace('<a href="#start">Impressum</a>', '<a href="/impressum">Impressum</a>')
  .replace('<a href="#start">Datenschutz</a>', '<a href="/datenschutz">Datenschutz</a>');
for (const must of ['href="/impressum"', 'href="/datenschutz"']) if (!body.includes(must)) throw new Error("Footer-Link fehlt: " + must);
if (/fonts\.googleapis/.test(body)) throw new Error("Google Fonts noch eingebunden");
const desc = "Niclas Rotermund, Schlagzeuger und Manager. Termine, Projekte, Videos, Fotos und Booking.";
const head = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Niclas Rotermund · Schlagzeuger und Manager</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website"><meta property="og:title" content="Niclas Rotermund"><meta property="og:description" content="${desc}">
<meta property="og:image" content="https://www.niclasrotermund.com/img/header.jpg"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0c0b0a"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/anton-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<script src="/config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="/platform.js"></script>
</head><body>
`;
fs.writeFileSync(new URL("../public/index.html", import.meta.url), head + body + "\n</body></html>\n");
console.log("public/index.html geschrieben");
