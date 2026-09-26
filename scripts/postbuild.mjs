import { readFile, writeFile } from 'node:fs/promises';

const origin = process.env.SITE_URL || 'https://alexis01001415-oss.github.io/alexis-flores-portfolio/';
const url = new URL(origin);
if (url.protocol !== 'https:' || !url.hostname.endsWith('.github.io')) throw new Error('SITE_URL must be a trusted HTTPS GitHub Pages URL.');
const site = url.href.endsWith('/') ? url.href : `${url.href}/`;
let html = await readFile('dist/index.html', 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const schema = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'Person', '@id': `${site}#alexis`, name: 'Alexis Flores', url: site, sameAs: ['https://github.com/alexis01001415-oss'], description: 'Diseño digital y experiencias web.' },
    { '@type': 'WebSite', '@id': `${site}#website`, url: site, name: 'Alexis Flores — Portafolio', inLanguage: 'es-MX', author: { '@id': `${site}#alexis` } },
    { '@type': 'ProfilePage', '@id': `${site}#profile`, url: site, name: 'Alexis Flores — Diseño digital y experiencias web', inLanguage: 'es-MX', mainEntity: { '@id': `${site}#alexis` } },
  ],
};
// JSON-LD is inert data. Hash it in CSP so parsers and browsers accept the exact block.
const jsonLd = JSON.stringify(schema).replaceAll('<', '\\u003c');
const { createHash } = await import('node:crypto');
const hash = createHash('sha256').update(jsonLd).digest('base64');
html = html.replace("script-src 'self'", `script-src 'self' 'sha256-${hash}'`)
  .replace(' ws://127.0.0.1:*', '')
  .replace('</head>', `<link rel="canonical" href="${escape(site)}" />\n<meta property="og:url" content="${escape(site)}" />\n<script type="application/ld+json">${jsonLd}</script>\n</head>`);
await writeFile('dist/index.html', html);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(site)}</loc></url></urlset>`);
await writeFile('dist/404.html', `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Página no encontrada — Alexis Flores</title><body style="background:#151713;color:#efefe7;font:20px/1.5 system-ui;padding:10vw"><p>404 / FUERA DEL ESTUDIO</p><h1>Esta página no está aquí.</h1><p>La siguiente buena idea te espera en el portafolio.</p><a style="color:#d6f36b" href="${escape(site)}">Volver al inicio</a></body></html>`);
console.log(`Static metadata generated for ${site}`);
