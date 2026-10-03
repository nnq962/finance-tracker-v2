/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-plans-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const plans = require('../lib/plans/repository.ts')
const { plans: limits } = require('../lib/plans/plans.ts')

const DAY = 24 * 60 * 60 * 1000

async function run() {
  try {
    const admin = await createUser('plan_admin')
    const userId = await createUser('plan_test')

    // A new user is on the free plan with nothing used.
    let state = await plans.getPlanState(userId)
    assert.equal(state.plan, 'free')
    assert.equal(state.aiUsed, 0)
    assert.equal(state.aiLimit, limits.free.aiMonthlyLimit)

    // Requests at the same moment never pass the monthly limit together.
    const free = limits.free.aiMonthlyLimit
    const results = await Promise.all(Array.from({ length: free + 5 }, () => plans.reserveAiRequest(userId)))
    assert.equal(results.filter((result) => result.allowed).length, free)
    assert.equal(results.filter((result) => !result.allowed).length, 5)
    assert.equal((await plans.getPlanState(userId)).aiUsed, free)

    // A request the AI could not answer is given back.
    // (The first allowed one: requests sent together may come back in any order.)
    await plans.releaseAiRequest(userId, results.find((result) => result.allowed).source)
    assert.equal((await plans.getPlanState(userId)).aiUsed, free - 1)
    assert.equal((await plans.reserveAiRequest(userId)).allowed, true)
    assert.equal((await plans.reserveAiRequest(userId)).allowed, false)

    // Once the month is used up, AI credits pay for requests, never below none.
    await sql('UPDATE users SET ai_credits = 2 WHERE id = $1', [userId])
    const onCredits = await Promise.all(Array.from({ length: 4 }, () => plans.reserveAiRequest(userId)))
    assert.equal(onCredits.filter((result) => result.allowed).length, 2)
    assert.ok(onCredits.filter((result) => result.allowed).every((result) => result.source === 'credit'))
    let after = await plans.getPlanState(userId)
    assert.equal(after.aiUsed, free)
    assert.equal(after.aiCredits, 0)
    // A credit the AI could not use goes back to the credits.
    await plans.releaseAiRequest(userId, 'credit')
    after = await plans.getPlanState(userId)
    assert.equal(after.aiCredits, 1)
    assert.equal(after.aiUsed, free)
    await sql('UPDATE users SET ai_credits = 0 WHERE id = $1', [userId])

    // Pro raises the limit at once.
    await plans.grantPro(admin, userId, { period: 'month', amount: 29000, note: 'CK test' })
    state = await plans.getPlanState(userId)
    assert.equal(state.plan, 'pro')
    assert.equal(state.aiLimit, limits.pro.aiMonthlyLimit)
    assert.equal((await plans.reserveAiRequest(userId)).allowed, true)
    const firstEnd = new Date(state.proEndsAt)
    assert.ok(firstEnd.getTime() - Date.now() > 27 * DAY && firstEnd.getTime() - Date.now() < 32 * DAY)

    // A second grant follows the first: a year more, from where it ends.
    await plans.grantPro(admin, userId, { period: 'year', amount: 249000 })
    const grants = await plans.listGrants(userId)
    assert.equal(grants.length, 2)
    assert.equal(grants[0].startsAt, firstEnd.toISOString())
    const yearEnd = new Date((await plans.getPlanState(userId)).proEndsAt)
    assert.ok(yearEnd.getTime() - firstEnd.getTime() > 364 * DAY && yearEnd.getTime() - firstEnd.getTime() < 367 * DAY)

    // Two grants at once still follow one another.
    const racer = await createUser('plan_test')
    await Promise.all([
      plans.grantPro(admin, racer, { period: 'month', amount: 0 }),
      plans.grantPro(admin, racer, { period: 'month', amount: 0 }),
    ])
    const raced = await plans.listGrants(racer)
    assert.equal(raced.length, 2)
    assert.ok([raced[0].startsAt, raced[1].startsAt].includes(raced[0].endsAt) || [raced[0].startsAt, raced[1].startsAt].includes(raced[1].endsAt))

    // The admin list shows Pro and this month's requests; takings add up.
    const row = (await plans.listUsersForAdmin()).find((item) => item.id === userId)
    assert.equal(row.proEndsAt, yearEnd.toISOString())
    assert.equal(row.aiUsed, free + 1)
    assert.ok((await plans.getMonthTakings()).total >= 278000)

    // Revoking ends Pro now, the following grant included, and keeps the history.
    await plans.revokePro(userId)
    state = await plans.getPlanState(userId)
    assert.equal(state.plan, 'free')
    assert.equal(state.proEndsAt, undefined)
    assert.ok((await plans.listGrants(userId)).every((grant) => grant.revoked))
    // A grant after a revocation starts now, not after the revoked time.
    await plans.grantPro(admin, userId, { period: 'month', amount: 29000 })
    const restarted = (await plans.listGrants(userId))[0]
    assert.ok(Math.abs(new Date(restarted.startsAt).getTime() - Date.now()) < 60 * 1000)

    // Granting to someone unknown fails cleanly.
    await assert.rejects(() => plans.grantPro(admin, 'plan_test_missing', { period: 'month', amount: 0 }), plans.PlanError)

    // Usage is kept per Vietnam month.
    assert.equal((await sql('SELECT count(*) FROM ai_usage WHERE user_id = $1', [userId])).rows[0].count, '1')

    console.log('Plan integration checks passed: limits, races, grants, chaining, revocation, takings.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
