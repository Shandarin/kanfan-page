const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const html = readFileSync(path.join(__dirname, '../login.html'), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
function setup(autoConfirm = false) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { value: '', style: {}, listeners: {},
      addEventListener(name, fn) { this.listeners[name] = fn; }, removeAttribute() {}, focus() {} });
    return elements.get(id);
  }
  const calls = [];
  const session = { user: { id: 'test' } };
  let verificationError = null;
  const auth = {
    async getSession() { return { data: { session: null } }; },
    async signUp(args) { calls.push(['signup', args]); return { data: { session: null }, error: null }; },
    async signInWithPassword(args) { calls.push(['login', args]); return { data: { session }, error: null }; },
    async verifyOtp(args) { calls.push(['verify', args]); return { data: { session: verificationError ? null : session }, error: verificationError }; },
    async resend(args) { calls.push(['resend', args]); return { error: null }; },
    async signOut() { calls.push(['signout']); }
  };
  const window = { location: { search: '', href: 'login.html' }, postMessage() { calls.push(['sync']); } };
  const context = vm.createContext({ window, URLSearchParams, console,
    supabase: { createClient() { return { auth }; } },
    KanfanI18n: { getLang: () => 'en', t: key => key, renderSelect() {}, apply() {} },
    document: { getElementById: element, querySelector: element },
    setInterval() { return 1; }, clearInterval() {},
    fetch: async () => ({ ok: true, json: async () => ({ mailer_autoconfirm: autoConfirm }) })
  });
  vm.runInContext(source, context);
  element('email').value = 'user@example.test';
  element('password').value = ' password with spaces ';
  return { element, calls, window, context,
    toggle: () => element('toggle-btn').listeners.click(),
    submit: () => element('auth-form').listeners.submit({ preventDefault() {} }),
    failVerification: () => { verificationError = new Error('Invalid or expired code'); } };
}
test('password login stays unchanged and does not request an OTP', async () => {
  const s = setup(); await s.submit();
  assert.equal(s.calls[0][0], 'login');
  assert.equal(s.calls[0][1].password, ' password with spaces ');
  assert.equal(s.window.location.href, 'index.html');
  assert.equal(s.calls.some(c => c[0] === 'signup' || c[0] === 'verify'), false);
});
test('registration waits for OTP before creating a logged-in UI', async () => {
  const s = setup(); s.toggle(); await s.submit();
  assert.equal(s.element('signup-verification').hidden, false);
  assert.equal(s.element('email').readOnly, true);
  assert.equal(s.element('password').value, '');
  assert.equal(s.window.location.href, 'login.html');
  assert.equal(s.calls.some(c => c[0] === 'sync'), false);
  s.element('signup-code').value = '123456'; await s.submit();
  const args = s.calls.find(c => c[0] === 'verify')[1];
  assert.equal(args.email, 'user@example.test'); assert.equal(args.token, '123456'); assert.equal(args.type, 'email');
  assert.equal(s.window.location.href, 'index.html');
});
test('invalid code keeps verification open and does not sign in', async () => {
  const s = setup(); s.toggle(); await s.submit(); s.failVerification(); await s.submit();
  assert.equal(s.window.location.href, 'login.html');
  assert.match(s.element('message-box').textContent, /Invalid or expired/);
  assert.equal(s.element('btn-submit').disabled, false);
});
test('automatic email confirmation blocks signup before account creation', async () => {
  const s = setup(true); s.toggle(); await s.submit();
  assert.equal(s.calls.length, 0);
  assert.match(s.element('message-box').textContent, /not ready/);
});
test('resend uses signup confirmation and enforces cooldown', async () => {
  const s = setup(); s.toggle(); await s.submit();
  await s.element('resend-code').listeners.click();
  assert.equal(s.calls.filter(c => c[0] === 'resend').length, 0);
  vm.runInContext('resendAt = 0', s.context);
  await s.element('resend-code').listeners.click();
  assert.equal(s.calls.find(c => c[0] === 'resend')[1].type, 'signup');
  assert.equal(s.element('resend-code').disabled, true);
});
test('switching back to login clears pending verification', async () => {
  const s = setup(); s.toggle(); await s.submit(); s.toggle();
  assert.equal(s.element('signup-verification').hidden, true);
  assert.equal(s.element('email').readOnly, false);
  assert.equal(s.element('password').disabled, false);
  await s.submit(); assert.equal(s.calls.at(-2)[0], 'login');
});
