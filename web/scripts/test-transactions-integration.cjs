/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-transactions-integration.cjs */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const accounts = require('../lib/accounts/repository.ts')
const transactions = require('../lib/transactions/repository.ts')

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

    console.log('Transaction checks passed: request ids, balances, recent per account.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
