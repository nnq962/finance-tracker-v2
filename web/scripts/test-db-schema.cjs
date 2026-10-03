/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness. */
/*
 * Checks the Postgres schema's guarantees against the finance_test database,
 * connected as the app role. Everything runs in one transaction that is
 * rolled back, so no data is left behind.
 *
 * Run: npm run db:up && node scripts/test-db-schema.cjs
 */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const pg = require('pg')

require('@next/env').loadEnvConfig(process.cwd())

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Run `npm run db:up` first.')
}

const url = new URL(process.env.DATABASE_URL)
url.pathname = '/finance_test'
const client = new pg.Client({ connectionString: url.toString() })

let savepoint = 0
async function rejects(sql, params, code, label) {
  const name = `check_${++savepoint}`
  await client.query(`SAVEPOINT ${name}`)
  try {
    await client.query(sql, params)
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`)
    assert.equal(error.code, code, `${label}: expected ${code}, got ${error.code} (${error.message})`)
    return
  }
  throw new Error(`${label}: expected the database to reject it`)
}

const CHECK = '23514'
const FOREIGN_KEY = '23503'
const PERMISSION = '42501'

async function run() {
  await client.connect()
  await client.query('BEGIN')
  // Cross-table keys are deferred to commit; check them per statement here so
  // each rejected case fails where it happens.
  await client.query('SET CONSTRAINTS ALL IMMEDIATE')
  try {
    const alice = `test_${randomUUID()}`
    const bob = `test_${randomUUID()}`
    await client.query('INSERT INTO users (id) VALUES ($1), ($2)', [alice, bob])

    const account = async (userId, balance = 1000) => (await client.query(
      `INSERT INTO accounts (user_id, name, type, opening_balance, balance)
       VALUES ($1, 'Ví', 'cash', $2, $2) RETURNING id`, [userId, balance])).rows[0].id
    const aliceCash = await account(alice)
    const aliceSaving = await account(alice)
    const bobCash = await account(bob)

    const group = async (userId, type) => (await client.query(
      `INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
       VALUES ($1, $2, 'Nhóm', 'receipt', 'orange') RETURNING id`, [userId, type])).rows[0].id
    const item = async (userId, groupId, type) => (await client.query(
      `INSERT INTO category_items (user_id, group_id, type, name, icon_name)
       VALUES ($1, $2, $3, 'Mục', 'receipt') RETURNING id`, [userId, groupId, type])).rows[0].id
    const foodGroup = await group(alice, 'expense')
    const food = await item(alice, foodGroup, 'expense')
    const salary = await item(alice, await group(alice, 'income'), 'income')
    const bobFood = await item(bob, await group(bob, 'expense'), 'expense')

    // Money and accounts
    // A balance may go below zero, as far as it may go above.
    await client.query(`UPDATE accounts SET balance = -1 WHERE id = $1`, [aliceCash])
    await rejects(`UPDATE accounts SET balance = -1000000000000000 WHERE id = $1`, [aliceCash], CHECK, 'balance below the floor')
    await rejects(`UPDATE accounts SET balance = 1000000000000000 WHERE id = $1`, [aliceCash], CHECK, 'balance above the ceiling')
    await rejects(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'VCB', 'bank', 0, 0)`, [alice], CHECK, 'bank account without institution')
    const big = (await client.query(`UPDATE accounts SET balance = 999999999999999 WHERE id = $1 RETURNING balance`, [aliceCash])).rows[0].balance
    assert.equal(big, '999999999999999', 'bigint round-trips exactly')

    // Transactions
    const insertTransaction = `INSERT INTO transactions
      (user_id, kind, amount, fee, account_id, category_item_id, from_account_id, to_account_id, occurred_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`
    await client.query(insertTransaction, [alice, 'expense', 500, 0, aliceCash, food, null, null])
    await client.query(insertTransaction, [alice, 'transfer', 500, 10, null, null, aliceCash, aliceSaving])
    await rejects(insertTransaction, [alice, 'expense', 500, 0, aliceCash, salary, null, null], FOREIGN_KEY, 'expense with an income category')
    await rejects(insertTransaction, [alice, 'expense', 500, 0, aliceCash, null, null, null], CHECK, 'expense without category or loan')
    await rejects(insertTransaction, [alice, 'expense', 0, 0, aliceCash, food, null, null], CHECK, 'zero amount')
    await rejects(insertTransaction, [alice, 'expense', 500, 10, aliceCash, food, null, null], CHECK, 'fee on an expense')
    await rejects(insertTransaction, [alice, 'transfer', 500, 0, null, null, aliceCash, aliceCash], CHECK, 'transfer to the same account')

    // Ownership: rows can only reference the same user's data
    await rejects(insertTransaction, [bob, 'expense', 500, 0, aliceCash, bobFood, null, null], FOREIGN_KEY, "another user's account")
    await rejects(insertTransaction, [bob, 'expense', 500, 0, bobCash, food, null, null], FOREIGN_KEY, "another user's category")
    await rejects(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Mục', 'receipt')`, [bob, foodGroup], FOREIGN_KEY, "item in another user's group")
    await rejects(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'income', 'Mục', 'receipt')`, [alice, foodGroup], FOREIGN_KEY, 'item type differs from its group')

    // Debts
    const contact = (await client.query(`INSERT INTO contacts (user_id, name, initials)
      VALUES ($1, 'An', 'A') RETURNING id`, [alice])).rows[0].id
    const insertDebt = `INSERT INTO debts (user_id, contact_id, direction, recording_mode, account_id, amount, interest_rate, interest_period, note, recorded_at)
      VALUES ($1, $2, 'lent', $3, $4, 1000, $5, $6, 'Cho vay', current_date) RETURNING id`
    await client.query(insertDebt, [alice, contact, 'opening', null, null, null])
    const debt = (await client.query(insertDebt, [alice, contact, 'cash-flow', aliceCash, 1.5, 'month'])).rows[0].id
    await rejects(insertDebt, [alice, contact, 'cash-flow', null, null, null], CHECK, 'cash-flow loan without account')
    await rejects(insertDebt, [alice, contact, 'opening', null, 1.5, null], CHECK, 'interest rate without period')
    await client.query(`INSERT INTO transactions (user_id, kind, amount, account_id, debt_id, occurred_at)
      VALUES ($1, 'expense', 1000, $2, $3, now())`, [alice, aliceCash, debt])
    await rejects(`INSERT INTO transactions (user_id, kind, amount, account_id, category_item_id, debt_id, occurred_at)
      VALUES ($1, 'expense', 1000, $2, $3, $4, now())`, [alice, aliceCash, food, debt], CHECK, 'loan movement with a category')
    await rejects(`DELETE FROM contacts WHERE id = $1`, [contact], FOREIGN_KEY, 'contact with debt history')
    await client.query(`INSERT INTO debt_payments (user_id, debt_id, account_id, amount, paid_at, paid_time)
      VALUES ($1, $2, $3, 100, current_date, '09:30')`, [alice, debt, aliceCash])
    await client.query(`DELETE FROM debts WHERE id = $1`, [debt])
    const leftovers = await client.query(`SELECT
      (SELECT count(*) FROM debt_payments WHERE debt_id = $1) AS payments,
      (SELECT count(*) FROM transactions WHERE debt_id = $1) AS movements`, [debt])
    assert.deepEqual(leftovers.rows[0], { payments: '0', movements: '0' }, 'deleting a debt removes its payments and movement')

    // updated_at is maintained by the trigger, even if a stale value is written
    await client.query(`UPDATE accounts SET name = 'Tiết kiệm', updated_at = '2000-01-01' WHERE id = $1`, [aliceSaving])
    const touched = (await client.query(`SELECT updated_at = now() AS current FROM accounts WHERE id = $1`, [aliceSaving])).rows[0]
    assert.equal(touched.current, true, 'trigger sets updated_at on update')

    // Deleting a user removes everything they own, payments included
    const keptDebt = (await client.query(insertDebt, [alice, contact, 'cash-flow', aliceCash, null, null])).rows[0].id
    await client.query(`INSERT INTO debt_payments (user_id, debt_id, account_id, amount, paid_at, paid_time)
      VALUES ($1, $2, $3, 100, current_date, '09:30')`, [alice, keptDebt, aliceSaving])
    // As in a real commit: deferred keys are checked once the cascade is done.
    await client.query('SET CONSTRAINTS ALL DEFERRED')
    await client.query(`DELETE FROM users WHERE id = $1`, [alice])
    await client.query('SET CONSTRAINTS ALL IMMEDIATE')
    const remaining = await client.query(`SELECT
      (SELECT count(*) FROM accounts WHERE user_id = $1) +
      (SELECT count(*) FROM transactions WHERE user_id = $1) +
      (SELECT count(*) FROM category_items WHERE user_id = $1) +
      (SELECT count(*) FROM debts WHERE user_id = $1) AS total`, [alice])
    assert.equal(remaining.rows[0].total, '0', 'user deletion cascades')

    // The app role cannot change the schema
    await rejects(`CREATE TABLE app_should_not_create (id int)`, [], PERMISSION, 'app role creating a table')
    await rejects(`DROP TABLE accounts`, [], PERMISSION, 'app role dropping a table')
    await rejects(`DELETE FROM dbmate.schema_migrations`, [], PERMISSION, 'app role touching migration history')

    console.log('Database schema checks passed.')
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
