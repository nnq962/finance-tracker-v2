/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness; never sends real notifications. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(filename, mocks, globals = {}) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(path.join(process.cwd(), filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(source, {
    exports, console: { error() {} }, process: { env: {} }, ...globals,
    require(id) {
      assert.ok(id in mocks, `Unexpected dependency: ${id}`)
      return mocks[id]
    },
  }, { filename })
  return exports
}

async function main() {
  const sent = []
  const delays = []
  let sessionValid = true
  let sendError = null
  const { sendPushTestAction } = load('app/(main)/settings/actions.ts', {
    '@/lib/auth/session': { async requireSession() {
      if (!sessionValid) throw new Error('Unauthorized')
      return { uid: 'test-user' }
    } },
    '@/lib/firebase/admin': { getFirebaseAdminMessaging() {
      return { async send(message) {
        if (sendError) throw sendError
        sent.push(message)
        return 'test-message-id'
      } }
    } },
  }, { setTimeout(callback, ms) { delays.push(ms); callback() } })

  const fid = 'c' + 'a'.repeat(21)
  sessionValid = false
  await assert.rejects(sendPushTestAction(fid), /Unauthorized/)
  sessionValid = true
  for (const invalid of [null, {}, '', '../another-user', 'a'.repeat(100)]) {
    assert.equal((await sendPushTestAction(invalid)).success, false)
  }
  assert.equal((await sendPushTestAction(fid, 'true')).success, false)
  assert.equal(sent.length, 0)
  assert.equal((await sendPushTestAction(fid)).messageId, 'test-message-id')
  assert.equal(sent[0].token, fid)
  assert.equal(sent[0].data.type, 'push-test')
  assert.equal(sent[0].webpush.headers.TTL, '60')
  assert.ok(sent[0].notification.title)
  await sendPushTestAction(fid, true)
  assert.deepEqual(delays, [8000])
  sendError = { code: 'messaging/registration-token-not-registered' }
  assert.match((await sendPushTestAction(fid)).error, /không còn hợp lệ/)
  sendError = { code: 'messaging/mismatched-credential' }
  assert.match((await sendPushTestAction(fid)).error, /khác project/)

  const events = []
  let registeredCallback
  let permission = 'granted'
  const messaging = {}
  const worker = { active: {} }
  const client = load('lib/firebase/messaging.ts', {
    '@/lib/firebase/client': { firebaseApp: {} },
    'firebase/messaging': {
      async isSupported() { events.push('support'); return true },
      getMessaging() { return messaging },
      onRegistered(_, callback) {
        registeredCallback = callback
        return () => { events.push('unsubscribe') }
      },
      async register(instance, options) {
        assert.equal(instance, messaging)
        assert.equal(options.vapidKey, 'test-public-key')
        assert.equal(options.serviceWorkerRegistration, worker)
        registeredCallback(fid)
      },
    },
  }, {
    process: { env: { NEXT_PUBLIC_FIREBASE_VAPID_KEY: 'test-public-key' } },
    window: {
      Notification: {}, isSecureContext: true,
      setTimeout() { return 1 }, clearTimeout() {},
    },
    Notification: { async requestPermission() { events.push('permission'); return permission } },
    navigator: { serviceWorker: { async register(url) {
      assert.equal(url, '/firebase-messaging-sw.js')
      return worker
    } } },
  })
  assert.equal(await client.registerPushTestDevice(), fid)
  assert.deepEqual(events, ['permission', 'support', 'unsubscribe'])
  permission = 'denied'
  await assert.rejects(client.registerPushTestDevice(), /đã bị chặn/)

  const { GET } = load('app/firebase-messaging-sw.js/route.ts', {}, { Response })
  const response = GET()
  assert.equal(response.headers.get('content-type'), 'application/javascript; charset=utf-8')
  const script = await response.text()
  new vm.Script(script)
  let clickHandler
  const opened = []
  vm.runInNewContext(script, {
    URL,
    self: {
      location: { origin: 'https://test.example' },
      addEventListener(event, handler) { assert.equal(event, 'notificationclick'); clickHandler = handler },
      clients: {
        async matchAll() { return [] },
        async openWindow(url) { opened.push(url) },
      },
    },
    importScripts() {},
    firebase: { initializeApp() {}, messaging() {} },
  })
  let clickWork
  clickHandler({
    notification: { data: { FCM_MSG: {} }, close() {} },
    stopImmediatePropagation() {}, waitUntil(promise) { clickWork = promise },
  })
  await clickWork
  assert.deepEqual(opened, ['https://test.example/transactions'])
  assert.ok(!script.includes('showNotification('), 'FCM must not display duplicate notifications')
  console.log('Push checks passed: session, input, sending, delay, errors, permission, FID registration, worker and click link. No live messages sent.')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
