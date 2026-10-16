/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-savings-integration.cjs */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const accounts = require('../lib/accounts/repository.ts')
const savings = require('../lib/savings/repository.ts')
const { parseJarFormData } = require('../lib/savings/validation.ts')
const plan = require('../lib/savings/plan.ts')
const transactions = require('../lib/transactions/repository.ts')
const { toDateKey } = require('../lib/format-date.ts')

const count = async (text, params) => Number((await sql(text, params)).rows[0].count)
const balance = async (id) => Number((await sql('SELECT balance FROM accounts WHERE id = $1', [id])).rows[0].balance)
const form = (fields) => {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, String(value))
  return data
}
const transfer = (amount, fromAccountId, toAccountId) => ({ kind: 'transfer', amount, fee: 0, fromAccountId, toAccountId, occurredAt: new Date() })

async function run() {
  try {
    const userId = await createUser('savings_test')
    const otherId = await createUser('savings_test')
    const bank = (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'Ngân hàng', 'cash', 50000000, 50000000) RETURNING id`, [userId])).rows[0].id
    const cash = (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'Tiền mặt', 'cash', 1000000, 1000000) RETURNING id`, [userId])).rows[0].id
    const group = (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
      VALUES ($1, 'expense', 'Mua sắm', 'shopping-bag', 'pink') RETURNING id`, [userId])).rows[0].id
    const shopping = (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Đồ điện tử', 'smartphone') RETURNING id`, [userId, group])).rows[0].id

    // The form: a name, a known icon, a target above zero, a due month from this one on.
    const thisMonth = toDateKey(new Date()).slice(0, 7)
    const values = parseJarFormData(form({ name: 'Xe máy', icon: 'motorbike', color: 'orange', target: 30_000_000, dueMonth: '2099-12' }))
    assert.deepEqual(values, { name: 'Xe máy', icon: 'motorbike', color: 'orange', target: 30_000_000, due: '2099-12-31' })
    assert.equal(parseJarFormData(form({ name: 'Ti vi', icon: 'tv', color: 'violet', target: 1, dueMonth: thisMonth })).due.slice(0, 7), thisMonth)
    assert.equal(parseJarFormData(form({ name: 'Ti vi', icon: 'tv', color: 'violet', target: 1 })).due, undefined)
    assert.throws(() => parseJarFormData(form({ name: 'X', icon: 'motorbike', color: 'orange', target: 1, dueMonth: '2000-01' })), /từ tháng này/)
    assert.throws(() => parseJarFormData(form({ name: 'X', icon: 'not-an-icon', color: 'orange', target: 1 })), /Biểu tượng/)
    assert.throws(() => parseJarFormData(form({ name: 'X', icon: 'motorbike', color: 'gold', target: 1 })), /Màu/)
    assert.throws(() => parseJarFormData(form({ name: 'X', icon: 'motorbike', color: 'orange', target: 0 })), /Mục tiêu/)
    assert.throws(() => parseJarFormData(form({ name: '  ', icon: 'motorbike', color: 'orange', target: 1 })), /tên hũ/)
    // Editing an overdue jar keeps its passed due month; only a new one must be from this month on.
    assert.equal(parseJarFormData(form({ name: 'X', icon: 'motorbike', color: 'orange', target: 1, dueMonth: '2000-01' }), '2000-01-31').due, '2000-01-31')
    assert.throws(() => parseJarFormData(form({ name: 'X', icon: 'motorbike', color: 'orange', target: 1, dueMonth: '2000-02' }), '2000-01-31'), /từ tháng này/)

    // A retried "new jar" adds one, empty, and it reads back with its goal.
    const jar = randomUUID()
    await savings.createJar(userId, values, jar)
    await savings.createJar(userId, values, jar)
    await assert.rejects(() => savings.createJar(otherId, values, jar))
    assert.equal(await count("SELECT count(*) FROM accounts WHERE user_id = $1 AND type = 'savings'", [userId]), 1)
    let read = (await accounts.getAccounts(userId)).find((account) => account.id === jar)
    assert.equal(read.type, 'savings')
    assert.equal(read.balance, 0)
    assert.deepEqual(read.goal, { target: 30_000_000, icon: 'motorbike', color: 'orange', due: '2099-12-31' })

    // Edited: its name and goal change; another user's jar is not found.
    await savings.updateJar(userId, jar, { name: 'Xe tay ga', icon: 'motorbike', color: 'orange', target: 32_000_000 })
    await assert.rejects(() => savings.updateJar(otherId, jar, values), /Không tìm thấy hũ/)
    await assert.rejects(() => savings.updateJar(userId, bank, values), /Không tìm thấy hũ/)
    read = (await accounts.getAccounts(userId)).find((account) => account.id === jar)
    assert.equal(read.name, 'Xe tay ga')
    assert.equal(read.goal.target, 32_000_000)
    assert.equal(read.goal.due, undefined)
    await savings.updateJar(userId, jar, values)

    // In and out are transfers between the jar and an account.
    await transactions.createTransaction(userId, transfer(20_000_000, bank, jar), randomUUID())
    await transactions.createTransaction(userId, transfer(1_000_000, jar, cash), randomUUID())
    assert.equal(await balance(jar), 19_000_000)
    assert.equal(await balance(bank), 30_000_000)
    assert.equal(await balance(cash), 2_000_000)
    // A jar never goes below zero: no more out of it than it holds, nor a move in undone that it has spent.
    await assert.rejects(() => transactions.createTransaction(userId, transfer(19_000_001, jar, cash), randomUUID()), /chỉ còn 19\.000\.000/)
    const smallIn = randomUUID()
    await transactions.createTransaction(userId, transfer(500_000, bank, jar), smallIn)
    await transactions.createTransaction(userId, transfer(19_500_000, jar, cash), randomUUID())
    await assert.rejects(() => transactions.deleteTransaction(userId, smallIn), /không đủ/)
    await transactions.createTransaction(userId, transfer(19_500_000, cash, jar), randomUUID())
    await transactions.deleteTransaction(userId, smallIn)
    assert.equal(await balance(jar), 19_000_000)
    assert.equal(await balance(cash), 2_000_000)
    await savings.assertOpenJar(userId, jar)
    await assert.rejects(() => savings.assertOpenJar(userId, bank), /Không tìm thấy hũ/)

    // The plan: what is left, spread over the months to the due one, this one included.
    read = (await accounts.getAccounts(userId)).find((account) => account.id === jar)
    assert.equal(plan.amountLeft(read), 11_000_000)
    assert.equal(plan.monthsLeft('2026-12-31', '2026-10-14'), 3)
    assert.equal(plan.monthsLeft('2026-10-31', '2026-10-14'), 1)
    assert.equal(plan.monthsLeft('2026-09-30', '2026-10-14'), 1)
    assert.equal(plan.monthlyAmount({ balance: 18_000_000, goal: { target: 30_000_000, icon: 'motorbike', color: 'orange', due: '2026-12-31' } }, '2026-10-14'), 4_000_000)
    assert.equal(plan.monthlyAmount({ balance: 0, goal: { target: 1_000_000, icon: 'motorbike', color: 'orange', due: '2026-12-31' } }, '2026-10-14'), 340_000)
    // Rounded to the amount's own scale: 500k over 15 months is 34k a month, not 100k.
    assert.equal(plan.monthlyAmount({ balance: 0, goal: { target: 500_000, icon: 'motorbike', color: 'orange', due: '2027-12-31' } }, '2026-10-14'), 34_000)
    assert.equal(plan.monthlyAmount({ balance: 0, goal: { target: 30, icon: 'motorbike', color: 'orange', due: '2026-12-31' } }, '2026-10-14'), 30)
    assert.equal(plan.jarPlanLabel({ balance: 5, goal: { target: 5, icon: 'motorbike', color: 'orange' } }, '2026-10-14'), 'Đủ tiền rồi')
    // Overdue: no monthly amount, said so.
    const overdue = { balance: 0, goal: { target: 2_000_000, icon: 'motorbike', color: 'orange', due: '2026-08-31' } }
    assert.equal(plan.monthlyAmount(overdue, '2026-10-14'), null)
    assert.equal(plan.jarPlanLabel(overdue, '2026-10-14'), 'Quá hạn · còn thiếu 2tr')
    assert.equal(plan.dueLeftLabel('2026-08-31', '2026-10-14'), 'đã quá hạn')
    assert.equal(plan.dueLeftLabel('2026-12-31', '2026-10-14'), 'còn 3 tháng')

    // Bought for less: the price spent from the jar, the rest back to an account, the jar finished.
    // Not bought before the last move in or out of it.
    const early = { kind: 'expense', amount: 17_500_000, accountId: jar, categoryId: shopping, occurredAt: new Date(Date.now() - 86_400_000) }
    await assert.rejects(() => savings.buyWithJar(userId, jar, early, cash, randomUUID()), /Ngày mua không được trước/)
    const cheaper = { kind: 'expense', amount: 17_500_000, accountId: jar, categoryId: shopping, occurredAt: new Date() }
    await assert.rejects(() => savings.buyWithJar(userId, jar, cheaper, undefined, randomUUID()), /nhận phần thừa/)
    const bought = randomUUID()
    await savings.buyWithJar(userId, jar, cheaper, cash, bought)
    await savings.buyWithJar(userId, jar, cheaper, cash, bought)
    assert.equal(await balance(jar), 0)
    assert.equal(await balance(cash), 3_500_000)
    assert.equal(await count('SELECT count(*) FROM transactions WHERE account_id = $1 AND kind = $2', [jar, 'expense']), 1)
    const finished = (await sql('SELECT status, completed_at FROM accounts WHERE id = $1', [jar])).rows[0]
    assert.equal(finished.status, 'archived')
    // Finished on the day it was bought, not the day it was written down.
    assert.equal(finished.completed_at.getTime(), cheaper.occurredAt.getTime())
    await assert.rejects(() => savings.buyWithJar(userId, jar, cheaper, cash, randomUUID()), /đã hoàn thành/)
    await assert.rejects(() => savings.assertOpenJar(userId, jar), /đã hoàn thành/)
    // Finished, only its name changes; its goal stays what it was.
    await savings.updateJar(userId, jar, { name: 'Xe đã mua', icon: 'gift', color: 'rose', target: 1 })
    read = (await accounts.getAccounts(userId)).find((account) => account.id === jar)
    assert.equal(read.name, 'Xe đã mua')
    assert.deepEqual([read.goal.icon, read.goal.color, read.goal.target, read.goal.due], ['motorbike', 'orange', 30_000_000, '2099-12-31'])
    // Its moves can no longer change while it is finished (archived).
    await assert.rejects(() => transactions.createTransaction(userId, transfer(1, bank, jar), randomUUID()))

    // Deleted: every move undone, the purchase too, so the accounts are as before it.
    // The cash account it paid the rest into is locked meanwhile: the money still goes back.
    await sql("UPDATE accounts SET status = 'archived' WHERE id = $1", [cash])
    await savings.deleteJar(userId, jar)
    await sql("UPDATE accounts SET status = 'active' WHERE id = $1", [cash])
    assert.equal(await count('SELECT count(*) FROM accounts WHERE id = $1', [jar]), 0)
    assert.equal(await count('SELECT count(*) FROM transactions WHERE account_id = $1 OR from_account_id = $1 OR to_account_id = $1', [jar]), 0)
    assert.equal(await balance(bank), 50_000_000)
    assert.equal(await balance(cash), 1_000_000)
    await savings.deleteJar(userId, jar)

    // Bought for more: what is missing comes from the account first; exactly: nothing moves.
    const phone = randomUUID()
    await savings.createJar(userId, { name: 'Điện thoại', icon: 'smartphone', color: 'blue', target: 10_000_000 }, phone)
    await transactions.createTransaction(userId, transfer(10_000_000, bank, phone), randomUUID())
    await assert.rejects(
      () => savings.buyWithJar(userId, phone, { ...cheaper, amount: 12_000_000, accountId: phone, occurredAt: new Date() }, undefined, randomUUID()),
      /trả phần thiếu/,
    )
    await savings.buyWithJar(userId, phone, { ...cheaper, amount: 12_000_000, accountId: phone, occurredAt: new Date() }, bank, randomUUID())
    assert.equal(await balance(phone), 0)
    assert.equal(await balance(bank), 38_000_000)
    const tv = randomUUID()
    await savings.createJar(userId, { name: 'Ti vi', icon: 'tv', color: 'violet', target: 5_000_000 }, tv)
    await transactions.createTransaction(userId, transfer(5_000_000, bank, tv), randomUUID())
    await savings.buyWithJar(userId, tv, { ...cheaper, amount: 5_000_000, accountId: tv, occurredAt: new Date() }, undefined, randomUUID())
    assert.equal(await balance(tv), 0)
    assert.equal(await count('SELECT count(*) FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [tv]), 1)

    // A jar a loan went into cannot be deleted, as that would change the loan.
    const laptop = randomUUID()
    await savings.createJar(userId, { name: 'Laptop', icon: 'laptop', color: 'slate', target: 20_000_000 }, laptop)
    const contact = (await sql('INSERT INTO contacts (user_id, name, initials) VALUES ($1, $2, $3) RETURNING id', [userId, 'An', 'A'])).rows[0].id
    await sql(`INSERT INTO debts (user_id, contact_id, direction, account_id, amount, recorded_at)
      VALUES ($1, $2, 'borrowed', $3, 1000000, current_date)`, [userId, contact, laptop])
    await assert.rejects(() => savings.deleteJar(userId, laptop), /vay nợ/)
    assert.equal(await count('SELECT count(*) FROM accounts WHERE id = $1', [laptop]), 1)

    // The database keeps a jar's goal to jars, and every jar with one.
    await assert.rejects(() => sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'Hũ', 'savings', 0, 0)`, [userId]))
    // A jar has a colour as well as an icon.
    await assert.rejects(() => sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance, goal_target, goal_icon)
      VALUES ($1, 'Hũ', 'savings', 0, 0, 1, 'gift')`, [userId]))
    await assert.rejects(() => sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance, goal_target, goal_icon)
      VALUES ($1, 'Ví', 'cash', 0, 0, 1, 'bike')`, [userId]))

    console.log('Savings checks passed: the form, request ids, editing, in and out, the plan, bought for less, more and exactly, finished jars, deleting, loans, the database checks.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
