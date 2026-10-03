/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness installs the TypeScript loader before loading server modules. */
/* Run: npm run db:up && node scripts/test-debts-integration.cjs
 * Runs against the finance_test database with isolated users removed afterwards.
 */
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const repository = require('../lib/debts/repository.ts')
const { getTransactions, getTransactionsInRange, createTransaction, updateTransaction, deleteTransaction } = require('../lib/transactions/repository.ts')
const { deleteAccount, updateAccount } = require('../lib/accounts/repository.ts')
const { todayDate, getPaymentMetrics } = require('../lib/debts/calculations.ts')
const { getDaysUntilDue, getDebtDeadline } = require('../app/(main)/debts/_lib/debt-presentation.ts')
let uid
let otherUid
let checks = 0
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++ }
const rejects = async (fn) => { await assert.rejects(fn); checks++ }
// Tests name accounts by letter; acc maps each letter to its uuid.
const acc = {}
const addAccount = async (key, amount) => {
  acc[key] = (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
    VALUES ($1, $2, 'cash', $3, $3) RETURNING id`, [uid, key, amount])).rows[0].id
}
const setAccount = (key, column, value) => sql(`UPDATE accounts SET ${column} = $2 WHERE id = $1`, [acc[key], value])
const balance = async (key) => Number((await sql('SELECT balance FROM accounts WHERE id = $1', [acc[key]])).rows[0].balance)
const count = async (table, column, value) => Number((await sql(`SELECT count(*) FROM ${table} WHERE ${column} = $1`, [value])).rows[0].count)
const movementId = async (debtId) => (await getTransactions(uid)).find((item) => item.debtId === debtId).id
async function run() {
  try {
    const nativeDate = Date
    const previousTimezone = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    global.Date = class extends nativeDate {
      constructor(...args) { super(...(args.length ? args : ['2026-09-23T00:30:00+07:00'])) }
      static now() { return nativeDate.parse('2026-09-23T00:30:00+07:00') }
    }
    try {
      equal(getDaysUntilDue('2026-09-23'), 0)
      equal(getDebtDeadline({status:'active', dueAt:'2026-09-23'}).label, 'Đến hạn hôm nay')
    } finally {
      global.Date = nativeDate
      if (previousTimezone === undefined) delete process.env.TZ
      else process.env.TZ = previousTimezone
    }
    uid = await createUser('debt_test')
    otherUid = await createUser('debt_test')
    for (const id of ['a', 'b']) await addAccount(id, 10000000)
    equal((await repository.getContacts(uid)).length, 0)
    equal((await repository.getDebts(uid)).length, 0)
    const contactOperation = randomUUID()
    const contact = await repository.createContact(uid, {name:'Test contact', relationship:'Test'}, contactOperation)
    equal((await repository.createContact(uid, {name:'Test contact', relationship:'Test'}, contactOperation)).id, contact.id)
    equal((await repository.getContacts(uid)).length, 1)
    await repository.updateContact(uid, contact.id, {name:'Updated', relationship:''})
    equal((await repository.getContacts(uid))[0].relationship, undefined)
    await rejects(() => repository.updateContact(otherUid, contact.id, {name:'not owner'}))
    // Opening debts record an existing obligation without replaying its principal.
    for (const direction of ['borrowed', 'lent']) {
      const opening = {contactId:contact.id, recordingMode:'opening', direction, amount:5000000, paidAmount:0, hasInterest:false, recordedAt:todayDate(), note:'Opening debt'}
      const openingOp = randomUUID()
      const existing = await repository.createDebt(uid, opening, openingOp)
      equal(existing.recordingMode, 'opening')
      equal(existing.accountId, undefined)
      equal((await repository.createDebt(uid, opening, openingOp)).id, existing.id)
      equal(await balance('a'), 10000000)
      equal((await getTransactions(uid)).length, 0)
      equal((await sql('SELECT account_id FROM debts WHERE id = $1', [existing.id])).rows[0].account_id, null)
      await rejects(() => repository.changeDebt(uid, existing.id, {...opening, recordingMode:'cash-flow', accountId:acc.a}, randomUUID()))
      await repository.changeDebt(uid, existing.id, {...opening, amount:6000000}, randomUUID())
      equal(await balance('a'), 10000000)
      equal((await getTransactions(uid)).length, 0)
      const pay = {accountId:acc.a, amount:2000000, paidAt:todayDate(), paidTime:'12:00', note:''}
      const sign = direction === 'borrowed' ? -1 : 1
      const payOp = randomUUID()
      let changed = await repository.saveDebtPayment(uid, existing.id, undefined, pay, payOp)
      equal(await balance('a'), 10000000 + sign * 2000000)
      equal(getPaymentMetrics(changed).remainingAmount, 4000000)
      await repository.saveDebtPayment(uid, existing.id, undefined, pay, payOp)
      equal(await balance('a'), 10000000 + sign * 2000000)
      const payId = changed.payments[0].id
      changed = await repository.saveDebtPayment(uid, existing.id, payId, {...pay, accountId:acc.b, amount:1000000}, randomUUID())
      equal(await balance('a'), 10000000)
      equal(await balance('b'), 10000000 + sign * 1000000)
      await rejects(() => repository.changeDebt(uid, existing.id, {...opening, amount:500000}, randomUUID()))
      await repository.saveDebtPayment(uid, existing.id, payId, null, randomUUID())
      equal(await balance('b'), 10000000)
      changed = await repository.saveDebtPayment(uid, existing.id, undefined, {...pay, amount:6000000}, randomUUID())
      equal(changed.status, 'settled')
      equal((await getTransactions(uid)).length, 0)
      const deleteOp = randomUUID()
      await repository.changeDebt(uid, existing.id, null, deleteOp)
      await repository.changeDebt(uid, existing.id, null, deleteOp)
      equal(await balance('a'), 10000000)
      equal((await repository.getDebts(uid)).length, 0)
      // No-account creation and deletion must not need an account read.
      const otherContact = await repository.createContact(otherUid, {name:'No accounts'}, randomUUID())
      const noAccount = await repository.createDebt(otherUid, {...opening, contactId:otherContact.id}, randomUUID())
      await repository.changeDebt(otherUid, noAccount.id, null, randomUUID())
      equal((await repository.getDebts(otherUid)).length, 0)
      // Deleting a payment account reverses only payments on other accounts.
      await addAccount('opening_cascade', 10000000)
      const cascade = await repository.createDebt(uid, opening, randomUUID())
      await repository.saveDebtPayment(uid, cascade.id, undefined, {...pay, accountId:acc.opening_cascade, amount:1000000}, randomUUID())
      await repository.saveDebtPayment(uid, cascade.id, undefined, {...pay, accountId:acc.b, amount:1000000}, randomUUID())
      await deleteAccount(uid, acc.opening_cascade)
      equal(await balance('b'), 10000000)
      equal(await count('debts', 'id', cascade.id), 0)
    }
    await rejects(() => repository.createDebt(uid, {recordingMode:'invalid'}, randomUUID()))
    const values = {contactId:contact.id, accountId:acc.a, direction:'lent', amount:3000000, paidAmount:0, hasInterest:true, interestRate:1, interestPeriod:'month', recordedAt:'2026-08-01', note:'test debt'}
    const operation = randomUUID()
    const debt = await repository.createDebt(uid, values, operation)
    equal(await balance('a'), 7000000)
    equal((await repository.createDebt(uid, values, operation)).id, debt.id)
    equal(await balance('a'), 7000000)
    equal((await getTransactions(uid)).length, 1)
    equal((await getTransactions(uid))[0].source, 'debt')
    // The transactions page leaves the loan's movement to the debts page.
    const august = [new Date('2026-08-01T00:00:00+07:00'), new Date('2026-09-01T00:00:00+07:00')]
    equal((await getTransactionsInRange(uid, ...august)).length, 1)
    equal((await getTransactionsInRange(uid, ...august, { excludeDebts: true })).length, 0)
    await rejects(() => repository.createDebt(uid, {...values, amount:4000000}, operation))
    await rejects(() => repository.createDebt(uid, {...values, amount:8000000}, randomUUID()))
    equal(await balance('a'), 7000000)
    equal((await repository.getDebts(uid)).length, 1)
    await rejects(() => repository.deleteContact(uid, contact.id))
    await rejects(async () => deleteTransaction(uid, await movementId(debt.id)))
    await rejects(async () => updateTransaction(uid, await movementId(debt.id), {}))
    const paymentOperation = randomUUID()
    const payment = {accountId:acc.a, amount:500000, paidAt:'2026-08-15', paidTime:'12:00', note:'test'}
    let updated = await repository.saveDebtPayment(uid, debt.id, undefined, payment, paymentOperation)
    equal(await balance('a'), 7500000)
    equal(updated.payments.length, 1)
    updated = await repository.saveDebtPayment(uid, debt.id, undefined, payment, paymentOperation)
    equal(updated.payments.length, 1)
    equal(await balance('a'), 7500000)
    equal((await getTransactions(uid)).length, 1)
    await rejects(() => repository.saveDebtPayment(otherUid, debt.id, undefined, payment, randomUUID()))
    const paymentId = updated.payments[0].id
    updated = await repository.saveDebtPayment(uid, debt.id, paymentId, {...payment, accountId:acc.b, amount:600000}, randomUUID())
    equal(await balance('a'), 7000000)
    equal(await balance('b'), 10600000)
    equal(updated.paidAmount, 600000)
    equal((await getTransactions(uid)).length, 1)
    updated = await repository.saveDebtPayment(uid, debt.id, paymentId, null, randomUUID())
    equal(await balance('b'), 10000000)
    equal(updated.paidAmount, 0)
    equal((await getTransactions(uid)).length, 1)
    const remaining = getPaymentMetrics(updated).remainingAmount
    updated = await repository.saveDebtPayment(uid, debt.id, undefined, {...payment, amount:remaining, paidAt:todayDate()}, randomUUID())
    equal(updated.status, 'settled')
    equal(getPaymentMetrics(updated).remainingAmount, 0)
    const last = updated.payments[0].id
    updated = await repository.saveDebtPayment(uid, debt.id, last, null, randomUUID())
    equal(updated.status, 'active')
    equal(await balance('a'), 7000000)
    const borrowed = await repository.createDebt(uid, {...values, amount:1000000, direction:'borrowed', hasInterest:false}, randomUUID())
    equal(await balance('a'), 8000000)
    updated = await repository.saveDebtPayment(uid, borrowed.id, undefined, {...payment, amount:100000, paidAt:todayDate()}, randomUUID())
    equal(await balance('a'), 7900000)
    equal((await getTransactions(uid)).some((item) => item.id === updated.payments[0].id), false)
    const archivedPayment = updated.payments[0].id
    await setAccount('a', 'status', 'archived')
    await rejects(() => repository.createDebt(uid, values, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, borrowed.id, undefined, {...payment, paidAt:todayDate()}, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, amount:120000, paidAt:todayDate()}, randomUUID()))
    equal(await balance('a'), 7900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, amount:100000, paidAt:todayDate(), note:'Sửa ghi chú'}, randomUUID())
    equal(await balance('a'), 7900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, accountId:acc.b, amount:100000, paidAt:todayDate()}, randomUUID())
    equal(await balance('a'), 8000000)
    equal(await balance('b'), 9900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, null, randomUUID())
    equal(await balance('a'), 8000000)
    equal(await balance('b'), 10000000)
    await setAccount('a', 'status', 'active')
    const concurrentId = randomUUID()
    await Promise.all([1, 2].map(() => repository.saveDebtPayment(uid, borrowed.id, undefined, {...payment, amount:10000, paidAt:todayDate()}, concurrentId)))
    equal(await balance('a'), 7990000)
    equal((await repository.getDebts(uid)).find((item) => item.id === borrowed.id).payments.length, 1)
    await rejects(() => repository.createContact(uid, {name:'   '}, randomUUID()))
    await rejects(() => repository.createDebt(uid, {...values, amount:-1}, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, debt.id, undefined, {...payment, paidAt:'2026-02-30'}, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, debt.id, undefined, {...payment, accountId:'../other'}, randomUUID()))
    // Edit principal/account, preserve payments, and reverse every impact on delete.
    const editDebt = await repository.createDebt(uid, {...values, amount:1000000, hasInterest:false}, randomUUID())
    const beforeA = await balance('a')
    const beforeB = await balance('b')
    await repository.saveDebtPayment(uid, editDebt.id, undefined, {...payment, amount:200000}, randomUUID())
    const editValues = {...values, amount:1500000, accountId:acc.b, hasInterest:false, note:'Edited'}
    const editOperation = randomUUID()
    await repository.changeDebt(uid, editDebt.id, editValues, editOperation)
    equal(await balance('a'), beforeA + 1200000)
    equal(await balance('b'), beforeB - 1500000)
    equal((await repository.getDebts(uid)).find(item => item.id === editDebt.id).paidAmount, 200000)
    await repository.changeDebt(uid, editDebt.id, editValues, editOperation)
    equal(await balance('b'), beforeB - 1500000)
    equal((await getTransactions(uid)).find(item => item.debtId === editDebt.id).amount, -1500000)
    await rejects(() => repository.changeDebt(uid, editDebt.id, {...editValues, amount:100000}, randomUUID()))
    await rejects(() => repository.changeDebt(uid, editDebt.id, {...editValues, recordedAt:todayDate()}, randomUUID()))
    await rejects(() => repository.changeDebt(uid, editDebt.id, {...editValues, direction:'borrowed'}, randomUUID()))
    await rejects(() => repository.changeDebt(otherUid, editDebt.id, null, randomUUID()))
    equal(await balance('b'), beforeB - 1500000)
    const deleteOperation = randomUUID()
    await repository.changeDebt(uid, editDebt.id, null, deleteOperation)
    await repository.changeDebt(uid, editDebt.id, null, deleteOperation)
    equal(await balance('a'), beforeA + 1000000)
    equal(await balance('b'), beforeB)
    equal((await repository.getDebts(uid)).some(item => item.id === editDebt.id), false)
    equal((await getTransactions(uid)).some(item => item.debtId === editDebt.id), false)
    equal(await count('debt_payments', 'debt_id', editDebt.id), 0)

    const oldA = await balance('a')
    const oldB = await balance('b')
    const reverseDebt = await repository.createDebt(uid, {...values, amount:1000000, hasInterest:false, direction:'borrowed'}, randomUUID())
    await repository.saveDebtPayment(uid, reverseDebt.id, undefined, {...payment, accountId:acc.b, amount:300000}, randomUUID())
    await repository.changeDebt(uid, reverseDebt.id, null, randomUUID())
    equal(await balance('a'), oldA)
    equal(await balance('b'), oldB)

    const noPayments = await repository.createDebt(uid, {...values, amount:100000, hasInterest:false}, randomUUID())
    await repository.changeDebt(uid, noPayments.id, {...values, amount:200000, direction:'borrowed', hasInterest:false}, randomUUID())
    equal(await balance('a'), oldA + 200000)
    // An unfundable reversal must leave the loan and its ledger intact.
    await setAccount('a', 'balance', 0)
    await rejects(() => repository.changeDebt(uid, noPayments.id, null, randomUUID()))
    equal((await repository.getDebts(uid)).some(item => item.id === noPayments.id), true)
    equal((await getTransactions(uid)).some(item => item.debtId === noPayments.id), true)
    await setAccount('a', 'balance', oldA + 200000)
    await repository.changeDebt(uid, noPayments.id, null, randomUUID())
    equal(await balance('a'), oldA)
    const disposable = await repository.createContact(uid, {name:'Disposable'}, randomUUID())
    await repository.deleteContact(uid, disposable.id)
    equal((await repository.getContacts(uid)).length, 1)

    // Account deletion removes linked cash movements and debt history, while
    // reversing their impact on another account in the same transaction.
    for (const id of ['c', 'd']) await addAccount(id, 1000000)
    await createTransaction(uid, {kind:'transfer', amount:100000, fee:1000, fromAccountId:acc.c, toAccountId:acc.d, occurredAt:new Date(), note:''})
    const linkedDebt = await repository.createDebt(uid, {...values, accountId:acc.c, amount:200000, hasInterest:false}, randomUUID())
    await repository.saveDebtPayment(uid, linkedDebt.id, undefined, {...payment, accountId:acc.d, amount:50000, paidAt:todayDate()}, randomUUID())
    equal(await balance('c'), 699000)
    equal(await balance('d'), 1150000)
    // Editing overwrites the balance directly, without a transaction, and
    // rejects a stale form whose balance moved since it was opened.
    const transactionCount = (await getTransactions(uid)).length
    await updateAccount(uid, acc.c, {name:'c', type:'cash', balance:750000}, 699000)
    equal(await balance('c'), 750000)
    equal((await getTransactions(uid)).length, transactionCount)
    await updateAccount(uid, acc.c, {name:'Đổi tên', type:'cash', balance:699000}, 699000)
    equal(await balance('c'), 750000)
    // Renaming shows the new name on transfers and loan movements.
    const renamed = await getTransactions(uid)
    equal(renamed.some(item => item.kind === 'transfer' && item.fromAccountName === 'Đổi tên' && item.toAccountName === 'd'), true)
    equal(renamed.some(item => item.debtId === linkedDebt.id && item.accountName === 'Đổi tên'), true)
    equal(renamed.some(item => [item.accountName, item.fromAccountName].includes('c')), false)
    await rejects(() => updateAccount(uid, acc.c, {name:'c', type:'cash', balance:800000}, 699000))
    await updateAccount(uid, acc.c, {name:'c', type:'cash', balance:699000}, 750000)
    await setAccount('c', 'status', 'archived')
    await rejects(() => updateAccount(uid, acc.c, {name:'Đã sửa', type:'cash', balance:0}, 699000))
    await setAccount('c', 'status', 'active')
    await deleteAccount(uid, acc.c)
    equal(await count('accounts', 'id', acc.c), 0)
    equal(await balance('d'), 1000000)
    equal((await repository.getDebts(uid)).some(item => item.id === linkedDebt.id), false)
    equal(await count('debt_payments', 'debt_id', linkedDebt.id), 0)
    equal((await getTransactions(uid)).some(item => item.accountId === acc.c || item.fromAccountId === acc.c || item.toAccountId === acc.c || item.debtId === linkedDebt.id), false)

    for (const id of ['e', 'f']) await addAccount(id, 1000000)
    const paymentLinkedDebt = await repository.createDebt(uid, {...values, accountId:acc.e, amount:200000, hasInterest:false}, randomUUID())
    await repository.saveDebtPayment(uid, paymentLinkedDebt.id, undefined, {...payment, accountId:acc.f, amount:50000, paidAt:todayDate()}, randomUUID())
    equal(await balance('e'), 800000)
    await deleteAccount(uid, acc.f)
    equal(await balance('e'), 1000000)
    equal((await repository.getDebts(uid)).some(item => item.id === paymentLinkedDebt.id), false)
    equal((await getTransactions(uid)).some(item => item.debtId === paymentLinkedDebt.id), false)
    const archivedPrincipal = await repository.createDebt(uid, {...values, amount:100000, direction:'borrowed', hasInterest:false}, randomUUID())
    const principalBalance = await balance('a')
    await setAccount('a', 'status', 'archived')
    await rejects(() => repository.changeDebt(uid, archivedPrincipal.id, {...values, amount:200000, direction:'borrowed', hasInterest:false}, randomUUID()))
    equal(await balance('a'), principalBalance)
    await repository.changeDebt(uid, archivedPrincipal.id, {...values, amount:100000, direction:'borrowed', hasInterest:false, note:'Sửa ghi chú'}, randomUUID())
    equal(await balance('a'), principalBalance)
    const balanceBeforeMove = await balance('b')
    await repository.changeDebt(uid, archivedPrincipal.id, {...values, accountId:acc.b, amount:100000, direction:'borrowed', hasInterest:false}, randomUUID())
    equal(await balance('a'), principalBalance - 100000)
    equal(await balance('b'), balanceBeforeMove + 100000)
    await repository.changeDebt(uid, archivedPrincipal.id, null, randomUUID())
    equal(await balance('b'), balanceBeforeMove)
    // The note is optional: an empty one is stored as NULL and read back
    // empty, on the debt and on its cash movement.
    const noNote = await repository.createDebt(uid, {...values, accountId:acc.b, amount:100000, hasInterest:false, note:''}, randomUUID())
    equal((await repository.getDebts(uid)).find(item => item.id === noNote.id).note, '')
    equal((await sql('SELECT note FROM debts WHERE id = $1', [noNote.id])).rows[0].note, null)
    equal((await getTransactions(uid)).find(item => item.debtId === noNote.id).note, undefined)
    await repository.changeDebt(uid, noNote.id, null, randomUUID())
    console.log(`${checks} integration checks passed: persistence, isolation, balances, linked ledger, retries, concurrency, validation, and settlement.`)
  } finally {
    await cleanup()
    console.log('Isolated test records cleaned up.')
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1 })
