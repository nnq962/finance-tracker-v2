/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-onboarding-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const onboarding = require('../lib/onboarding/repository.ts')
const { MISSION_REWARD } = require('../lib/onboarding/missions.ts')

async function run() {
  try {
    // A new user sees the welcome until it is marked seen, once.
    const userId = await createUser('onboarding_test')
    assert.equal(await onboarding.needsOnboarding(userId), true)
    await onboarding.markOnboardingSeen(userId)
    assert.equal(await onboarding.needsOnboarding(userId), false)
    const seenAt = (await sql('SELECT onboarding_seen_at FROM users WHERE id = $1', [userId])).rows[0].onboarding_seen_at
    await onboarding.markOnboardingSeen(userId)
    assert.deepEqual((await sql('SELECT onboarding_seen_at FROM users WHERE id = $1', [userId])).rows[0].onboarding_seen_at, seenAt)

    // Missions follow the user's own data only.
    const otherId = await createUser('onboarding_test')
    await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance) VALUES ($1, 'Ví', 'cash', 0, 0)`, [otherId])
    let state = await onboarding.getMissionState(userId)
    assert.ok(Object.values(state.done).every((done) => !done))
    assert.deepEqual(state.claimed, [])
    assert.equal(state.aiCredits, 0)

    await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance) VALUES ($1, 'Ví', 'cash', 0, 0)`, [userId])
    await sql(`INSERT INTO notification_settings (user_id, notifications_enabled, daily_reminder_time, next_reminder_at)
      VALUES ($1, true, '20:00', now() + interval '1 day')`, [userId])
    await sql(`INSERT INTO contacts (user_id, name, initials) VALUES ($1, 'An', 'A')`, [userId])
    state = await onboarding.getMissionState(userId)
    assert.equal(state.done.account, true)
    assert.equal(state.done.reminder, true)
    assert.equal(state.done.contact, true)
    assert.equal(state.done.transaction, false)
    assert.equal(state.done.category, false)

    // Default categories do not count; one the user adds later does.
    await sql(`UPDATE users SET categories_initialized_at = now() - interval '1 minute' WHERE id = $1`, [userId])
    const groupId = (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
      VALUES ($1, 'expense', 'Ăn uống', 'utensils', 'orange') RETURNING id`, [userId])).rows[0].id
    await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name, created_at)
      VALUES ($1, $2, 'expense', 'Sáng', 'coffee', now() - interval '2 minutes')`, [userId, groupId])
    assert.equal((await onboarding.getMissionState(userId)).done.category, false)
    await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name) VALUES ($1, $2, 'expense', 'Trà sữa', 'coffee')`, [userId, groupId])
    assert.equal((await onboarding.getMissionState(userId)).done.category, true)

    // A done mission pays once, however often it is claimed at the same moment.
    const claims = await Promise.all([1, 2, 3].map(() => onboarding.claimMissionReward(userId, 'account', false)))
    assert.deepEqual(claims.filter((credits) => credits !== null), [MISSION_REWARD])
    // Not done yet: nothing.
    assert.equal(await onboarding.claimMissionReward(userId, 'transaction', false), null)
    // Installing is known only to the browser, which says so.
    assert.equal(await onboarding.claimMissionReward(userId, 'install', false), null)
    assert.equal(await onboarding.claimMissionReward(userId, 'install', true), 2 * MISSION_REWARD)
    state = await onboarding.getMissionState(userId)
    assert.deepEqual([...state.claimed].sort(), ['account', 'install'])
    assert.equal(state.aiCredits, 2 * MISSION_REWARD)
    console.log('Onboarding checks passed.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
