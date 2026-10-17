/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness with a fake Firebase. */
/*
 * Checks how lib/auth/session.ts remembers a session found not revoked: one
 * check with Google per minute, shared while under way, never remembering a
 * revoked session, forgotten on sign-out, and the shell's signature-only
 * check never waiting for Google.
 *
 * Run: node scripts/test-session-revocation-cache.cjs
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

async function main() {
  let now = 1_000_000
  let cookie = 'cookie-a'
  let revoked = new Set()
  let googleChecks = 0
  let releaseCheck = null
  const exp = 2_000_000

  const auth = {
    async verifySessionCookie(value, checkRevoked) {
      if (!value.startsWith('cookie-')) throw new Error('bad signature')
      if (checkRevoked) {
        googleChecks++
        if (releaseCheck) await new Promise((resolve) => { releaseCheck = resolve })
        if (revoked.has(value)) throw new Error('revoked')
      }
      return { uid: `uid-${value}`, email: 'a@b.c', email_verified: true, exp }
    },
  }

  class Redirect extends Error {}
  const mocks = {
    'node:crypto': require('node:crypto'),
    react: { cache: (fn) => fn },
    'next/headers': {
      async cookies() { return { get: (name) => (name === '__session' && cookie ? { value: cookie } : undefined) } },
      async headers() { return { get: () => 'localhost' } },
    },
    'next/navigation': { redirect(url) { throw new Redirect(url) } },
    '@/lib/auth/constants': { SESSION_COOKIE_NAME: '__session' },
    '@/lib/auth/dev-session': { DEV_SESSION_VALUE: 'dev-session', DEV_TUNNEL_KEY_COOKIE: 'k', DEV_USER: {}, isDevLoginEnabled: () => false },
    '@/lib/firebase/admin': { getFirebaseAdminAuth: () => auth },
    '@/lib/slow-log': { logIfSlow: (what) => logged.push(what) },
  }
  const logged = []
  const filename = 'lib/auth/session.ts'
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(process.cwd(), filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, Map, Promise, Number, performance,
    Date: { now: () => now },
    require(id) {
      assert.ok(id in mocks, `Unexpected dependency: ${id}`)
      return mocks[id]
    },
  }, { filename })
  const { getSessionUser, requireSignedSession, forgetSessionCheck } = exports

  // First request asks Google; the next ones within a minute do not.
  assert.equal((await getSessionUser()).uid, 'uid-cookie-a')
  assert.equal(googleChecks, 1)
  now += 59_000
  assert.equal((await getSessionUser()).uid, 'uid-cookie-a')
  assert.equal(googleChecks, 1, 'Remembered for a minute')
  assert.deepEqual(logged, ['revocation check'], 'Only the check with Google is timed for the slow log')

  // After a minute Google is asked again.
  now += 2_000
  await getSessionUser()
  assert.equal(googleChecks, 2)

  // A revoked session is never remembered: every request asks again and fails.
  cookie = 'cookie-b'
  revoked.add('cookie-b')
  assert.equal(await getSessionUser(), null)
  assert.equal(await getSessionUser(), null)
  assert.equal(googleChecks, 4, 'Revoked sessions are checked every time')

  // Revoked within the minute: still accepted until the minute is up (the accepted trade-off).
  cookie = 'cookie-c'
  await getSessionUser()
  revoked.add('cookie-c')
  now += 30_000
  assert.equal((await getSessionUser()).uid, 'uid-cookie-c')
  now += 31_000
  assert.equal(await getSessionUser(), null, 'Refused once the minute is up')

  // Signing out forgets the cookie: if it comes back, Google is asked.
  cookie = 'cookie-d'
  await getSessionUser()
  const before = googleChecks
  forgetSessionCheck('cookie-d')
  await getSessionUser()
  assert.equal(googleChecks, before + 1, 'Forgotten on sign-out')

  // Requests arriving together share one check.
  cookie = 'cookie-e'
  releaseCheck = () => {}
  const together = Promise.all([getSessionUser(), getSessionUser(), getSessionUser()])
  await new Promise((resolve) => setImmediate(resolve))
  const checksWhileWaiting = googleChecks
  releaseCheck()
  releaseCheck = null
  const users = await together
  assert.ok(users.every((user) => user.uid === 'uid-cookie-e'))
  assert.equal(checksWhileWaiting, before + 2, 'One check for three requests')

  // The shell's check needs only the signature and never waits for Google.
  cookie = 'cookie-f'
  releaseCheck = () => {}
  const shell = await requireSignedSession()
  assert.equal(shell.user.uid, 'uid-cookie-f')
  assert.equal(shell.expiresAt, exp * 1000)
  releaseCheck()
  releaseCheck = null

  // No cookie or a bad signature: off to login.
  cookie = 'forged'
  await assert.rejects(requireSignedSession(), Redirect)
  cookie = null
  await assert.rejects(requireSignedSession(), Redirect)

  console.log('Session revocation cache checks passed: one check a minute, revoked never remembered, revoked within the minute refused after it, sign-out forgets, shared checks, signature-only shell.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
