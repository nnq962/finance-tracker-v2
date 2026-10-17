/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-budgets-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const budgets = require('../lib/budgets/repository.ts')
const { syncBudgetAlerts, budgetPushMessage, reachedLevels } = require('../lib/budgets/alerts.ts')
const { getBudgetMonth } = require('../lib/budgets/month.ts')
const calc = require('../lib/budgets/calculations.ts')
const { limitJudges } = require('../lib/budgets/months.ts')
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
    // The 1.000.000 paid from the jar is not counted, but said.
    assert.deepEqual(overview.total, { budgetId: null, limit: null, spent: 500_000, average: 500_000, fromJars: 1_000_000, adjust: null })
    assert.equal(overview.groups.find((g) => g.groupId === food).fromJars, 1_000_000)
    assert.equal(overview.groups.find((g) => g.groupId === fun).fromJars, 0)
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
    assert.equal(due.find((d) => d.budgetId === totalId).title, 'Vượt hạn mức tổng')
    assert.match(due.find((d) => d.budgetId === totalId).body, /^Đã chi 650\.000đ, vượt 50\.000đ\.$/)
    // A raised limit warns again from scratch; the levels it already stands at are written down silently.
    await budgets.saveBudget(userId, food, 1_000_000)
    assert.deepEqual(await syncBudgetAlerts(userId, { notify: false, rearm: foodId }), [])
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 0)
    await budgets.saveBudget(userId, food, 500_000)
    assert.deepEqual((await syncBudgetAlerts(userId, { notify: false, rearm: foodId })).map((d) => d.level), [80])
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 1)

    // The 80% message: what is left a day.
    const message = budgetPushMessage(null, { budgetId: 'x', limit: 1_000_000, spent: 800_000, average: 0 }, 80, 10)
    assert.deepEqual(message, { title: 'Đã dùng 80% hạn mức tổng', body: 'Còn 200.000đ cho 10 ngày, khoảng 20.000đ mỗi ngày.' })

    // Deleting: only the user's own, and its alerts go with it.
    assert.equal(await budgets.deleteBudget(otherId, foodId), null)
    assert.deepEqual(await budgets.deleteBudget(userId, foodId), { categoryGroupId: food, amount: 500_000 })
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [foodId]), 0)
    // A group's limit goes with the group.
    await budgets.saveBudget(userId, fun, 100_000)
    await sql('DELETE FROM transactions WHERE category_item_id = $1', [film])
    await sql('DELETE FROM category_groups WHERE id = $1', [fun])
    assert.equal(await count('SELECT count(*) FROM budgets WHERE category_group_id = $1', [fun]), 0)

    // A month in detail: by day, by category, the six months before, the latest; past months run to their end.
    const monthUser = await createUser('budgets_test')
    const mBank = await account(monthUser)
    const mJar = await account(monthUser, { type: 'savings' })
    const mFood = await group(monthUser, 'Ăn uống')
    const mFun = await group(monthUser, 'Giải trí')
    const mLunch = await item(monthUser, mFood)
    const mCoffee = await item(monthUser, mFood)
    const mFilm = await item(monthUser, mFun)
    await sql("UPDATE category_items SET name = 'Cà phê' WHERE id = $1", [mCoffee])
    const last = shift(month, -1)
    const at = (m, day, hour = 12) => `${m}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00+07:00`
    const spendAt = (amount, accountId, categoryId, when, extra = {}) => sql(`INSERT INTO transactions (user_id, kind, amount, account_id, category_item_id, occurred_at, excluded)
      VALUES ($1, 'expense', $2, $3, $4, $5, $6)`, [monthUser, amount, accountId, categoryId, when, extra.excluded ?? false])
    await spendAt(100_000, mBank, mLunch, at(last, 1, 8))
    await spendAt(50_000, mBank, mLunch, at(last, 1, 23))
    await spendAt(30_000, mBank, mCoffee, at(last, 3))
    await spendAt(20_000, mBank, mCoffee, at(last, 3, 9))
    await spendAt(40_000, mBank, mCoffee, at(last, 5))
    await spendAt(70_000, mBank, mFilm, at(last, 5))
    await spendAt(999_000, mJar, mLunch, at(last, 6))
    await spendAt(888_000, mBank, mLunch, at(last, 7), { excluded: true })
    await spendAt(300_000, mBank, mLunch, at(shift(month, -2), 10))
    await spendAt(400_000, mBank, mFilm, at(shift(month, -8), 10))
    await spendAt(60_000, mBank, mLunch, at(month, 1))
    await budgets.saveBudget(monthUser, mFood, 200_000)

    const september = await getBudgetMonth(monthUser, last)
    const lastDays = new Date(Date.UTC(Number(last.slice(0, 4)), Number(last.slice(5)), 0)).getUTCDate()
    assert.equal(september.month, last)
    assert.equal(september.past, true)
    assert.equal(september.days, lastDays)
    assert.equal(september.gone, lastDays, 'a month gone by runs to its last day')
    assert.equal(september.total.daily.length, lastDays)
    assert.deepEqual(september.total.daily.slice(0, 7), [150_000, 0, 50_000, 0, 110_000, 0, 0])
    assert.equal(september.total.spent, 310_000)
    // Six months before, then the month: seven months ago is out.
    assert.deepEqual(september.total.history, [0, 0, 0, 0, 0, 300_000, 310_000])
    assert.equal(september.minMonth, shift(month, -8))
    const sFood = september.groups.find((g) => g.groupId === mFood)
    assert.equal(sFood.limit, 200_000)
    // Set this month: it did not judge September.
    assert.equal(sFood.since, month)
    assert.equal(september.total.since, null)
    assert.equal(sFood.fromJars, 999_000)
    assert.equal(september.total.fromJars, 999_000)
    assert.equal(sFood.spent, 240_000)
    assert.deepEqual(sFood.daily.slice(0, 6), [150_000, 0, 50_000, 0, 40_000, 0])
    assert.deepEqual(sFood.items.map((i) => [i.amount, i.count]), [[150_000, 2], [90_000, 3]])
    assert.equal(sFood.items[1].name, 'Cà phê')
    assert.equal(sFood.count, 5)
    assert.equal(sFood.recent.length, 3)
    assert.deepEqual(sFood.recent.map((r) => r.amount), [40_000, 30_000, 20_000], 'newest first')
    assert.equal(september.groups.find((g) => g.groupId === mFun).spent, 70_000)
    assert.equal(september.groups.find((g) => g.groupId === mFun).limit, null)

    const thisOne = await getBudgetMonth(monthUser, month)
    assert.equal(thisOne.past, false)
    assert.equal(thisOne.gone, Number(today.slice(8, 10)))
    assert.equal(thisOne.total.spent, 60_000)
    assert.equal(thisOne.total.history[5], 310_000)
    // Ahead of today, or not a month: this month.
    assert.equal((await getBudgetMonth(monthUser, shift(month, 1))).month, month)
    assert.equal((await getBudgetMonth(monthUser, 'nope')).month, month)
    // Another user's month shows none of it.
    const otherMonth = await getBudgetMonth(otherId, last)
    assert.equal(otherMonth.total.spent, 0)
    assert.equal(otherMonth.groups.some((g) => g.groupId === mFood), false)

    // The hint to change a limit: only for a limit set before this month, with two months to go by.
    let mOverview = await budgets.getBudgetOverview(monthUser)
    assert.equal(mOverview.groups.find((g) => g.groupId === mFood).adjust, null, 'set this month: no hint yet')
    await sql("UPDATE budgets SET created_at = now() - interval '70 days' WHERE category_group_id = $1", [mFood])
    mOverview = await budgets.getBudgetOverview(monthUser)
    // 240k and 300k in the two months before: 270k on average, over 200k by more than a fifth.
    assert.deepEqual(mOverview.groups.find((g) => g.groupId === mFood).adjust, { kind: 'low', to: 300_000 })
    await budgets.saveBudget(monthUser, mFood, 1_000_000)
    mOverview = await budgets.getBudgetOverview(monthUser)
    assert.deepEqual(mOverview.groups.find((g) => g.groupId === mFood).adjust, { kind: 'high', to: 300_000 })
    await budgets.saveBudget(monthUser, mFood, 300_000)
    assert.equal((await budgets.getBudgetOverview(monthUser)).groups.find((g) => g.groupId === mFood).adjust, null, 'about right: none')
    await budgets.saveBudget(monthUser, mFood, 1_000_000)
    const mFoodId = (await budgets.getBudgetOverview(monthUser)).groups.find((g) => g.groupId === mFood).budgetId
    // Put off: not this month; another user cannot put it off.
    await budgets.dismissBudgetHint(otherId, mFoodId)
    assert.notEqual((await budgets.getBudgetOverview(monthUser)).groups.find((g) => g.groupId === mFood).adjust, null)
    await budgets.dismissBudgetHint(monthUser, mFoodId)
    assert.equal((await budgets.getBudgetOverview(monthUser)).groups.find((g) => g.groupId === mFood).adjust, null)
    await budgets.dismissBudgetHint(monthUser, mFoodId, `${shift(month, 1)}-05`)
    assert.notEqual((await budgets.getBudgetOverview(monthUser)).groups.find((g) => g.groupId === mFood).adjust, null, 'put off for another month only')

    // Limit pushes: on at 80% without a settings row; the user's choice after.
    const alertUser = await createUser('budgets_test')
    assert.deepEqual(await budgets.getBudgetAlertSettings(alertUser), { enabled: true, level: 80 })
    await budgets.setBudgetAlertSettings(alertUser, { enabled: true, level: 90 })
    assert.deepEqual(await budgets.getBudgetAlertSettings(alertUser), { enabled: true, level: 90 })
    await budgets.setBudgetAlertSettings(alertUser, { enabled: false, level: null })
    assert.deepEqual(await budgets.getBudgetAlertSettings(alertUser), { enabled: false, level: null })
    assert.deepEqual(await budgets.getBudgetAlertSettings(otherId), { enabled: true, level: 80 })
    await assert.rejects(() => budgets.setBudgetAlertSettings(alertUser, { enabled: true, level: 70 }), /không hợp lệ/)
    // The reminder's settings stay as they were.
    assert.equal((await sql('SELECT notifications_enabled FROM notification_settings WHERE user_id = $1', [alertUser])).rows[0].notifications_enabled, false)
    assert.deepEqual(reachedLevels({ spent: 85, limit: 100 }, 80), [80])
    assert.deepEqual(reachedLevels({ spent: 85, limit: 100 }, 90), [])
    assert.deepEqual(reachedLevels({ spent: 95, limit: 100 }, 90), [90])
    assert.deepEqual(reachedLevels({ spent: 101, limit: 100 }, 90), [90, 100])
    assert.deepEqual(reachedLevels({ spent: 95, limit: 100 }, null), [])
    assert.deepEqual(reachedLevels({ spent: 101, limit: 100 }, null), [100])
    // At 90%, 86% says nothing; 92% warns at 90.
    const aBank = await account(alertUser)
    const aFood = await group(alertUser, 'Ăn uống')
    const aLunch = await item(alertUser, aFood)
    await budgets.setBudgetAlertSettings(alertUser, { enabled: true, level: 90 })
    const aId = await budgets.saveBudget(alertUser, aFood, 100_000)
    await spend(alertUser, 86_000, aBank, aLunch, month)
    assert.deepEqual(await syncBudgetAlerts(alertUser, { notify: false }), [])
    await spend(alertUser, 6_000, aBank, aLunch, month)
    assert.deepEqual((await syncBudgetAlerts(alertUser, { notify: false })).map((d) => [d.budgetId, d.level]), [[aId, 90]])
        // Off: written down without a push (notify asked), so turning them on later does not push what is past.
    await budgets.setBudgetAlertSettings(alertUser, { enabled: false, level: 90 })
    await spend(alertUser, 20_000, aBank, aLunch, month)
    assert.deepEqual((await syncBudgetAlerts(alertUser, { notify: true })).map((d) => d.level), [100])
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1 AND level = 100', [aId]), 1)
    assert.deepEqual(await syncBudgetAlerts(alertUser, { notify: true }), [])

    // Several at once ("Đặt theo gợi ý"): all or none.
    const bulkUser = await createUser('budgets_test')
    const bulkFood = await group(bulkUser, 'Ăn uống')
    const bulkFun = await group(bulkUser, 'Giải trí')
    const bulkSalary = await group(bulkUser, 'Lương', 'income')
    const ids = await budgets.saveBudgets(bulkUser, [{ groupId: null, amount: 5_000_000 }, { groupId: bulkFood, amount: 2_000_000 }, { groupId: bulkFun, amount: 500_000 }])
    assert.equal(ids.length, 3)
    assert.equal(await count('SELECT count(*) FROM budgets WHERE user_id = $1', [bulkUser]), 3)
    // Saved again: changed, not added.
    await budgets.saveBudgets(bulkUser, [{ groupId: bulkFood, amount: 2_500_000 }])
    assert.equal(Number((await sql('SELECT amount FROM budgets WHERE category_group_id = $1', [bulkFood])).rows[0].amount), 2_500_000)
    assert.equal(await count('SELECT count(*) FROM budgets WHERE user_id = $1', [bulkUser]), 3)
    // One bad entry refuses the lot: an income group, another user's group, a group twice, an amount out of range, nothing.
    await assert.rejects(() => budgets.saveBudgets(bulkUser, [{ groupId: null, amount: 1 }, { groupId: bulkSalary, amount: 1 }]), /Không tìm thấy nhóm/)
    await assert.rejects(() => budgets.saveBudgets(bulkUser, [{ groupId: food, amount: 1 }]), /Không tìm thấy nhóm/)
    await assert.rejects(() => budgets.saveBudgets(bulkUser, [{ groupId: bulkFun, amount: 1 }, { groupId: bulkFun, amount: 2 }]), /không hợp lệ/)
    await assert.rejects(() => budgets.saveBudgets(bulkUser, [{ groupId: bulkFun, amount: 0 }]), /không hợp lệ/)
    await assert.rejects(() => budgets.saveBudgets(bulkUser, []), /Chưa có hạn mức/)
    assert.equal(Number((await sql('SELECT amount FROM budgets WHERE user_id = $1 AND category_group_id IS NULL', [bulkUser])).rows[0].amount), 5_000_000)
    assert.equal(Number((await sql('SELECT amount FROM budgets WHERE category_group_id = $1', [bulkFun])).rows[0].amount), 500_000)

    // A limit judges only from the month it was set in.
    assert.equal(limitJudges(null, '2026-10'), false)
    assert.equal(limitJudges('2026-10', '2026-09'), false)
    assert.equal(limitJudges('2026-10', '2026-10'), true)
    assert.equal(limitJudges('2026-09', '2026-10'), true)

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
    assert.equal(calc.remainingLabel(3_420_000, 4_000_000, 16), 'Còn 580k · 36k mỗi ngày')

    console.log('Budget checks passed: what counts as spent, averages, setting and deleting limits, other users, the database checks, alerts once per level, raised limits, several at once, the hint to change a limit, push settings and levels, a month in detail (by day, by category, six months before, the latest, months gone by to their end), the sums.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
