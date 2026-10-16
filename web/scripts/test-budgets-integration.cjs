/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-budgets-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const budgets = require('../lib/budgets/repository.ts')
const { syncBudgetAlerts, budgetPushMessage } = require('../lib/budgets/alerts.ts')
const calc = require('../lib/budgets/calculations.ts')
const { toDateKey } = require('../lib/format-date.ts')

const count = async (text, params) => Number((await sql(text, params)).rows[0].count)

/** "YYYY-MM" moved by `by` months. */
const shift = (month, by) => {
  const [year, index] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, index - 1 + by, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

async function run() {
  try {
    const today = toDateKey(new Date())
    const month = today.slice(0, 7)
    const userId = await createUser('budgets_test')
    const otherId = await createUser('budgets_test')

    const account = async (owner, fields = {}) => (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance, excluded, goal_target, goal_icon, goal_color)
      VALUES ($1, 'Tài khoản', $2, 0, 0, $3, $4, $5, $6) RETURNING id`, [
      owner, fields.type ?? 'cash', fields.excluded ?? false,
      fields.type === 'savings' ? 1_000_000 : null, fields.type === 'savings' ? 'gift' : null, fields.type === 'savings' ? 'orange' : null,
    ])).rows[0].id
    const group = async (owner, name, type = 'expense', status = 'active') => (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name, status)
      VALUES ($1, $2, $3, 'utensils', 'orange', $4) RETURNING id`, [owner, type, name, status])).rows[0].id
    const item = async (owner, groupId, type = 'expense') => (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, $3, 'Mục', 'coffee') RETURNING id`, [owner, groupId, type])).rows[0].id
    const spend = (owner, amount, accountId, categoryId, when, extra = {}) => sql(`INSERT INTO transactions (user_id, kind, amount, account_id, category_item_id, occurred_at, excluded, adjustment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [owner, extra.kind ?? 'expense', amount, accountId, categoryId, `${when}-01T12:00:00+07:00`, extra.excluded ?? false, extra.adjustment ?? false])

    const bank = await account(userId)
    const leftOutAccount = await account(userId, { excluded: true })
    const jar = await account(userId, { type: 'savings' })
    const food = await group(userId, 'Ăn uống')
    const fun = await group(userId, 'Giải trí')
    const salary = await group(userId, 'Lương', 'income')
    const old = await group(userId, 'Cũ', 'expense', 'archived')
    const lunch = await item(userId, food)
    const film = await item(userId, fun)
    const pay = await item(userId, salary, 'income')

    // This month: what counts is spending with a category, counted in the figures, not from a jar.
    await spend(userId, 300_000, bank, lunch, month)
    await spend(userId, 200_000, bank, film, month)
    await spend(userId, 50_000, bank, lunch, month, { excluded: true })
    await spend(userId, 70_000, leftOutAccount, lunch, month)
    await spend(userId, 1_000_000, jar, lunch, month)
    await spend(userId, 99_000, bank, null, month, { adjustment: true })
    await spend(userId, 5_000_000, bank, pay, month, { kind: 'income' })
    await sql(`INSERT INTO transactions (user_id, kind, amount, from_account_id, to_account_id, occurred_at)
      VALUES ($1, 'transfer', 500000, $2, $3, $4)`, [userId, bank, jar, `${month}-01T12:00:00+07:00`])
    // The months before: the average is over those that had spending (two here), not a fixed three.
    await spend(userId, 600_000, bank, lunch, shift(month, -1))
    await spend(userId, 100_000, bank, film, shift(month, -1))
    await spend(userId, 300_000, bank, lunch, shift(month, -3))
    // Four months ago is out of the average.
    await spend(userId, 9_000_000, bank, lunch, shift(month, -4))
    // Another user's spending never shows.
    const otherBank = await account(otherId)
    const otherFood = await group(otherId, 'Ăn uống')
    await spend(otherId, 777_000, otherBank, await item(otherId, otherFood), month)

    let overview = await budgets.getBudgetOverview(userId)
    assert.equal(overview.month, month)
    assert.deepEqual(overview.total, { budgetId: null, limit: null, spent: 500_000, average: 500_000 })
    assert.deepEqual(overview.groups.map((g) => g.name), ['Ăn uống', 'Giải trí'], 'only active spending groups')
    const foodLine = () => overview.groups.find((g) => g.groupId === food)
    assert.equal(foodLine().spent, 300_000)
    assert.equal(foodLine().average, 450_000)
    assert.equal(overview.groups.find((g) => g.groupId === fun).average, 50_000)
    assert.equal(calc.hasAnyBudget(overview), false)

    // Setting limits: the month's and a group's, each once however often saved.
    const totalId = await budgets.saveBudget(userId, null, 400_000)
    assert.equal(await budgets.saveBudget(userId, null, 600_000), totalId)
    const foodId = await budgets.saveBudget(userId, food, 350_000)
    assert.equal(await count('SELECT count(*) FROM budgets WHERE user_id = $1', [userId]), 2)
    await assert.rejects(() => budgets.saveBudget(userId, null, 0), /không hợp lệ/)
    await assert.rejects(() => budgets.saveBudget(userId, null, 1e18), /không hợp lệ/)
    await assert.rejects(() => budgets.saveBudget(userId, salary, 1_000), /Không tìm thấy nhóm/)
    await assert.rejects(() => budgets.saveBudget(userId, old, 1_000), /Không tìm thấy nhóm/)
    await assert.rejects(() => budgets.saveBudget(otherId, food, 1_000), /Không tìm thấy nhóm/)
    // The database holds the same: one month limit per user, only spending groups, only the user's own.
    await assert.rejects(() => sql('INSERT INTO budgets (user_id, amount) VALUES ($1, 1)', [userId]))
    await assert.rejects(() => sql('INSERT INTO budgets (user_id, category_group_id, amount) VALUES ($1, $2, 1)', [userId, salary]))
    await assert.rejects(() => sql('INSERT INTO budgets (user_id, category_group_id, amount) VALUES ($1, $2, 1)', [otherId, food]))

    overview = await budgets.getBudgetOverview(userId)
    assert.equal(overview.total.limit, 600_000)
    assert.equal(foodLine().budgetId, foodId)
    assert.equal(foodLine().limit, 350_000)
    assert.equal(calc.hasAnyBudget(overview), true)
    assert.deepEqual(calc.groupsByUse(overview).map((g) => g.name), ['Ăn uống'])
    assert.equal((await budgets.getBudgetOverview(otherId)).total.limit, null)

    // Alerts: each level once a month. The month at 83%, food at 86%: both at 80%.
    let due = await syncBudgetAlerts(userId, { notify: false })
    assert.deepEqual(due.map((d) => [d.budgetId, d.level]).sort(), [[foodId, 80], [totalId, 80]].sort())
    assert.match(due.find((d) => d.budgetId === foodId).title, /^Ăn uống đã dùng 86% hạn mức$/)
    assert.deepEqual(await syncBudgetAlerts(userId, { notify: false }), [])
    // Past both: only 100% is new, and says by how much.
    await spend(userId, 150_000, bank, lunch, month)
    due = await syncBudgetAlerts(userId, { notify: false })
    assert.deepEqual(due.map((d) => [d.budgetId, d.level]).sort(), [[foodId, 100], [totalId, 100]].sort())
    assert.equal(due.find((d) => d.budgetId === foodId).title, 'Vượt hạn mức Ăn uống')
    assert.equal(due.find((d) => d.budgetId === totalId).title, 'Vượt hạn mức tháng')
    assert.match(due.find((d) => d.budgetId === totalId).body, /^Đã chi 650\.000đ, hơn hạn mức 50\.000đ\.$/)
    // A raised limit warns again from scratch; the levels it already stands at are written down silently.
    await budgets.saveBudget(userId, food, 1_000_000)
    assert.deepEqual(await syncBudgetAlerts(userId, { notify: false, rearm: foodId }), [])
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 0)
    await budgets.saveBudget(userId, food, 500_000)
    assert.deepEqual((await syncBudgetAlerts(userId, { notify: false, rearm: foodId })).map((d) => d.level), [80])
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 1)

    // The 80% message: what is left a day.
    const message = budgetPushMessage(null, { budgetId: 'x', limit: 1_000_000, spent: 800_000, average: 0 }, 80, 10)
    assert.deepEqual(message, { title: 'Đã dùng 80% hạn mức tháng', body: 'Còn 200.000đ cho 10 ngày, khoảng 20.000đ mỗi ngày.' })

    // Deleting: only the user's own, and its alerts go with it.
    assert.equal(await budgets.deleteBudget(otherId, foodId), null)
    assert.deepEqual(await budgets.deleteBudget(userId, foodId), { categoryGroupId: food, amount: 500_000 })
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 0)
    // A group's limit goes with the group.
    await budgets.saveBudget(userId, fun, 100_000)
    await sql('DELETE FROM transactions WHERE category_item_id = $1', [film])
    await sql('DELETE FROM category_groups WHERE id = $1', [fun])
    assert.equal(await count('SELECT count(*) FROM budgets WHERE category_group_id = $1', [fun]), 0)

    // The sums the rows show.
    assert.equal(calc.budgetState(79, 100), 'ok')
    assert.equal(calc.budgetState(80, 100), 'near')
    assert.equal(calc.budgetState(100, 100), 'near')
    assert.equal(calc.budgetState(101, 100), 'over')
    assert.equal(calc.budgetPace(62, 100, 0.52), 'even')
    assert.equal(calc.budgetPace(63, 100, 0.52), 'fast')
    assert.equal(calc.budgetPace(30, 100, 0.52), 'slow')
    assert.equal(calc.perDay(7_450_000, 12_000_000, 16), 284_000)
    assert.equal(calc.daysLeft({ day: 16, daysInMonth: 31 }), 16)
    assert.equal(calc.suggestedLimit(3_850_000), 3_900_000)
    assert.equal(calc.suggestedLimit(310_000), 350_000)
    assert.equal(calc.suggestedLimit(0), null)
    assert.equal(calc.remainingLabel(2_250_000, 2_000_000, 16), 'Vượt 250k')
    assert.equal(calc.remainingLabel(3_420_000, 4_000_000, 16), 'Còn 580k · 36k/ngày')

    console.log('Budget checks passed: what counts as spent, averages, setting and deleting limits, other users, the database checks, alerts once per level, raised limits, the sums.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
