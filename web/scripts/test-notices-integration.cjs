/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-notices-integration.cjs */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const debts = require('../lib/debts/repository.ts')
const { getNotices, markNoticesRead } = require('../lib/notices/notices.ts')
const { toDateKey } = require('../lib/format-date.ts')

const day = (offset) => toDateKey(new Date(Date.now() + offset * 86_400_000))

async function run() {
  try {
    const userId = await createUser('notice_test')
    // An account opened last week, below zero, with nothing written down yesterday.
    await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance, opened_at)
      VALUES ($1, 'Ví', 'cash', -50000, -50000, now() - interval '7 days')`, [userId])
    const contact = await debts.createContact(userId, { name: 'Lan' }, randomUUID())
    const due = { contactId: contact.id, recordingMode: 'opening', paidAmount: 0, hasInterest: false, note: '' }
    // One due in two days, one past due, one due in a month (too far to say).
    await debts.createDebt(userId, { ...due, direction: 'lent', amount: 500000, recordedAt: day(-10), dueAt: day(2) }, randomUUID())
    await debts.createDebt(userId, { ...due, direction: 'borrowed', amount: 300000, recordedAt: day(-20), dueAt: day(-3) }, randomUUID())
    await debts.createDebt(userId, { ...due, direction: 'lent', amount: 100000, recordedAt: day(-1), dueAt: day(30) }, randomUUID())

    const notices = await getNotices(userId)
    const kinds = notices.map((notice) => notice.kind)
    assert.equal(kinds.filter((kind) => kind === 'debt-due').length, 1)
    assert.equal(kinds.filter((kind) => kind === 'debt-overdue').length, 1)
    assert.ok(kinds.includes('unrecorded'))
    assert.ok(kinds.includes('negative'))
    assert.ok(kinds.includes('missions'), 'the account and the debts finish missions')
    const dueNotice = notices.find((notice) => notice.kind === 'debt-due')
    assert.match(dueNotice.body, /Lan · cần thu 500\.000đ · còn 2 ngày/)
    assert.match(notices.find((notice) => notice.kind === 'debt-overdue').body, /cần trả .* quá hạn 3 ngày/)
    assert.ok(notices.every((notice) => !notice.read))
    // Newest first.
    assert.deepEqual([...notices].sort((a, b) => b.at.localeCompare(a.at)).map((n) => n.key), notices.map((n) => n.key))

    // Read on one device is read everywhere, and reading twice changes nothing.
    await markNoticesRead(userId, [dueNotice.key, dueNotice.key])
    await markNoticesRead(userId, [dueNotice.key])
    const after = await getNotices(userId)
    assert.equal(after.find((notice) => notice.key === dueNotice.key).read, true)
    assert.equal(after.filter((notice) => notice.read).length, 1)

    // Something written down yesterday ends that notice.
    const account = (await sql('SELECT id FROM accounts WHERE user_id = $1', [userId])).rows[0].id
    const group = (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
      VALUES ($1, 'expense', 'Ăn uống', 'utensils', 'orange') RETURNING id`, [userId])).rows[0].id
    const meal = (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Ăn trưa', 'soup') RETURNING id`, [userId, group])).rows[0].id
    await sql(`INSERT INTO transactions (user_id, kind, amount, account_id, category_item_id, occurred_at)
      VALUES ($1, 'expense', 1000, $2, $3, $4)`, [userId, account, meal, new Date(`${day(-1)}T12:00:00+07:00`)])
    assert.ok(!(await getNotices(userId)).some((notice) => notice.kind === 'unrecorded'))

    console.log('Notice checks passed: debts due and overdue, unrecorded day, missions, negative balance, read state.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
