import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Exercise the actual submission handler with local DOM/network doubles only.
const source = await readFile(new URL('../src/contact.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { setupContact, contactConfig } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const saved = { fetch: globalThis.fetch, FormData: globalThis.FormData, window: globalThis.window };
const fixtures = { name: '  Alexis  ', email: 'alexis@example.test', company: 'Example', interest: 'Una oportunidad laboral', message: 'Una oportunidad para colaborar.', botcheck: '' };
let requests = [];
let reply = async () => ({ ok: true, json: async () => ({ success: true }) });

class FakeControl {
  constructor(form, name) {
    this.form = form;
    this.name = name;
    this.minLength = name === 'message' ? 10 : -1;
    this.validationMessage = '';
  }
  get value() { return this.form.fields[this.name] || ''; }
  setCustomValidity(message) { this.validationMessage = message; }
  addEventListener(name, callback) { assert.equal(name, 'input'); this.onInput = callback; }
  edit(value) { this.form.fields[this.name] = value; this.onInput(); }
}

class FakeForm {
  constructor() {
    this.fields = { ...fixtures };
    this.attributes = new Map();
    this.valid = true;
    this.resetCount = 0;
    this.validationCount = 0;
    this.status = { textContent: '' };
    this.label = { textContent: '' };
    this.button = { disabled: false, querySelector: () => this.label };
    this.controls = { name: new FakeControl(this, 'name'), message: new FakeControl(this, 'message') };
  }
  querySelector(selector) {
    if (selector.startsWith('button')) return this.button;
    if (selector === '[name="name"]') return this.controls.name;
    if (selector === '[name="message"]') return this.controls.message;
    return this.status;
  }
  reportValidity() { this.validationCount++; return this.valid && Object.values(this.controls).every(control => !control.validationMessage); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(name, callback) { assert.equal(name, 'submit'); this.onSubmit = callback; }
  reset() { this.resetCount++; this.fields = {}; }
  async submit() {
    let prevented = false;
    await this.onSubmit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
  }
}

function prepare(key = 'test-only-public-key') {
  requests = [];
  contactConfig.accessKey = key;
  const form = new FakeForm();
  setupContact(form);
  return form;
}

function assertRecovered(form) {
  assert.equal(form.button.disabled, false);
  assert.equal(form.label.textContent, 'Enviar mensaje');
  assert.equal(form.attributes.has('aria-busy'), false);
}

try {
  globalThis.FormData = class { constructor(form) { this.fields = { ...form.fields }; } get(name) { return this.fields[name] ?? null; } };
  globalThis.window = { setTimeout };
  globalThis.fetch = async (url, init) => { requests.push({ url, init }); return reply(url, init); };

  let form = prepare('');
  form.fields.name = '   ';
  form.fields.message = '          ';
  assert.equal(form.button.disabled, true);
  await form.submit();
  assert.equal(requests.length, 0, 'Unconfigured forms must never transmit data');
  assert.equal(form.resetCount, 0);
  assert.match(form.status.textContent, /aún no está habilitado/);
  assert.equal(form.validationCount, 0, 'Unconfigured forms must not show validation errors');
  assert.equal(form.controls.name.validationMessage, '');
  assert.equal(form.controls.message.validationMessage, '');

  for (const field of ['name', 'message']) {
    form = prepare();
    form.fields[field] = '          ';
    await form.submit();
    assert.equal(requests.length, 0, `Whitespace-only ${field} must not transmit`);
    assert.equal(form.resetCount, 0, 'Validation preserves entered data');
    assert.notEqual(form.controls[field].validationMessage, '', 'The invalid field explains the error');
    assertRecovered(form);
    form.controls[field].edit(fixtures[field]);
    assert.equal(form.controls[field].validationMessage, '', 'Editing clears custom validity so native submission can resume');
    await form.submit();
    assert.equal(requests.length, 1, 'A corrected field can be submitted');
    assert.equal(form.resetCount, 1);
    assertRecovered(form);
  }

  form = prepare();
  form.valid = false;
  await form.submit();
  assert.equal(requests.length, 0, 'Invalid forms must not transmit');
  assertRecovered(form);

  form = prepare();
  form.fields.botcheck = 'on';
  await form.submit();
  assert.equal(requests.length, 0, 'Honeypot submissions must not transmit');
  assertRecovered(form);

  form = prepare();
  await form.submit();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.web3forms.com/submit');
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.name, 'Alexis', 'Trim user input before sending');
  assert.equal(payload.email, fixtures.email);
  assert.equal(payload.access_key, 'test-only-public-key');
  assert.equal(payload.botcheck, false);
  assert.equal(form.resetCount, 1, 'Successful submissions reset the form');
  assert.match(form.status.textContent, /Mensaje enviado/);
  assertRecovered(form);

  for (const [description, failure] of [
    ['HTTP error', async () => ({ ok: false, json: async () => ({ success: true }) })],
    ['API rejection', async () => ({ ok: true, json: async () => ({ success: false }) })],
    ['Invalid response', async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } })],
    ['Network failure', async () => { throw new Error('Network unavailable'); }],
  ]) {
    reply = failure;
    form = prepare();
    await form.submit();
    assert.equal(form.resetCount, 0, `${description} must preserve form content`);
    assert.deepEqual(form.fields, fixtures);
    assert.match(form.status.textContent, /Tus datos siguen aquí/);
    assertRecovered(form);
  }

  let resolvePending;
  reply = () => new Promise(resolve => { resolvePending = resolve; });
  form = prepare();
  const pending = form.submit();
  assert.equal(form.button.disabled, true);
  assert.equal(form.attributes.get('aria-busy'), 'true');
  await form.submit();
  assert.equal(requests.length, 1, 'Repeated submit during a request must be ignored');
  resolvePending({ ok: true, json: async () => ({ success: true }) });
  await pending;
  assert.equal(form.resetCount, 1);
  assertRecovered(form);

  globalThis.window = { setTimeout: callback => { queueMicrotask(callback); return 0; } };
  reply = (_, { signal }) => new Promise((_, reject) => {
    if (signal.aborted) reject(new Error('Aborted'));
    else signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
  });
  form = prepare();
  await form.submit();
  assert.equal(form.resetCount, 0);
  assert.deepEqual(form.fields, fixtures);
  assertRecovered(form);

  console.log('Contact handler: 12 scenarios passed. All network requests were mocked; no messages sent.');
} finally {
  globalThis.fetch = saved.fetch;
  globalThis.FormData = saved.FormData;
  if (saved.window === undefined) delete globalThis.window;
  else globalThis.window = saved.window;
}
