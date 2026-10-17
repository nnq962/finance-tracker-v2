/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness with a fake Firebase and window. */
/*
 * Checks how lib/firebase/google-popup.ts gives up on Google's window: only
 * once the app is back in front, Google's window is gone and 3 s passed with
 * no result; never while the window is still open or once a result came.
 *
 * Run: node scripts/test-google-popup.cjs
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
    dispatch(type) { for (const listener of listeners.get(type) ?? []) listener({}) },
    count(type) { return (listeners.get(type) ?? []).length },
  }
}

async function main() {
  let timers = []
  let now = 0
  const advance = async (ms) => {
    now += ms
    for (const timer of [...timers].sort((a, b) => a.at - b.at)) {
      if (timer.at <= now && timers.includes(timer)) {
        timers = timers.filter((item) => item !== timer)
        timer.fn()
      }
    }
    await new Promise((resolve) => setImmediate(resolve))
  }
  const document = Object.assign(createTarget(), { visibilityState: 'visible' })
  const popupWindow = { closed: false }
  const nativeOpen = () => popupWindow
  const window = Object.assign(createTarget(), {
    open: nativeOpen,
    setTimeout(fn, ms) { const timer = { fn, at: now + ms }; timers.push(timer); return timer },
    clearTimeout(timer) { timers = timers.filter((item) => item !== timer) },
  })

  let settle
  const mocks = {
    'firebase/auth': {
      browserPopupRedirectResolver: function Resolver() {},
      GoogleAuthProvider: class { setCustomParameters() {} },
      signInWithPopup() {
        window.open('https://accounts.google.com')
        return new Promise((resolve, reject) => { settle = { resolve, reject } })
      },
    },
    '@/lib/firebase/client': { firebaseAuth: {} },
  }
  const filename = 'lib/firebase/google-popup.ts'
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(process.cwd(), filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, window, document, Promise,
    require(id) {
      assert.ok(id in mocks, `Unexpected dependency: ${id}`)
      return mocks[id]
    },
  }, { filename })
  const { signInWithGoogle } = exports
  const leave = () => { document.visibilityState = 'hidden'; document.dispatch('visibilitychange') }
  const comeBack = () => { document.visibilityState = 'visible'; document.dispatch('visibilitychange'); window.dispatch('focus') }

  // Closed without picking an account: given up 3 s after the app is back.
  let gaveUp = 0
  let run = signInWithGoogle({ onGaveUp: () => gaveUp++ }).catch(() => 'rejected')
  assert.equal(window.open, nativeOpen, 'window.open is given back once Google\'s window is open')
  leave()
  await advance(5000)
  assert.equal(gaveUp, 0, 'Not while the user is in Google\'s window')
  popupWindow.closed = true
  comeBack()
  await advance(2900)
  assert.equal(gaveUp, 0)
  await advance(200)
  assert.equal(gaveUp, 1, 'Given up 3 s after coming back')
  settle.reject(new Error('auth/popup-closed-by-user'))
  assert.equal(await run, 'rejected')
  for (const [target, type] of [[document, 'visibilitychange'], [window, 'focus'], [window, 'blur']]) {
    assert.equal(target.count(type), 0, `${type} listener removed`)
  }

  // Signed in: the result comes within the 3 s, nothing is given up.
  popupWindow.closed = false
  gaveUp = 0
  run = signInWithGoogle({ onGaveUp: () => gaveUp++ })
  leave()
  popupWindow.closed = true
  comeBack()
  await advance(1500)
  settle.resolve({ user: { uid: 'me' } })
  assert.deepEqual(await run, { user: { uid: 'me' } })
  await advance(5000)
  assert.equal(gaveUp, 0, 'A result in time is never given up')

  // Back in the app beside a window still open (a desktop): not given up.
  popupWindow.closed = false
  gaveUp = 0
  run = signInWithGoogle({ onGaveUp: () => gaveUp++ }).catch(() => 'rejected')
  window.dispatch('blur')
  window.dispatch('focus')
  await advance(4000)
  assert.equal(gaveUp, 0, 'Google\'s window still open')
  settle.reject(new Error('later'))
  await run

  // Never left the app (the window did not take over): Firebase decides alone.
  popupWindow.closed = true
  gaveUp = 0
  run = signInWithGoogle({ onGaveUp: () => gaveUp++ }).catch(() => 'rejected')
  window.dispatch('focus')
  await advance(4000)
  assert.equal(gaveUp, 0, 'Only after leaving the app')
  settle.reject(new Error('later'))
  await run

  console.log('Google popup checks passed: gives up 3 s after coming back, not while in Google\'s window, not after a result, not beside an open window, not without leaving, listeners removed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
