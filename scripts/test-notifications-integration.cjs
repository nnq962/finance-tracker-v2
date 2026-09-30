/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Firestore integration harness. */
/* Run: NOTIFICATION_TEST_LIVE=1 node scripts/test-notifications-integration.cjs
 * Creates only synthetic users/browser identities; never sends FCM messages.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { randomUUID, createHash } = require('node:crypto')
if (process.env.NOTIFICATION_TEST_LIVE !== '1') throw new Error('Set NOTIFICATION_TEST_LIVE=1 to run this isolated test.')
require('@next/env').loadEnvConfig(process.cwd())
const originalLoad = Module._load
Module._load = function(id, parent, main) {
  if (id === 'server-only') return {}
  if (id.startsWith('@/')) id = path.join(process.cwd(), id.slice(2))
  return originalLoad.call(this, id, parent, main)
}
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename)
const repository = require('../lib/notifications/repository.ts')
const { getFirebaseAdminFirestore } = require('../lib/firebase/admin.ts')
const db = getFirebaseAdminFirestore()
const namespace = 'codex_notification_test_' + randomUUID()
const users = [namespace + '_a', namespace + '_b']
const browserIds = new Set()
const fids = Array.from({ length: 4 }, () => 'c' + randomUUID().replaceAll('-', '').slice(0, 21))
const idFor = (fid) => createHash('sha256').update(fid).digest('hex')
async function open(uid, browserId, sessionId) {
  const context = await repository.openPushSession(uid, browserId, sessionId)
  browserIds.add(context.browserId)
  return context
}

async function main() {
  try {
    const [a, b] = users
    assert.equal((await repository.getNotificationSettings(a)).notificationsEnabled, false)
    const settings = { notificationsEnabled: true, dailyReminderTime: '21:45', timeZone: 'Asia/Tokyo' }
    await repository.saveNotificationSettings(a, settings)
    assert.deepEqual(await repository.getNotificationSettings(a), settings)
    assert.equal((await repository.getNotificationSettings(b)).dailyReminderTime, '20:00')
    for (const bad of [null, { ...settings, dailyReminderTime: '24:00' }, { ...settings, timeZone: 'Invalid/Zone' }, { ...settings, notificationsEnabled: 'true' }]) {
      await assert.rejects(repository.saveNotificationSettings(a, bad))
    }
    assert.deepEqual(await repository.getNotificationSettings(a), settings)

    const phone = await open(a)
    const laptop = await open(a)
    assert.deepEqual(await open(a, phone.browserId, phone.sessionId), phone)
    await repository.registerPushDevice(a, phone, fids[0], 'iPhone · PWA')
    await repository.registerPushDevice(a, laptop, fids[1], 'macOS · Chrome')
    assert.equal((await repository.getNotificationState(a, phone)).devices.length, 2)
    assert.equal(await repository.getCurrentPushFid(a, phone), fids[0])
    await assert.rejects(repository.getCurrentPushFid(b, phone))
    await assert.rejects(repository.registerPushDevice(b, phone, fids[2], 'Other account'))
    await assert.rejects(repository.registerPushDevice(a, phone, '../invalid', 'Bad'))

    await Promise.all(Array.from({ length: 3 }, () => repository.registerPushDevice(a, laptop, fids[1], 'macOS · Chrome')))
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 2)
    await repository.registerPushDevice(a, phone, fids[2], 'iPhone · PWA')
    assert.equal((await db.collection('pushInstallations').doc(idFor(fids[0])).get()).exists, false)
    assert.equal((await repository.getNotificationState(a, phone)).devices.length, 2)

    const switched = await open(b, phone.browserId, phone.sessionId)
    assert.notEqual(switched.sessionId, phone.sessionId)
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 1)
    await assert.rejects(repository.registerPushDevice(a, phone, fids[2], 'Late callback'))
    await repository.registerPushDevice(b, switched, fids[2], 'iPhone · PWA')
    await repository.closePushSession(phone.browserId, phone.sessionId)
    assert.equal(await repository.getCurrentPushFid(b, switched), fids[2])

    // FID ownership is exclusive even if browser cookies are lost/recreated.
    const freshBrowser = await open(a)
    await repository.registerPushDevice(a, freshBrowser, fids[2], 'Recreated browser')
    assert.equal((await repository.getNotificationState(b, switched)).devices.length, 0)
    await assert.rejects(repository.getCurrentPushFid(b, switched))

    await repository.closePushSession(freshBrowser.browserId, freshBrowser.sessionId)
    await assert.rejects(repository.registerPushDevice(a, freshBrowser, fids[3], 'Late logout callback'))
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 1)
    const relogin = await open(a, freshBrowser.browserId, freshBrowser.sessionId)
    await assert.rejects(repository.registerPushDevice(a, freshBrowser, fids[3], 'Old same-user session'))
    await repository.registerPushDevice(a, relogin, fids[3], 'New session')
    await repository.detachPushDevice(a, relogin)
    await assert.rejects(repository.getCurrentPushFid(a, relogin))

    await repository.saveNotificationSettings(a, { ...settings, notificationsEnabled: false })
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 1)
    assert.equal((await repository.getNotificationSettings(a)).notificationsEnabled, false)
    console.log('Notification integration checks passed: settings persistence, validation, multiple devices, retries, FID refresh, ownership transfer, logout, stale-session rejection and account isolation. No push messages sent.')
  } finally {
    for (const uid of users) await db.recursiveDelete(db.collection('users').doc(uid))
    const batch = db.batch()
    for (const id of browserIds) batch.delete(db.collection('notificationBrowsers').doc(id))
    for (const fid of fids) batch.delete(db.collection('pushInstallations').doc(idFor(fid)))
    await batch.commit()
    console.log('Isolated notification test records removed.')
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
