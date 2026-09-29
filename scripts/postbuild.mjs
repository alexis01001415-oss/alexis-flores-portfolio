import { readFile, writeFile } from 'node:fs/promises';

const origin = process.env.SITE_URL || 'https://alexis01001415-oss.github.io/alexis-flores-portfolio/';
const url = new URL(origin);
if (url.protocol !== 'https:' || !url.hostname.endsWith('.github.io')) throw new Error('SITE_URL must be a trusted HTTPS GitHub Pages URL.');
const site = url.href.endsWith('/') ? url.href : `${url.href}/`;
let html = await readFile('dist/index.html', 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const schema = {
  '@context': 'https://schema.org', '@graph': [
    {
      '@type': 'Person', '@id': `${site}#alexis`, name: 'Felix Alexis Flores Rojas', alternateName: 'Alexis Flores', url: site,
      sameAs: [
        'https://www.linkedin.com/in/felix-alexis-flores-rojas-94a885265/',
        'https://www.behance.net/alexisflores01001415',
        'https://github.com/alexis01001415-oss',
      ],
      jobTitle: 'Diseñador UX/UI',
      description: 'Diseño de productos digitales, investigación de usuarios, prototipos en Figma, diseño gráfico, Blender e inteligencia artificial aplicada. Dominio de HTML y CSS; JavaScript básico.',
      knowsAbout: ['Diseño UX/UI', 'Figma', 'Diseño gráfico', 'Blender', 'Framer', 'WordPress', 'Webflow', 'HTML', 'CSS', 'Prompt engineering'],
    },
    { '@type': 'WebSite', '@id': `${site}#website`, url: site, name: 'Alexis Flores — Portafolio', inLanguage: 'es-MX', author: { '@id': `${site}#alexis` } },
    { '@type': 'ProfilePage', '@id': `${site}#profile`, url: site, name: 'Felix Alexis Flores Rojas — Diseño UX/UI', description: 'Portafolio profesional con proyectos, experiencia laboral, competencias y CV descargable.', inLanguage: 'es-MX', mainEntity: { '@id': `${site}#alexis` } },
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
await writeFile('dist/404.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#131211"><title>Página no encontrada — Alexis Flores</title></head><body style="margin:0;background:#131211;color:#F2EAE3;font:20px/1.4 system-ui;padding:10vw"><main><p style="color:#D0C9C3;font-size:14px;letter-spacing:1.5px">ERROR 404</p><h1 style="max-width:15ch;font-size:clamp(40px,8vw,96px);line-height:1.2">Página no encontrada<span style="color:#FF073A">.</span></h1><p>El enlace puede haber cambiado o la página ya no existe.</p><a style="display:inline-block;margin-top:24px;padding:16px 24px;background:#c90030;color:#F2EAE3;text-decoration:none;font-weight:700;border-radius:3px" href="${escape(site)}">Volver al portafolio</a></main></body></html>`);
console.log(`Static metadata generated for ${site}`);
