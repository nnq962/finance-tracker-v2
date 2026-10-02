/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-onboarding-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const onboarding = require('../lib/onboarding/repository.ts')

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

    // Checklist steps follow the user's own data only.
    const otherId = await createUser('onboarding_test')
    await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance) VALUES ($1, 'Ví', 'cash', 0, 0)`, [otherId])
    assert.deepEqual(await onboarding.getChecklistState(userId), {
      hidden: false, hasAccount: false, hasTransaction: false, reminderOn: false,
    })
    await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance) VALUES ($1, 'Ví', 'cash', 0, 0)`, [userId])
    await sql(`INSERT INTO notification_settings (user_id, notifications_enabled, daily_reminder_time, next_reminder_at)
      VALUES ($1, true, '20:00', now() + interval '1 day')`, [userId])
    await onboarding.hideChecklist(userId)
    assert.deepEqual(await onboarding.getChecklistState(userId), {
      hidden: true, hasAccount: true, hasTransaction: false, reminderOn: true,
    })
    console.log('Onboarding checks passed.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
