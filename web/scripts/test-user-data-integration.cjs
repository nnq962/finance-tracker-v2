/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-user-data-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const userData = require('../lib/user-data/repository.ts')
const { isWipeConfirmWord } = require('../lib/user-data/confirm.ts')
const { defaultCategoryGroups } = require('../lib/categories/defaults.ts')
const onboarding = require('../lib/onboarding/repository.ts')

const financialTables = ['accounts', 'transactions', 'debts', 'debt_payments', 'debt_operations', 'contacts', 'category_groups', 'category_items']
const accountTables = ['subscriptions', 'payments', 'ai_usage', 'mission_rewards', 'notification_settings', 'notice_reads']

async function counts(userId, tables) {
  const result = {}
  for (const table of tables) {
    result[table] = (await sql(`SELECT count(*)::int AS n FROM ${table} WHERE user_id = $1`, [userId])).rows[0].n
  }
  return result
}

/** A user with a bit of everything: money, loans, categories, and what belongs to the sign-in. */
async function seed(userId) {
  const one = async (text, params) => (await sql(text, [userId, ...params])).rows[0]
  const account = await one(`INSERT INTO accounts (user_id, name, type, opening_balance, balance) VALUES ($1, 'Ví', 'cash', 100000, 100000) RETURNING id`, [])
  await one(`INSERT INTO accounts (user_id, name, type, opening_balance, balance, goal_target, goal_icon, goal_color)
    VALUES ($1, 'Hũ', 'savings', 0, 0, 5000000, 'plane', 'sky') RETURNING id`, [])
  const group = await one(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name) VALUES ($1, 'expense', 'Riêng', 'tag', 'rose') RETURNING id`, [])
  const item = await one(`INSERT INTO category_items (user_id, group_id, type, name, icon_name) VALUES ($1, $2, 'expense', 'Riêng', 'tag') RETURNING id`, [group.id])
  await one(`INSERT INTO transactions (user_id, kind, amount, account_id, category_item_id, occurred_at)
    VALUES ($1, 'expense', 20000, $2, $3, now()) RETURNING id`, [account.id, item.id])
  const contact = await one(`INSERT INTO contacts (user_id, name, initials) VALUES ($1, 'An', 'A') RETURNING id`, [])
  const debt = await one(`INSERT INTO debts (user_id, contact_id, direction, account_id, amount, recorded_at)
    VALUES ($1, $2, 'lent', $3, 50000, current_date) RETURNING id`, [contact.id, account.id])
  await one(`INSERT INTO transactions (user_id, kind, amount, account_id, debt_id, occurred_at)
    VALUES ($1, 'expense', 50000, $2, $3, now()) RETURNING id`, [account.id, debt.id])
  await one(`INSERT INTO debt_payments (user_id, debt_id, account_id, amount, paid_at, paid_time)
    VALUES ($1, $2, $3, 10000, current_date, '09:00') RETURNING id`, [debt.id, account.id])
  await one(`INSERT INTO debt_operations (user_id, id, fingerprint) VALUES ($1, uuidv7(), repeat('a', 64)) RETURNING id`, [])

  await one(`INSERT INTO subscriptions (user_id, plan, starts_at, ends_at, granted_by) VALUES ($1, 'pro', now(), now() + interval '30 days', 'test') RETURNING id`, [])
  await one(`INSERT INTO payments (user_id, period, amount) VALUES ($1, 'month', 49000) RETURNING id`, [])
  await one(`INSERT INTO ai_usage (user_id, month, count) VALUES ($1, date_trunc('month', now())::date, 7) RETURNING count`, [])
  await one(`INSERT INTO mission_rewards (user_id, mission, credits) VALUES ($1, 'account', 5) RETURNING mission`, [])
  await one(`INSERT INTO notification_settings (user_id, notifications_enabled, next_reminder_at) VALUES ($1, true, now() + interval '1 day') RETURNING user_id`, [])
  await one(`INSERT INTO notice_reads (user_id, key) VALUES ($1, 'news') RETURNING key`, [])
  await one(`UPDATE users SET ai_credits = 5, onboarding_seen_at = now(), categories_initialized_at = now() - interval '1 day' WHERE id = $1 RETURNING id`, [])
}

async function run() {
  try {
    // The confirmation word, however the keyboard placed its accent.
    for (const word of ['XOÁ', 'XÓA', 'xoá', 'xoa', ' Xoa ']) assert.equal(isWipeConfirmWord(word), true, word)
    for (const word of ['', 'XO', 'XOÁ!', 'delete', null, 1]) assert.equal(isWipeConfirmWord(word), false, String(word))

    const a = await createUser('wipe_test')
    const b = await createUser('wipe_test')
    await seed(a)
    await seed(b)

    assert.deepEqual(await userData.getUserDataSummary(a), { accounts: 2, transactions: 2, debts: 1, contacts: 1 })
    const accountBound = await counts(a, accountTables)
    const before = { financial: await counts(b, financialTables), account: await counts(b, accountTables) }
    const userRow = (id) => sql('SELECT ai_credits, onboarding_seen_at, categories_initialized_at FROM users WHERE id = $1', [id]).then((r) => r.rows[0])
    const bUser = await userRow(b)

    await userData.wipeUserData(a)

    // A's records are gone, the default categories back and the welcome due.
    const defaultGroups = defaultCategoryGroups.length
    const defaultItems = defaultCategoryGroups.reduce((total, group) => total + group.items.length, 0)
    const expectAfterWipe = async () => {
      assert.deepEqual(await counts(a, financialTables), {
        accounts: 0, transactions: 0, debts: 0, debt_payments: 0, debt_operations: 0, contacts: 0,
        category_groups: defaultGroups, category_items: defaultItems,
      })
      assert.deepEqual(await userData.getUserDataSummary(a), { accounts: 0, transactions: 0, debts: 0, contacts: 0 })
      assert.equal(await onboarding.needsOnboarding(a), true)
      // What belongs to the sign-in stays: plan, payments, AI use and credits, missions, reminders, notices.
      assert.deepEqual(await counts(a, accountTables), accountBound)
      assert.equal((await userRow(a)).ai_credits, 5)
      // The defaults are not counted as a category the user added.
      const missions = await onboarding.getMissionState(a)
      assert.equal(missions.done.category, false)
      assert.deepEqual(missions.claimed, ['account'])
    }
    await expectAfterWipe()

    // B is untouched.
    assert.deepEqual(await counts(b, financialTables), before.financial)
    assert.deepEqual(await counts(b, accountTables), before.account)
    assert.deepEqual(await userRow(b), bUser)

    // Again, and twice at once: the same state, nothing doubled.
    await userData.wipeUserData(a)
    await Promise.all([userData.wipeUserData(a), userData.wipeUserData(a)])
    await expectAfterWipe()
    assert.deepEqual(await counts(b, financialTables), before.financial)

    // A user without a row yet (never signed in here) gets one, with the defaults.
    const fresh = `wipe_test_fresh_${Date.now()}`
    try {
      await userData.wipeUserData(fresh)
      assert.equal((await counts(fresh, ['category_groups'])).category_groups, defaultGroups)
    } finally {
      await sql('DELETE FROM users WHERE id = $1', [fresh])
    }

    console.log('User data wipe checks passed.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
