import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';

const target = process.argv[2] || 'http://127.0.0.1:4173/';
const desktop = process.argv.includes('--desktop');
await mkdir('artifacts', { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--disable-dev-shm-usage'] });
try {
  const result = await lighthouse(target, {
    port: chrome.port,
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  }, desktop ? desktopConfig : undefined);
  const label = desktop ? 'desktop' : 'mobile';
  await writeFile(`artifacts/lighthouse-${label}.json`, result.report[0]);
  await writeFile(`artifacts/lighthouse-${label}.html`, result.report[1]);
  console.log(JSON.stringify({ url: target, mode: label, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift'].map(key => [key, result.lhr.audits[key].displayValue])), issues: Object.values(result.lhr.audits).filter(a => a.score !== null && a.score < .9 && a.scoreDisplayMode !== 'informative').map(a => ({ id: a.id, title: a.title, detail: a.displayValue, items: a.details?.items?.slice(0, 5) })) }, null, 2));
} finally { try { await chrome.kill(); } catch (error) { if (error.code !== 'EPERM') throw error; console.warn('Audit complete. Windows retained a temporary Chrome profile while releasing its file locks.'); } }
