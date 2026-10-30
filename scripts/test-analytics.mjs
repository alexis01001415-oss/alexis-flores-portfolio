import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// No network or account is used. Exercise opt-out before tracker load, including
// browsers that deny storage, so owner visits cannot leak during configuration.
const compile = source => ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
} }).outputText;
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const coreUrl = moduleUrl(compile(await readFile(new URL('../src/analytics-core.ts', import.meta.url), 'utf8')));
const core = await import(coreUrl);
const source = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
const code = compile(source).replace("'./analytics-core'", JSON.stringify(coreUrl))
  .replace("import './analytics.css';", '').replace('import.meta.env.VITE_GOATCOUNTER_SITE', 'globalThis.testAnalyticsSite');
const { setupAnalytics } = await import(moduleUrl(code));
const base = `${core.portfolioOrigin}${core.portfolioPath}`;
const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
};

assert.equal(core.isProductionPage(new URL(base)), true);
assert.equal(core.isProductionPage(new URL(`${base}index.html?campaign=test#cv`)), true);
for (const address of ['http://localhost:5173/', `${core.portfolioOrigin}/solea-solar/`, `${base}extra`]) {
  assert.equal(core.isProductionPage(new URL(address)), false);
}
const store = memory();
for (let i = 0; i < 2; i++) assert.equal(core.visitPreference(new URL(`${base}?visitas=excluir`), store).excluded, true);
assert.equal(core.visitPreference(new URL(base), store).excluded, true);
assert.equal(core.visitPreference(new URL(`${base}?visitas=incluir`), store).excluded, false);
assert.equal(core.visitPreference(new URL(base), store).excluded, false);
store.setItem('skipgc', 't');
assert.equal(core.visitPreference(new URL(`${base}?visitas=incluir`), store).excluded, true);
assert.deepEqual(core.visitPreference(new URL(`${base}?visitas=excluir`), undefined), { excluded: true, providerExcluded: false, persisted: false, action: 'excluir' });
const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); }, removeItem() { throw Error('denied'); } };
assert.equal(core.visitPreference(new URL(`${base}?visitas=excluir`), denied).excluded, true);
assert.equal(core.parseVisitCount({ count: '1,234' }), '1,234');
assert.equal(core.parseVisitCount({ count: '0' }), '0');
for (const data of [null, {}, { count: 0 }, { count: '<script>x</script>' }, { count: 'unknown' }]) {
  assert.throws(() => core.parseVisitCount(data));
}

class Element {
  textContent = '';
  hidden = false;
  children = new Map();
  events = new Map();
  classList = { add() {}, remove() {} };
  querySelector(selector) {
    if (!this.children.has(selector)) this.children.set(selector, new Element());
    return this.children.get(selector);
  }
  removeAttribute() {}
  setAttribute() {}
  addEventListener(name, fn) { this.events.set(name, fn); }
}
function fixture({ site = 'test-fixture', address = base, storage = memory(), visible = true, dnt = '0', failure = false } = {}) {
  const indicator = new Element();
  const scripts = [];
  const requests = [];
  const events = new Map();
  globalThis.testAnalyticsSite = site;
  globalThis.location = new URL(address);
  globalThis.history = { state: null, replaceState(_state, _unused, next) { globalThis.location = new URL(next); } };
  globalThis.window = { localStorage: storage };
  window.self = window.top = window;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { doNotTrack: dnt } });
  globalThis.document = {
    visibilityState: visible ? 'visible' : 'hidden',
    referrer: 'https://referrer.example/article?private=value',
    querySelector: () => indicator, createElement: () => new Element(),
    head: { appendChild: element => scripts.push(element) },
    addEventListener: (type, fn) => events.set(type, fn), removeEventListener: type => events.delete(type),
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: !failure, json: async () => ({ count: '123' }) };
  };
  setupAnalytics();
  return { indicator, scripts, requests, events };
}
for (const options of [
  { site: '' }, { address: 'http://localhost:5173/' },
  { address: `${core.portfolioOrigin}/solea-solar/` }, { visible: false },
]) {
  const f = fixture(options);
  assert.equal(f.scripts.length, 0);
  assert.equal(f.requests.length, 0);
}
for (const options of [
  { address: `${base}?visitas=excluir` },
  { address: `${base}?visitas=excluir`, storage: denied }, { dnt: '1' },
]) {
  const f = fixture(options);
  assert.equal(f.scripts.length, 0, 'Exclusion must precede script insertion');
}
const active = fixture({ address: `${base}?campaign=private#cv` });
assert.equal(active.scripts.length, 1);
assert.equal(active.requests.length, 3);
assert.equal(window.goatcounter.path, core.portfolioPath);
assert.equal(window.goatcounter.referrer, 'https://referrer.example');
assert.equal(window.goatcounter.no_onload, true);
assert.equal(active.scripts[0].referrerPolicy, 'no-referrer');
let counts = 0;
window.goatcounter.get_data = () => ({ p: core.portfolioPath, q: '?campaign=private', r: 'https://referrer.example' });
window.goatcounter.count = () => {
  const payload = window.goatcounter.get_data();
  assert.equal('q' in payload, false, 'Provider query collection must be stripped at the payload boundary');
  assert.equal(payload.p, core.portfolioPath);
  counts++;
};
active.scripts[0].events.get('load')();
assert.equal(counts, 1);
for (const request of active.requests) {
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.url.includes('private'), false);
}
await new Promise(resolve => setImmediate(resolve));
assert.equal(active.indicator.querySelector('[data-visit-count="week"]').textContent, '123');

const raceStore = memory();
const race = fixture({ storage: raceStore });
raceStore.setItem(core.exclusionKey, '1');
window.goatcounter.count = () => { throw Error('Excluded during script load'); };
race.scripts[0].events.get('load')();

const background = fixture({ visible: false });
document.visibilityState = 'visible';
background.events.get('visibilitychange')();
assert.equal(background.scripts.length, 1);
assert.equal(background.events.size, 0);
const unavailable = fixture({ failure: true });
await new Promise(resolve => setImmediate(resolve));
assert.match(unavailable.indicator.querySelector('[data-visit-status]').textContent, /no disponibles/);
assert.notEqual(unavailable.indicator.querySelector('[data-visit-count="week"]').textContent, '0');
console.log('Analytics checks passed: opt-out, denied storage, production scope, privacy, single load, counters and failures. No network used.');
