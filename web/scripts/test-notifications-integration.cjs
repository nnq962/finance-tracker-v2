/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-notifications-integration.cjs
 * Runs against the finance_test database with isolated users; never sends FCM messages.
 */
const assert = require('node:assert/strict')
const { randomUUID, createHash } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const repository = require('../lib/notifications/repository.ts')
const { getNextReminderAt } = require('../lib/notifications/schedule.ts')
const users = []
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
    users.push(await createUser('notification_test'), await createUser('notification_test'))
    const [a, b] = users
    const stored = async () => (await sql('SELECT next_reminder_at, updated_at FROM notification_settings WHERE user_id = $1', [a])).rows[0]
    const setNextReminder = (value) => sql('UPDATE notification_settings SET next_reminder_at = $2 WHERE user_id = $1', [a, value])
    assert.equal((await repository.getNotificationSettings(a)).notificationsEnabled, false)
    const settings = { notificationsEnabled: true, dailyReminderTime: '21:45', timeZone: 'Asia/Ho_Chi_Minh' }
    // The client cannot choose the time zone or the next reminder.
    await repository.saveNotificationSettings(a, { ...settings, timeZone: 'Asia/Tokyo', nextReminderAt: new Date(0) })
    assert.deepEqual(await repository.getNotificationSettings(a), settings)
    let row = await stored()
    assert.equal(row.next_reminder_at.getTime(), getNextReminderAt(settings.dailyReminderTime, row.updated_at).getTime())
    // Re-saving identical preferences must not discard an overdue reminder.
    const overdue = new Date(1)
    await setNextReminder(overdue)
    await repository.saveNotificationSettings(a, settings)
    assert.equal((await stored()).next_reminder_at.getTime(), overdue.getTime())
    await repository.saveNotificationSettings(a, { ...settings, dailyReminderTime: '00:10' })
    row = await stored()
    assert.equal(row.next_reminder_at.getTime(), getNextReminderAt('00:10', row.updated_at).getTime())
    await setNextReminder(null)
    await repository.saveNotificationSettings(a, settings)
    assert.ok((await stored()).next_reminder_at instanceof Date)
    assert.equal((await repository.getNotificationSettings(b)).dailyReminderTime, '20:00')
    for (const bad of [null, { ...settings, dailyReminderTime: '24:00' }, { ...settings, timeZone: 'Invalid/Zone' }, { ...settings, notificationsEnabled: 'true' }]) {
      await assert.rejects(repository.saveNotificationSettings(a, bad))
    }
    assert.deepEqual(await repository.getNotificationSettings(a), settings)

    const phone = await open(a)
    const laptop = await open(a)
    assert.deepEqual(await open(a, phone.browserId, phone.sessionId), phone)
    assert.equal((await repository.registerPushDevice(a, phone, fids[0], 'iPhone · PWA')).isNew, true)
    await repository.registerPushDevice(a, laptop, fids[1], 'macOS · Chrome')
    // Registering a linked device again is not new: it is greeted only once.
    assert.equal((await repository.registerPushDevice(a, phone, fids[0], 'iPhone · PWA')).isNew, false)
    assert.equal((await repository.getNotificationState(a, phone)).devices.length, 2)
    assert.equal(await repository.getCurrentPushFid(a, phone), fids[0])
    await assert.rejects(repository.getCurrentPushFid(b, phone))
    await assert.rejects(repository.registerPushDevice(b, phone, fids[2], 'Other account'))
    await assert.rejects(repository.registerPushDevice(a, phone, '../invalid', 'Bad'))

    await Promise.all(Array.from({ length: 3 }, () => repository.registerPushDevice(a, laptop, fids[1], 'macOS · Chrome')))
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 2)
    await repository.registerPushDevice(a, phone, fids[2], 'iPhone · PWA')
    assert.equal((await sql('SELECT count(*) FROM push_devices WHERE id = $1', [idFor(fids[0])])).rows[0].count, '0')
    assert.equal((await repository.getNotificationState(a, phone)).devices.length, 2)

    const switched = await open(b, phone.browserId, phone.sessionId)
    assert.notEqual(switched.sessionId, phone.sessionId)
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 1)
    await assert.rejects(repository.registerPushDevice(a, phone, fids[2], 'Late callback'))
    // A device taken over from another account is new to this one.
    assert.equal((await repository.registerPushDevice(b, switched, fids[2], 'iPhone · PWA')).isNew, true)
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
    assert.equal((await stored()).next_reminder_at, null)
    await repository.saveNotificationSettings(a, settings)
    assert.ok((await stored()).next_reminder_at instanceof Date)
    await repository.saveNotificationSettings(a, { ...settings, notificationsEnabled: false })
    assert.equal((await stored()).next_reminder_at, null)
    assert.equal((await repository.getNotificationState(a, laptop)).devices.length, 1)
    assert.equal((await repository.getNotificationSettings(a)).notificationsEnabled, false)
    console.log('Notification integration checks passed: settings persistence, validation, multiple devices, retries, FID refresh, ownership transfer, logout, stale-session rejection and account isolation. No push messages sent.')
  } finally {
    // Browser rows outlive their user (they only lose the link), so remove them first.
    if (browserIds.size) await sql('DELETE FROM notification_browsers WHERE id = ANY($1)', [[...browserIds]])
    await cleanup()
    console.log('Isolated notification test records removed.')
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
