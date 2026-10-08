/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-transactions-integration.cjs */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const accounts = require('../lib/accounts/repository.ts')
const transactions = require('../lib/transactions/repository.ts')
const validation = require('../lib/transactions/validation.ts')
const accountValidation = require('../lib/accounts/validation.ts')
const { toDateKey } = require('../lib/format-date.ts')

const count = async (text, params) => Number((await sql(text, params)).rows[0].count)
const balance = async (id) => Number((await sql('SELECT balance FROM accounts WHERE id = $1', [id])).rows[0].balance)

async function run() {
  try {
    const userId = await createUser('transaction_test')
    const otherId = await createUser('transaction_test')

    // A retried "add account" request adds one account.
    const accountRequest = randomUUID()
    const values = { name: 'Ví', type: 'cash', balance: 100_000 }
    await accounts.createAccount(userId, values, accountRequest)
    await accounts.createAccount(userId, values, accountRequest)
    assert.equal(await count('SELECT count(*) FROM accounts WHERE user_id = $1', [userId]), 1)
    await assert.rejects(() => accounts.createAccount(otherId, values, accountRequest))
    const wallet = accountRequest
    const bank = (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'Ngân hàng', 'cash', 0, 0) RETURNING id`, [userId])).rows[0].id

    const group = (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
      VALUES ($1, 'expense', 'Ăn uống', 'utensils', 'orange') RETURNING id`, [userId])).rows[0].id
    const meal = (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Ăn trưa', 'soup') RETURNING id`, [userId, group])).rows[0].id

    // A retried or doubled "add transaction" request records it and moves the
    // balance once, also when both copies arrive together.
    const expense = { kind: 'expense', amount: 10_000, accountId: wallet, categoryId: meal, occurredAt: new Date() }
    const request = randomUUID()
    await transactions.createTransaction(userId, expense, request)
    await transactions.createTransaction(userId, expense, request)
    const together = randomUUID()
    await Promise.all([1, 2, 3].map(() => transactions.createTransaction(userId, expense, together)))
    assert.equal(await count('SELECT count(*) FROM transactions WHERE user_id = $1', [userId]), 2)
    assert.equal(await balance(wallet), 80_000)
    await assert.rejects(() => transactions.createTransaction(otherId, expense, request))
    // Without a request id each call is its own transaction.
    await transactions.createTransaction(userId, expense)
    assert.equal(await balance(wallet), 70_000)

    // Recent transactions per account: newest first, at most five, and a
    // transfer listed under both of its accounts.
    for (let minutes = 1; minutes <= 4; minutes++) {
      await transactions.createTransaction(userId, {
        ...expense,
        amount: 1_000,
        occurredAt: new Date(Date.now() - minutes * 60_000),
      })
    }
    await transactions.createTransaction(userId, {
      kind: 'transfer', amount: 5_000, fee: 0, fromAccountId: wallet, toAccountId: bank,
      occurredAt: new Date(Date.now() + 60_000),
    })
    const recent = await transactions.getRecentTransactionsByAccount(userId)
    assert.equal(recent[wallet].length, 5)
    assert.equal(recent[wallet][0].kind, 'transfer')
    assert.deepEqual(recent[bank].map((item) => item.kind), ['transfer'])
    const times = recent[wallet].map((item) => item.occurredAt)
    assert.deepEqual([...times].sort().reverse(), times)
    assert.deepEqual(await transactions.getRecentTransactionsByAccount(otherId), {})

    // Spending more than an account holds takes it below zero.
    assert.equal(await balance(bank), 5_000)
    await transactions.createTransaction(userId, { ...expense, amount: 20_000, accountId: bank })
    assert.equal(await balance(bank), -15_000)
    await transactions.createTransaction(userId, {
      kind: 'transfer', amount: 15_000, fee: 0, fromAccountId: wallet, toAccountId: bank, occurredAt: new Date(),
    })
    assert.equal(await balance(bank), 0)
    // The account form sends a signed balance.
    const accountForm = (fields) => {
      const data = new FormData()
      for (const [key, value] of Object.entries({ name: 'Thẻ', type: 'cash', balance: '50000', date: '2026-01-05', time: '08:30', ...fields })) data.set(key, value)
      return data
    }
    assert.equal(accountValidation.parseAccountFormData(accountForm({ balance: '-50000' })).balance, -50_000)
    assert.equal(accountValidation.parseAccountFormData(accountForm({})).balance, 50_000)
    assert.equal(accountValidation.parseExpectedBalance(accountForm({ expectedBalance: '-50000' })), -50_000)
    assert.throws(() => accountValidation.parseAccountFormData(accountForm({ balance: '-1000000000000000' })))
    // The opening time is read in Vietnam time and cannot be after now, also later today.
    assert.equal(accountValidation.parseAccountFormData(accountForm({})).openedAt.toISOString(), '2026-01-05T01:30:00.000Z')
    assert.throws(() => accountValidation.parseAccountFormData(accountForm({ date: toDateKey(new Date(Date.now() + 86_400_000)) })), /sau bây giờ/)
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000)
    const vietnamTime = (date) => date.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    // Only while two hours on is still today in Vietnam.
    if (toDateKey(inTwoHours) === toDateKey(new Date())) {
      assert.throws(() => accountValidation.parseAccountFormData(accountForm({ date: toDateKey(inTwoHours), time: vietnamTime(inTwoHours) })), /sau bây giờ/)
    }
    const opened = randomUUID()
    await accounts.createAccount(userId, { name: 'Mở cũ', type: 'cash', balance: 0, openedAt: new Date('2026-01-05T01:30:00Z') }, opened)
    assert.equal((await accounts.getAccounts(userId)).find((item) => item.id === opened).openedAt, '2026-01-05T01:30:00.000Z')

    // Dates run from 2000 through today in Vietnam time.
    const form = (date) => {
      const data = new FormData()
      for (const [key, value] of Object.entries({ kind: 'expense', amount: '1000', accountId: wallet, categoryId: meal, date, time: '23:59' })) data.set(key, value)
      return data
    }
    const today = toDateKey(new Date())
    const tomorrow = toDateKey(new Date(Date.now() + 86_400_000))
    assert.equal(toDateKey(validation.parseTransactionFormData(form(today)).occurredAt), today)
    assert.throws(() => validation.parseTransactionFormData(form(tomorrow)), /sau hôm nay/)
    assert.throws(() => validation.parseTransactionFormData(form('1999-12-31')), /năm 2000/)

    console.log('Transaction checks passed: request ids, balances, negative balances, recent per account, date range.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
