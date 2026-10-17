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
const { isLeftOut } = require('../lib/transactions/types.ts')
const suggested = require('../lib/categories/suggested.ts')
const { filterTransactions } = require('../app/(main)/transactions/_lib/filter-transactions.ts')
const { amountPresets } = require('../app/(main)/transactions/_lib/amount-presets.ts')

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
    assert.throws(() => accountValidation.parseAccountFormData(accountForm({ date: toDateKey(new Date(Date.now() + 86_400_000)) })), /trong tương lai/)
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000)
    const vietnamTime = (date) => date.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    // Only while two hours on is still today in Vietnam.
    if (toDateKey(inTwoHours) === toDateKey(new Date())) {
      assert.throws(() => accountValidation.parseAccountFormData(accountForm({ date: toDateKey(inTwoHours), time: vietnamTime(inTwoHours) })), /trong tương lai/)
    }
    const opened = randomUUID()
    await accounts.createAccount(userId, { name: 'Mở cũ', type: 'cash', balance: 0, openedAt: new Date('2026-01-05T01:30:00Z') }, opened)
    assert.equal((await accounts.getAccounts(userId)).find((item) => item.id === opened).openedAt, '2026-01-05T01:30:00.000Z')

    // Dates run from 2000 through today in Vietnam time.
    const form = (date) => {
      const data = new FormData()
      for (const [key, value] of Object.entries({ kind: 'expense', amount: '1000', accountId: wallet, categoryId: meal, date, time: '00:00' })) data.set(key, value)
      return data
    }
    const today = toDateKey(new Date())
    const tomorrow = toDateKey(new Date(Date.now() + 86_400_000))
    assert.equal(toDateKey(validation.parseTransactionFormData(form(today)).occurredAt), today)
    assert.throws(() => validation.parseTransactionFormData(form(tomorrow)), /trong tương lai/)
    assert.throws(() => validation.parseTransactionFormData(form('1999-12-31')), /năm 2000/)

    // Left out of the figures: the form's switch is read, the balance still
    // moves, and it can be switched later without touching the balance.
    const excludedForm = form(today)
    excludedForm.set('excluded', 'on')
    assert.equal(validation.parseTransactionFormData(excludedForm).excluded, true)
    assert.equal(validation.parseTransactionFormData(form(today)).excluded, false)
    const before = await balance(wallet)
    const left = randomUUID()
    await transactions.createTransaction(userId, { ...expense, amount: 7_000, excluded: true }, left)
    assert.equal(await balance(wallet), before - 7_000)
    const stored = async () => (await sql('SELECT excluded FROM transactions WHERE id = $1', [left])).rows[0].excluded
    assert.equal(await stored(), true)
    await transactions.setTransactionExcluded(userId, left, false)
    assert.equal(await stored(), false)
    assert.equal(await balance(wallet), before - 7_000)
    await assert.rejects(() => transactions.setTransactionExcluded(otherId, left, true))
    // A transfer is never left out.
    await assert.rejects(() => sql(`INSERT INTO transactions (user_id, kind, amount, from_account_id, to_account_id, occurred_at, excluded)
      VALUES ($1, 'transfer', 1000, $2, $3, now(), true)`, [userId, wallet, bank]))

    // An account left out of the figures: the form's switch is read, and its
    // transactions come back left out with it while their own choice is kept.
    assert.equal(accountValidation.parseAccountFormData(accountForm({})).excluded, false)
    assert.equal(accountValidation.parseAccountFormData(accountForm({ excluded: 'on' })).excluded, true)
    await sql('UPDATE accounts SET excluded = true WHERE id = $1', [wallet])
    assert.equal((await accounts.getAccounts(userId)).find((account) => account.id === wallet).excluded, true)
    const inWallet = (await transactions.getTransactions(userId)).filter((row) => row.accountId === wallet)
    assert.ok(inWallet.length > 0 && inWallet.every((row) => isLeftOut(row) && row.accountExcluded === true))
    assert.ok(inWallet.some((row) => !row.excluded))
    await sql('UPDATE accounts SET excluded = false WHERE id = $1', [wallet])
    assert.ok((await transactions.getTransactions(userId)).some((row) => row.accountId === wallet && !isLeftOut(row)))

    // An archived account's balance stays as it was left: no amount change or
    // delete moves it, while a note may still change.
    const kept = randomUUID()
    await transactions.createTransaction(userId, { ...expense, amount: 3_000 }, kept)
    await sql("UPDATE accounts SET status = 'archived' WHERE id = $1", [wallet])
    const archivedBalance = await balance(wallet)
    await assert.rejects(() => transactions.updateTransaction(userId, kept, { ...expense, amount: 4_000 }))
    await assert.rejects(() => transactions.deleteTransaction(userId, kept))
    await transactions.updateTransaction(userId, kept, { ...expense, amount: 3_000, note: 'Ghi chú' })
    assert.equal(await balance(wallet), archivedBalance)
    await sql("UPDATE accounts SET status = 'active' WHERE id = $1", [wallet])

    // Deleting twice (a retried request) succeeds; a retried add after the
    // account was archived finds the row it saved; a time later today is refused.
    await transactions.deleteTransaction(userId, kept)
    await transactions.deleteTransaction(userId, kept)
    const retried = randomUUID()
    await transactions.createTransaction(userId, { ...expense, amount: 1_000 }, retried)
    await sql("UPDATE accounts SET status = 'archived' WHERE id = $1", [wallet])
    await transactions.createTransaction(userId, { ...expense, amount: 1_000 }, retried)
    await sql("UPDATE accounts SET status = 'active' WHERE id = $1", [wallet])
    const later = form(today)
    later.set('time', '23:59')
    if (new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }) < '23:58') assert.throws(() => validation.parseTransactionFormData(later))

    // Several saved at once (told to the assistant together): all or none,
    // each under its request id, so saving the batch again adds nothing;
    // undone at once too.
    const beforeBatch = await balance(wallet)
    const batch = [randomUUID(), randomUUID()]
    const batchItems = [
      { values: { ...expense, amount: 2_000 }, requestId: batch[0] },
      { values: { kind: 'transfer', amount: 1_000, fee: 100, fromAccountId: wallet, toAccountId: bank, occurredAt: new Date() }, requestId: batch[1] },
    ]
    await transactions.createTransactions(userId, batchItems)
    await transactions.createTransactions(userId, batchItems)
    assert.equal(await count('SELECT count(*) FROM transactions WHERE id = ANY($1)', [batch]), 2)
    assert.equal(await balance(wallet), beforeBatch - 2_000 - 1_100)
    const broken = randomUUID()
    await assert.rejects(() => transactions.createTransactions(userId, [
      { values: { ...expense, amount: 3_000 }, requestId: broken },
      { values: { ...expense, accountId: randomUUID() }, requestId: randomUUID() },
    ]))
    assert.equal(await count('SELECT count(*) FROM transactions WHERE id = $1', [broken]), 0)
    await transactions.deleteTransactions(userId, batch)
    await transactions.deleteTransactions(userId, batch)
    assert.equal(await balance(wallet), beforeBatch)
    // Who saved last, for what the assistant fills in unsaid.
    const last = await transactions.getLastAccountIds(userId)
    assert.equal(last.expense, wallet)

    // A suggested category is made in the group named, or a new group with
    // the icon suggested; one the user has under that name is used instead.
    const suggestedMade = await suggested.createSuggestedCategory(userId, { type: 'expense', name: 'Kem', groupId: group, groupName: 'Ăn uống', iconName: 'ice-cream-cone' })
    assert.equal(suggestedMade.createdItem, true)
    assert.equal((await sql('SELECT icon_name FROM category_items WHERE id = $1', [suggestedMade.itemId])).rows[0].icon_name, 'ice-cream-cone')
    assert.equal((await suggested.createSuggestedCategory(userId, { type: 'expense', name: 'kem', groupName: 'Khác' })).itemId, suggestedMade.itemId)
    const withGroup = await suggested.createSuggestedCategory(userId, { type: 'expense', name: 'Xem phim', groupName: 'Giải trí', iconName: 'film' })
    assert.ok(withGroup.createdGroupId)
    assert.equal((await sql('SELECT icon_name FROM category_groups WHERE id = $1', [withGroup.createdGroupId])).rows[0].icon_name, 'film')

    // The search reads what a row shows, never its id: a few hex digits find nothing.
    const listed = await transactions.getTransactions(userId)
    const noFilters = { query: '', minAmount: null, maxAmount: null, accountIds: [], categoryGroupIds: [] }
    assert.ok(listed.length > 3)
    assert.equal(filterTransactions(listed, 'all', { ...noFilters, query: listed[0].id.slice(0, 8) }).length, 0)
    assert.ok(filterTransactions(listed, 'all', { ...noFilters, query: 'an trua' }).length > 0)
    // The amount presets meet without overlapping: 100k and 1tr each fall in one.
    for (const amount of [99_999, 100_000, 1_000_000, 1_000_001]) {
      const row = { ...listed[0], amount: -amount }
      const hits = amountPresets.filter((preset) => preset.key !== 'any' &&
        filterTransactions([row], 'all', { ...noFilters, minAmount: preset.min, maxAmount: preset.max }).length === 1)
      assert.equal(hits.length, 1, `${amount} falls in ${hits.length} presets`)
    }

    console.log('Transaction checks passed: request ids, balances, negative balances, recent per account, date range, left out of the figures, accounts left out, archived accounts kept, batches, suggested categories, search and amount presets.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
