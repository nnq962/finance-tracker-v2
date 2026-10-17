/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-broadcasts-integration.cjs
   No push leaves this machine: the worker sends them (backend/tests fake FCM),
   and the test send here goes through a fake sender. */
process.env.ADMIN_EMAILS = 'broadcast-admin@test.local'
const assert = require('node:assert/strict')
const { createHash, randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const broadcasts = require('../lib/broadcasts/repository.ts')
const { getNotices, markNoticesRead } = require('../lib/notices/notices.ts')
const { getNotificationState } = require('../lib/notifications/repository.ts')

const session = (uid, email, emailVerified = true) => ({ uid, email, emailVerified, name: '', avatar: '' })

/** A push registration linked to one of the user's browsers, as the app makes it. */
async function addDevice(userId) {
  const fid = `c${randomUUID().replace(/-/g, '').slice(0, 21)}`
  const id = createHash('sha256').update(fid).digest('hex')
  const browser = randomUUID()
  browsers.push(browser)
  await sql('INSERT INTO notification_browsers (id, user_id, session_id) VALUES ($1, $2, $3)', [browser, userId, randomUUID()])
  await sql(`INSERT INTO push_devices (id, user_id, fid, name, browser_id) VALUES ($1, $2, $3, 'Test', $4)`, [id, userId, fid, browser])
  await sql('UPDATE notification_browsers SET device_id = $1 WHERE id = $2', [id, browser])
  return { id, fid, browser }
}

const draft = (changes = {}) => ({
  title: 'Hạn mức chi tiêu đã có',
  body: 'Đặt hạn mức cho cả tháng hoặc từng nhóm.',
  opens: 'budgets',
  channel: 'both',
  audience: 'all',
  sendAt: null,
  ...changes,
})

const browsers = []

const bellKeys = async (userId) => (await getNotices(userId)).filter((n) => n.kind === 'broadcast').map((n) => n.key)

async function run() {
  const created = []
  try {
    const adminId = await createUser('broadcast_admin')
    const reader = await createUser('broadcast_reader')
    const quiet = await createUser('broadcast_quiet')
    const admin = session(adminId, 'broadcast-admin@test.local')
    const readerDevice = await addDevice(reader)
    const quietDevice = await addDevice(quiet)

    // Only admins send, test, or take back, whatever the caller checked.
    await assert.rejects(() => broadcasts.createBroadcast(session(reader, 'someone@test.local'), draft()), broadcasts.BroadcastError)
    await assert.rejects(() => broadcasts.createBroadcast(session(adminId, 'broadcast-admin@test.local', false), draft()), broadcasts.BroadcastError)
    await assert.rejects(() => broadcasts.sendTestBroadcast(session(reader, 'someone@test.local'), draft(), async () => 0), broadcasts.BroadcastError)

    // Bad drafts never get written.
    await assert.rejects(() => broadcasts.createBroadcast(admin, draft({ title: ' ' })), /Nhập tiêu đề/)
    await assert.rejects(() => broadcasts.createBroadcast(admin, draft({ title: 'x'.repeat(61) })), /Tiêu đề tối đa/)
    await assert.rejects(() => broadcasts.createBroadcast(admin, draft({ opens: 'https://evil.example' })), /Nơi mở/)
    await assert.rejects(() => broadcasts.createBroadcast(admin, draft({ sendAt: new Date(Date.now() - 60_000).toISOString() })), /Giờ hẹn đã qua/)

    // "Tin từ Timi" off: no push, still in the bell.
    assert.equal((await getNotificationState(quiet)).broadcastsEnabled, true)
    await broadcasts.setBroadcastsEnabled(quiet, false)
    assert.equal((await getNotificationState(quiet)).broadcastsEnabled, false)
    const reach = (await broadcasts.getBroadcastReach()).all
    assert.ok(reach.people >= 3 && reach.optedOut >= 1)

    // Sent now: straight into both bells, a push due only to the reader's device.
    const sent = await broadcasts.createBroadcast(admin, draft())
    created.push(sent)
    const deliveries = (await sql('SELECT device_id, status FROM broadcast_deliveries WHERE broadcast_id = $1', [sent])).rows
    assert.ok(deliveries.some((row) => row.device_id === readerDevice.id && row.status === 'pending'))
    assert.ok(!deliveries.some((row) => row.device_id === quietDevice.id))
    assert.deepEqual(await bellKeys(reader), [`broadcast:${sent}`])
    assert.deepEqual(await bellKeys(quiet), [`broadcast:${sent}`])
    const notice = (await getNotices(reader)).find((n) => n.kind === 'broadcast')
    assert.equal(notice.title, 'Hạn mức chi tiêu đã có')
    assert.deepEqual(notice.opens, { href: '/overview?screen=budgets' })
    assert.equal(notice.read, false)

    // Read once, on any device: counted once.
    await markNoticesRead(reader, [notice.key])
    await markNoticesRead(reader, [notice.key])
    let item = (await broadcasts.getBroadcasts()).find((b) => b.id === sent)
    assert.equal(item.status, 'sending')
    assert.equal(item.read, 1)
    assert.ok(item.people >= 3)
    assert.equal(item.devices.pending, item.devices.total)

    // Someone who joins later never sees it.
    const later = await createUser('broadcast_later')
    assert.deepEqual(await bellKeys(later), [])

    // Push only: nothing in the bell. Bell only: no deliveries.
    const pushOnly = await broadcasts.createBroadcast(admin, draft({ channel: 'push', opens: 'none' }))
    const bellOnly = await broadcasts.createBroadcast(admin, draft({ channel: 'bell', opens: 'plans' }))
    created.push(pushOnly, bellOnly)
    assert.ok(!(await bellKeys(reader)).includes(`broadcast:${pushOnly}`))
    assert.equal((await sql('SELECT count(*)::int AS n FROM broadcast_deliveries WHERE broadcast_id = $1', [bellOnly])).rows[0].n, 0)
    assert.deepEqual((await getNotices(reader)).find((n) => n.key === `broadcast:${bellOnly}`).opens, { event: { name: 'finance:open-plans', path: '/overview', href: '/overview?screen=plan' } })
    assert.equal((await broadcasts.getBroadcasts()).find((b) => b.id === bellOnly).status, 'sent')

    // Set for later: not in any bell yet; cancelling deletes it.
    const scheduled = await broadcasts.createBroadcast(admin, draft({ sendAt: new Date(Date.now() + 3_600_000).toISOString() }))
    created.push(scheduled)
    assert.ok(!(await bellKeys(reader)).includes(`broadcast:${scheduled}`))
    assert.equal((await broadcasts.getBroadcasts()).find((b) => b.id === scheduled).status, 'scheduled')
    await assert.rejects(() => broadcasts.revokeBroadcast(session(reader, 'someone@test.local'), scheduled), broadcasts.BroadcastError)
    assert.equal(await broadcasts.revokeBroadcast(admin, scheduled), 'cancelled')
    assert.equal((await sql('SELECT count(*)::int AS n FROM broadcasts WHERE id = $1', [scheduled])).rows[0].n, 0)

    // Taken back: gone from every bell, its pushes not yet out dropped.
    assert.equal(await broadcasts.revokeBroadcast(admin, sent), 'revoked')
    assert.ok(!(await bellKeys(reader)).includes(`broadcast:${sent}`))
    assert.ok(!(await bellKeys(quiet)).includes(`broadcast:${sent}`))
    assert.equal((await sql(`SELECT count(*)::int AS n FROM broadcast_deliveries WHERE broadcast_id = $1 AND status IN ('pending', 'retry')`, [sent])).rows[0].n, 0)
    item = (await broadcasts.getBroadcasts()).find((b) => b.id === sent)
    assert.equal(item.status, 'revoked')
    assert.ok(item.revokedAt)

    // The test send goes to the admin's own devices only, and needs one.
    await assert.rejects(() => broadcasts.sendTestBroadcast(admin, draft(), async () => 0), /chưa bật thông báo/)
    const adminDevice = await addDevice(adminId)
    let pushed = []
    const count = await broadcasts.sendTestBroadcast(admin, draft(), async (messages) => {
      pushed = messages
      return messages.length
    })
    assert.equal(count, 1)
    assert.deepEqual(pushed.map((m) => m.fid), [adminDevice.fid])
    assert.equal(pushed[0].url, '/overview?screen=budgets')
    assert.equal((await sql('SELECT count(*)::int AS n FROM broadcasts WHERE title = $1 AND created_by = $2', ['Hạn mức chi tiêu đã có', adminId])).rows[0].n, 3)

    console.log('Broadcast checks passed: admins only, opted-out pushes, bell, reads, push/bell only, schedule, cancel, revoke, test send.')
  } finally {
    if (created.length) await sql('DELETE FROM broadcasts WHERE id = ANY($1)', [created])
    if (browsers.length) await sql('DELETE FROM notification_browsers WHERE id = ANY($1)', [browsers])
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
