/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness with a simulated browser. */
/*
 * Checks how AuthSessionGuard covers pages restored from memory (hidden tab or
 * PWA, back/forward cache) and re-checks the session before showing them.
 *
 * Run: node scripts/test-session-guard.cjs
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function createTarget() {
  const listeners = new Map()
  return {
    addEventListener(type, listener) { listeners.set(type, [...(listeners.get(type) ?? []), listener]) },
    removeEventListener(type, listener) { listeners.set(type, (listeners.get(type) ?? []).filter((item) => item !== listener)) },
    dispatch(type, event = {}) { for (const listener of listeners.get(type) ?? []) listener(event) },
    count(type) { return (listeners.get(type) ?? []).length },
  }
}

async function flush() { for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve)) }

async function main() {
  let now = 0
  let fetches = []
  let nextResponse = () => ({ status: 200, ok: true, json: async () => ({ uid: 'me' }) })
  const navigations = []
  const document = Object.assign(createTarget(), {
    visibilityState: 'visible',
    documentElement: { dataset: {} },
  })
  const window = Object.assign(createTarget(), {
    location: {
      pathname: '/overview', search: '?month=2026-10',
      replace(url) { navigations.push(['replace', url]) },
      reload() { navigations.push(['reload']) },
    },
  })
  const cleanups = []
  const mocks = {
    react: { useEffect(effect) { cleanups.push(effect()) } },
    'react/jsx-runtime': { jsx(type, props) { return { type, props } }, jsxs(type, props) { return { type, props } }, Fragment: 'Fragment' },
    sonner: { toast: { error() {} } },
    '@/lib/firebase/messaging': { pushErrorMessage(error) { return error.message } },
    'firebase/auth': { onIdTokenChanged() { return () => {} } },
    'next/navigation': { useRouter() { return { refresh() {} } } },
    '@/app/loading': { default: 'RootLoading' },
    '@/lib/firebase/auth': { async clearServerSession() {}, async syncServerSession() {} },
    '@/lib/firebase/client': { firebaseAuth: { currentUser: { uid: 'me' } } },
    '@/lib/firebase/push-device': { stopPushDeviceSync() {}, async syncAccountPushDevice() {} },
    '@/lib/stale-deploy': { isStaleDeployError() { return false }, showStaleDeployToast() {} },
  }
  const filename = 'components/auth-session-guard.tsx'
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(process.cwd(), filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, {
    exports, document, window,
    Date: { now: () => now },
    async fetch(url, init) {
      fetches.push([url, init])
      const response = nextResponse()
      if (response instanceof Error) throw response
      return response
    },
    require(id) {
      assert.ok(id in mocks, `Unexpected dependency: ${id}`)
      return mocks[id]
    },
  }, { filename })

  exports.AuthSessionGuard({ children: 'app', initialUid: 'me' })
  const covered = () => document.documentElement.dataset.sessionCheck === 'pending'
  const hide = () => { document.visibilityState = 'hidden'; document.dispatch('visibilitychange') }
  const show = () => { document.visibilityState = 'visible'; document.dispatch('visibilitychange') }
  assert.equal(covered(), false, 'A freshly rendered page is shown')

  // Hiding covers the page at once, so app-switcher snapshots show no data.
  hide()
  assert.equal(covered(), true)
  // Back quickly: shown again without asking the server.
  now += 59_000
  show()
  assert.equal(covered(), false)
  assert.equal(fetches.length, 0)

  // Back after a while with a valid session: covered until confirmed.
  hide()
  now += 60_000
  show()
  assert.equal(covered(), true, 'Stays covered while the session is checked')
  assert.equal(fetches.length, 1)
  assert.equal(fetches[0][0], '/api/auth/session')
  assert.equal(fetches[0][1].cache, 'no-store')
  await flush()
  assert.equal(covered(), false)
  assert.deepEqual(navigations, [])

  // Session over: straight to login, never uncovered.
  nextResponse = () => ({ status: 401, ok: false, json: async () => ({}) })
  hide()
  now += 5 * 60_000
  show()
  await flush()
  assert.equal(covered(), true)
  assert.deepEqual(navigations.pop(), ['replace', '/login?next=%2Foverview%3Fmonth%3D2026-10'])

  // Restored from the back/forward cache: covered when stored, checked on show.
  nextResponse = () => ({ status: 200, ok: true, json: async () => ({ uid: 'me' }) })
  document.documentElement.dataset = {}
  window.dispatch('pagehide', { persisted: false })
  assert.equal(covered(), false, 'A normal unload is left alone')
  window.dispatch('pagehide', { persisted: true })
  assert.equal(covered(), true)
  window.dispatch('pageshow', { persisted: true })
  await flush()
  assert.equal(covered(), false)
  window.dispatch('pageshow', { persisted: false })
  assert.equal(fetches.length, 3, 'A normal load was already checked by the server')

  // Another account signed in meanwhile: reload into it.
  nextResponse = () => ({ status: 200, ok: true, json: async () => ({ uid: 'someone-else' }) })
  window.dispatch('pageshow', { persisted: true })
  await flush()
  assert.deepEqual(navigations.pop(), ['reload'])

  // Offline: the session cannot be checked, so the page stays usable.
  nextResponse = () => new Error('offline')
  window.dispatch('pageshow', { persisted: true })
  await flush()
  assert.equal(covered(), false)

  // Only the latest check decides: an older, slower answer is ignored.
  let resolveFirst
  nextResponse = () => new Promise((resolve) => { resolveFirst = resolve })
  window.dispatch('pageshow', { persisted: true })
  nextResponse = () => ({ status: 200, ok: true, json: async () => ({ uid: 'me' }) })
  window.dispatch('pageshow', { persisted: true })
  await flush()
  assert.equal(covered(), false)
  resolveFirst({ status: 401, ok: false, json: async () => ({}) })
  await flush()
  assert.deepEqual(navigations, [], 'A stale 401 must not log the user out')

  // Unmounting removes every listener and the cover.
  document.documentElement.dataset.sessionCheck = 'pending'
  cleanups.forEach((cleanup) => cleanup?.())
  assert.equal(covered(), false)
  for (const [target, type] of [[document, 'visibilitychange'], [window, 'pagehide'], [window, 'pageshow'], [window, 'focus']]) {
    assert.equal(target.count(type), 0, `${type} listener removed`)
  }

  console.log('Session guard checks passed: quick return, re-check after 1 minute, expired session, back/forward cache, account switch, offline, stale answers and cleanup.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
