/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness; never sends real notifications. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(filename, mocks, globals = {}) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(path.join(process.cwd(), filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
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
  let detached = 0
  let owned = true
  class NotificationValidationError extends Error {}
  const { sendPushTestAction } = load('app/(main)/settings/actions.ts', {
    '@/lib/auth/session': { async requireSession() {
      if (!sessionValid) throw new Error('Unauthorized')
      return { uid: 'test-user' }
    } },
    '@/lib/notifications/context': { async getPushContext() { return { browserId: 'browser', sessionId: 'session' } } },
    '@/lib/notifications/validation': { NotificationValidationError },
    '@/lib/notifications/repository': {
      async getCurrentPushFid(uid) {
        assert.equal(uid, 'test-user')
        if (!owned) throw new NotificationValidationError('Thiết bị đã đăng xuất.')
        return fid
      },
      async detachPushDevice() { detached++ },
    },
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
  await assert.rejects(sendPushTestAction(), /Unauthorized/)
  sessionValid = true
  for (const invalid of [null, {}, '', '../another-user', 'a'.repeat(100)]) {
    assert.equal((await sendPushTestAction(invalid)).success, false)
  }
  assert.equal((await sendPushTestAction('true')).success, false)
  assert.equal(sent.length, 0)
  assert.equal((await sendPushTestAction()).messageId, 'test-message-id')
  assert.equal(sent[0].token, fid)
  assert.equal(sent[0].data.type, 'push-test')
  assert.equal(sent[0].webpush.headers.TTL, '60')
  assert.ok(sent[0].notification.title)
  await sendPushTestAction(true)
  assert.deepEqual(delays, [8000])
  sendError = { code: 'messaging/registration-token-not-registered' }
  assert.match((await sendPushTestAction()).error, /không còn hợp lệ/)
  assert.equal(detached, 1)
  owned = false
  assert.match((await sendPushTestAction(true)).error, /đăng xuất/)
  owned = true
  sendError = { code: 'messaging/mismatched-credential' }
  assert.match((await sendPushTestAction()).error, /khác project/)

  // Cookie writes must complete in order; stale callbacks cannot clear a new account.
  const authState = { currentUser: { uid: 'a' } }
  const requests = []
  let releasePost
  let stopped = 0
  let unregistered = 0
  const authClient = load('lib/firebase/auth.ts', {
    'firebase/app': { FirebaseError: class extends Error {} },
    'firebase/auth': { GoogleAuthProvider: class {}, async signOut() {}, signInWithPopup() {} },
    '@/lib/firebase/client': { firebaseAuth: authState },
    '@/lib/firebase/push-device': {
      stopPushDeviceSync() { stopped++ },
      async unregisterLocalPushDevice() { unregistered++ },
    },
  }, { async fetch(_, options) {
    requests.push(options.method)
    if (options.method === 'POST') await new Promise(resolve => { releasePost = resolve })
    return { ok: true }
  } })
  const login = authClient.syncServerSession({ uid: 'a', async getIdToken() { return 'id' } })
  for (let i = 0; i < 5; i++) await Promise.resolve()
  assert.deepEqual(requests, ['POST'])
  const logout = authClient.clearServerSession('a')
  for (let i = 0; i < 5; i++) await Promise.resolve()
  assert.deepEqual(requests, ['POST'])
  releasePost()
  await Promise.all([login, logout])
  assert.deepEqual(requests, ['POST', 'DELETE'])
  assert.equal(stopped, 1)
  assert.equal(unregistered, 1)
  authState.currentUser = { uid: 'b' }
  await authClient.clearServerSession('a')
  await authClient.clearServerSession(null)
  await authClient.syncServerSession({ uid: 'a', async getIdToken() { throw new Error('stale') } })
  assert.deepEqual(requests, ['POST', 'DELETE'])

  const events = []
  let registeredCallback
  let permission = 'default'
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
    Notification: { get permission() { return permission }, async requestPermission() { events.push('permission'); permission = 'granted'; return permission } },
    navigator: { serviceWorker: { async register(url) {
      assert.equal(url, '/firebase-messaging-sw.js')
      return worker
    } } },
  })
  assert.equal(await client.registerPushTestDevice(), fid)
  assert.deepEqual(events, ['permission', 'support', 'unsubscribe'])
  const permissionPrompts = events.filter(event => event === 'permission').length
  await client.registerPushTestDevice()
  assert.equal(events.filter(event => event === 'permission').length, permissionPrompts)
  permission = 'denied'
  await assert.rejects(client.registerPushTestDevice(), /đã bị chặn/)
  assert.equal(events.filter(event => event === 'permission').length, permissionPrompts)

  // Exercise the actual switch handler with permission denied and a pending grant.
  let hookIndex = 0
  const hooks = []
  let resolveRegistration
  let uiPermission = 'denied'
  let saveCalls = 0
  let saveFailure = false
  const uiToasts = []
  const ui = load('app/(main)/settings/_components/notification-preferences.tsx', {
    react: {
      useState(initial) {
        const index = hookIndex++
        if (!(index in hooks)) hooks[index] = initial
        return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
      },
      useRef(initial) {
        const index = hookIndex++
        if (!(index in hooks)) hooks[index] = { current: initial }
        return hooks[index]
      },
      useSyncExternalStore(_, snapshot) { return snapshot() },
    },
    'react/jsx-runtime': { jsx(type, props) { return { type, props } }, jsxs(type, props) { return { type, props } } },
    '@/components/user-menu/notification-dialog-content': { NotificationDialogContent: 'Preferences' },
    sonner: { toast: { loading(message) { uiToasts.push(['loading', message]); return 'toast' }, success(message) { uiToasts.push(['success', message]) }, error(message) { uiToasts.push(['error', message]) } } },
    '@/components/ui/separator': { Separator: 'Separator' },
    '@/components/ui/badge': { Badge: 'Badge' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/field': { FieldDescription: 'Description', FieldError: 'Error' },
    '@/lib/notifications/actions': { async saveNotificationSettingsAction(settings) { saveCalls++; return saveFailure ? { success: false, error: "Save failed" } : { success: true, data: settings } } },
    '@/lib/firebase/push-device': {
      PUSH_DEVICE_CHANGED: 'changed', notifyPushDeviceChanged() {},
      async registerAccountPushDevice() {
        if (uiPermission === 'denied') throw new Error('Thông báo đã bị chặn')
        await new Promise(resolve => { resolveRegistration = resolve })
      },
    },
    '@/lib/firebase/messaging': { pushTestError(error) { return error.message } },
  }, {
    window: { Notification: {} },
    Notification: { get permission() { return uiPermission } },
  })
  function renderPreferences() {
    hookIndex = 0
    const content = ui.NotificationPreferences({ uid: 'a', initialSettings: {
      notificationsEnabled: false, dailyReminderTime: '20:00', timeZone: 'Asia/Ho_Chi_Minh',
    } }).props.children
    return Array.isArray(content) ? content : [content]
  }
  async function flush() { for (let i = 0; i < 10; i++) await Promise.resolve() }
  renderPreferences()[0].props.onNotificationsEnabledChange(true)
  await flush()
  assert.equal(renderPreferences()[0].props.notificationsEnabled, false)
  assert.equal(saveCalls, 0)
  assert.deepEqual(uiToasts.find(([kind]) => kind === 'error'), ['error', 'Thông báo đã bị chặn'])
  uiPermission = 'default'
  renderPreferences()[0].props.onNotificationsEnabledChange(true)
  await flush()
  assert.equal(renderPreferences()[0].props.notificationsEnabled, false)
  assert.equal(renderPreferences()[0].props.disabled, true)
  uiPermission = 'granted'
  resolveRegistration()
  await flush()
  assert.equal(renderPreferences()[0].props.notificationsEnabled, true)
  assert.equal(saveCalls, 1, 'Granted registration must save automatically')
  assert.deepEqual(uiToasts.at(-1), ['success', 'Đã bật thông báo.'])
  saveFailure = true
  renderPreferences()[0].props.onNotificationsEnabledChange(false)
  await flush()
  assert.equal(renderPreferences()[0].props.notificationsEnabled, true, 'Failed save must restore the enabled preference')
  saveFailure = false
  renderPreferences()[0].props.onReminderTimeCommit('21:30')
  await flush()
  assert.equal(renderPreferences()[0].props.settings.dailyReminderTime, '21:30')
  assert.equal(renderPreferences()[0].props.settings.timeZone, 'Asia/Ho_Chi_Minh')
  saveFailure = true
  renderPreferences()[0].props.onReminderTimeCommit('22:00')
  await flush()
  assert.equal(renderPreferences()[0].props.settings.dailyReminderTime, '21:30', 'Failed time save must roll back')
  saveFailure = false
  renderPreferences()[0].props.onNotificationsEnabledChange(false)
  await flush()
  assert.equal(renderPreferences()[0].props.notificationsEnabled, false)


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
