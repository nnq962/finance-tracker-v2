/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness installs the TypeScript loader before loading server modules. */
/* Run: DEBT_TEST_LIVE=1 node scripts/test-debts-integration.cjs
 * Uses only a unique test namespace; never writes to a real user's records.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { randomUUID } = require('node:crypto')
if (process.env.DEBT_TEST_LIVE !== '1') throw new Error('Set DEBT_TEST_LIVE=1 to run the isolated Firestore integration check.')
require('@next/env').loadEnvConfig(process.cwd())
const originalLoad = Module._load
Module._load = function(id, parent, main) {
  if (id === 'server-only') return {}
  if (id.startsWith('@/')) id = path.join(process.cwd(), id.slice(2))
  return originalLoad.call(this, id, parent, main)
}
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const repository = require('../lib/debts/repository.ts')
const { getFirebaseAdminFirestore } = require('../lib/firebase/admin.ts')
const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = require('../lib/transactions/repository.ts')
const { adjustAccountBalance, deleteAccount, updateAccount } = require('../lib/accounts/repository.ts')
const { todayDate, getPaymentMetrics } = require('../lib/debts/calculations.ts')
const { getDaysUntilDue, getDebtDeadline } = require('../app/(main)/debts/_lib/debt-presentation.ts')
const { Timestamp } = require('firebase-admin/firestore')
const firestore = getFirebaseAdminFirestore()
const uid = `codex_debt_test_${randomUUID()}`
const otherUid = `codex_debt_test_${randomUUID()}`
const root = firestore.collection('users').doc(uid)
let checks = 0
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++ }
const rejects = async (fn) => { await assert.rejects(fn); checks++ }
const balance = async (id) => (await root.collection('accounts').doc(id).get()).get('balance')
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
    for (const id of ['a', 'b']) await root.collection('accounts').doc(id).set({name:id, balance:10000000, openingBalance:10000000, status:'active', type:'cash', createdAt:Timestamp.now(), updatedAt:Timestamp.now()})
    equal((await repository.getContacts(uid)).length, 0)
    equal((await repository.getDebts(uid)).length, 0)
    const contactOperation = randomUUID()
    const contact = await repository.createContact(uid, {name:'Test contact', relationship:'Test'}, contactOperation)
    equal((await repository.createContact(uid, {name:'Test contact', relationship:'Test'}, contactOperation)).id, contact.id)
    equal((await repository.getContacts(uid)).length, 1)
    await repository.updateContact(uid, contact.id, {name:'Updated', relationship:''})
    equal((await repository.getContacts(uid))[0].relationship, '')
    await rejects(() => repository.updateContact(otherUid, contact.id, {name:'not owner'}))
    const values = {contactId:contact.id, accountId:'a', direction:'lent', amount:3000000, paidAmount:0, hasInterest:true, interestRate:1, interestPeriod:'month', recordedAt:'2026-08-01', note:'test debt'}
    const operation = randomUUID()
    const debt = await repository.createDebt(uid, values, operation)
    equal(await balance('a'), 7000000)
    equal((await repository.createDebt(uid, values, operation)).id, debt.id)
    equal(await balance('a'), 7000000)
    equal((await getTransactions(uid)).length, 1)
    equal((await getTransactions(uid))[0].source, 'debt')
    await rejects(() => repository.createDebt(uid, {...values, amount:4000000}, operation))
    await rejects(() => repository.createDebt(uid, {...values, amount:8000000}, randomUUID()))
    equal(await balance('a'), 7000000)
    equal((await repository.getDebts(uid)).length, 1)
    await rejects(() => repository.deleteContact(uid, contact.id))
    await rejects(() => deleteTransaction(uid, `debt_${debt.id}`))
    await rejects(() => updateTransaction(uid, `debt_${debt.id}`, {}))
    const paymentOperation = randomUUID()
    const payment = {accountId:'a', amount:500000, paidAt:'2026-08-15', paidTime:'12:00', note:'test'}
    let updated = await repository.saveDebtPayment(uid, debt.id, undefined, payment, paymentOperation)
    equal(await balance('a'), 7500000)
    equal(updated.payments.length, 1)
    updated = await repository.saveDebtPayment(uid, debt.id, undefined, payment, paymentOperation)
    equal(updated.payments.length, 1)
    equal(await balance('a'), 7500000)
    equal((await getTransactions(uid)).length, 1)
    await rejects(() => repository.saveDebtPayment(otherUid, debt.id, undefined, payment, randomUUID()))
    const paymentId = updated.payments[0].id
    const legacyLedger = root.collection('transactions').doc(`debt_${debt.id}_${paymentId}`)
    await legacyLedger.set({ source:'debt', debtPaymentId:paymentId, occurredAt:Timestamp.now() })
    equal((await getTransactions(uid)).length, 1)
    equal(await balance('a'), 7500000)
    updated = await repository.saveDebtPayment(uid, debt.id, paymentId, {...payment, accountId:'b', amount:600000}, randomUUID())
    equal(await balance('a'), 7000000)
    equal(await balance('b'), 10600000)
    equal(updated.paidAmount, 600000)
    equal((await getTransactions(uid)).some((item) => item.debtPaymentId === paymentId), false)
    equal((await root.collection('transactions').doc(`debt_${debt.id}_${paymentId}`).get()).exists, false)
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
    equal((await getTransactions(uid)).some((item) => item.debtPaymentId === updated.payments[0].id), false)
    const archivedPayment = updated.payments[0].id
    await root.collection('accounts').doc('a').update({status:'archived'})
    await rejects(() => repository.createDebt(uid, values, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, borrowed.id, undefined, {...payment, paidAt:todayDate()}, randomUUID()))
    await rejects(() => repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, amount:120000, paidAt:todayDate()}, randomUUID()))
    equal(await balance('a'), 7900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, amount:100000, paidAt:todayDate(), note:'Sửa ghi chú'}, randomUUID())
    equal(await balance('a'), 7900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, {...payment, accountId:'b', amount:100000, paidAt:todayDate()}, randomUUID())
    equal(await balance('a'), 8000000)
    equal(await balance('b'), 9900000)
    await repository.saveDebtPayment(uid, borrowed.id, archivedPayment, null, randomUUID())
    equal(await balance('a'), 8000000)
    equal(await balance('b'), 10000000)
    await root.collection('accounts').doc('a').update({status:'active'})
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
    const editValues = {...values, amount:1500000, accountId:'b', hasInterest:false, note:'Edited'}
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
    equal((await root.collection('debts').doc(editDebt.id).collection('payments').get()).size, 0)

    const oldA = await balance('a')
    const oldB = await balance('b')
    const reverseDebt = await repository.createDebt(uid, {...values, amount:1000000, hasInterest:false, direction:'borrowed'}, randomUUID())
    await repository.saveDebtPayment(uid, reverseDebt.id, undefined, {...payment, accountId:'b', amount:300000}, randomUUID())
    await repository.changeDebt(uid, reverseDebt.id, null, randomUUID())
    equal(await balance('a'), oldA)
    equal(await balance('b'), oldB)

    const noPayments = await repository.createDebt(uid, {...values, amount:100000, hasInterest:false}, randomUUID())
    await repository.changeDebt(uid, noPayments.id, {...values, amount:200000, direction:'borrowed', hasInterest:false}, randomUUID())
    equal(await balance('a'), oldA + 200000)
    // An unfundable reversal must leave the loan and its ledger intact.
    await root.collection('accounts').doc('a').update({balance:0})
    await rejects(() => repository.changeDebt(uid, noPayments.id, null, randomUUID()))
    equal((await repository.getDebts(uid)).some(item => item.id === noPayments.id), true)
    equal((await getTransactions(uid)).some(item => item.debtId === noPayments.id), true)
    await root.collection('accounts').doc('a').update({balance:oldA + 200000})
    await repository.changeDebt(uid, noPayments.id, null, randomUUID())
    equal(await balance('a'), oldA)
    const disposable = await repository.createContact(uid, {name:'Disposable'}, randomUUID())
    await repository.deleteContact(uid, disposable.id)
    equal((await repository.getContacts(uid)).length, 1)

    // Account deletion removes linked cash movements and debt history, while
    // reversing their impact on another account in the same transaction.
    for (const id of ['c', 'd']) await root.collection('accounts').doc(id).set({name:id, balance:1000000, openingBalance:1000000, status:'active', type:'cash', createdAt:Timestamp.now(), updatedAt:Timestamp.now()})
    await createTransaction(uid, {kind:'transfer', amount:100000, fee:1000, fromAccountId:'c', toAccountId:'d', occurredAt:new Date(), note:''})
    const linkedDebt = await repository.createDebt(uid, {...values, accountId:'c', amount:200000, hasInterest:false}, randomUUID())
    await repository.saveDebtPayment(uid, linkedDebt.id, undefined, {...payment, accountId:'d', amount:50000, paidAt:todayDate()}, randomUUID())
    equal(await balance('c'), 699000)
    equal(await balance('d'), 1150000)
    await root.collection('categoryGroups').doc('test_income').set({name:'Kiểm tra', type:'income', status:'active'})
    await root.collection('categoryItems').doc('test_adjustment').set({name:'Đối soát', groupId:'test_income', type:'income', status:'active'})
    await adjustAccountBalance(uid, 'c', {actualBalance:750000, categoryId:'test_adjustment', note:'Đối soát', occurredAt:new Date()})
    equal(await balance('c'), 750000)
    equal((await getTransactions(uid)).some(item => item.source === 'balance_adjustment' && item.amount === 51000), true)
    await root.collection('accounts').doc('c').update({status:'archived'})
    await rejects(() => updateAccount(uid, 'c', {name:'Đã sửa', type:'cash', balance:0}))
    await rejects(() => adjustAccountBalance(uid, 'c', {actualBalance:760000, categoryId:'test_adjustment', note:'', occurredAt:new Date()}))
    await root.collection('accounts').doc('c').update({status:'active'})
    await deleteAccount(uid, 'c')
    equal((await root.collection('accounts').doc('c').get()).exists, false)
    equal(await balance('d'), 1000000)
    equal((await repository.getDebts(uid)).some(item => item.id === linkedDebt.id), false)
    equal((await root.collection('debts').doc(linkedDebt.id).collection('payments').get()).size, 0)
    equal((await getTransactions(uid)).some(item => item.accountId === 'c' || item.fromAccountId === 'c' || item.toAccountId === 'c' || item.debtId === linkedDebt.id), false)

    for (const id of ['e', 'f']) await root.collection('accounts').doc(id).set({name:id, balance:1000000, openingBalance:1000000, status:'active', type:'cash', createdAt:Timestamp.now(), updatedAt:Timestamp.now()})
    const paymentLinkedDebt = await repository.createDebt(uid, {...values, accountId:'e', amount:200000, hasInterest:false}, randomUUID())
    await repository.saveDebtPayment(uid, paymentLinkedDebt.id, undefined, {...payment, accountId:'f', amount:50000, paidAt:todayDate()}, randomUUID())
    equal(await balance('e'), 800000)
    await deleteAccount(uid, 'f')
    equal(await balance('e'), 1000000)
    equal((await repository.getDebts(uid)).some(item => item.id === paymentLinkedDebt.id), false)
    equal((await getTransactions(uid)).some(item => item.debtId === paymentLinkedDebt.id), false)
    const archivedPrincipal = await repository.createDebt(uid, {...values, amount:100000, direction:'borrowed', hasInterest:false}, randomUUID())
    const principalBalance = await balance('a')
    await root.collection('accounts').doc('a').update({status:'archived'})
    await rejects(() => repository.changeDebt(uid, archivedPrincipal.id, {...values, amount:200000, direction:'borrowed', hasInterest:false}, randomUUID()))
    equal(await balance('a'), principalBalance)
    await repository.changeDebt(uid, archivedPrincipal.id, {...values, amount:100000, direction:'borrowed', hasInterest:false, note:'Sửa ghi chú'}, randomUUID())
    equal(await balance('a'), principalBalance)
    const balanceBeforeMove = await balance('b')
    await repository.changeDebt(uid, archivedPrincipal.id, {...values, accountId:'b', amount:100000, direction:'borrowed', hasInterest:false}, randomUUID())
    equal(await balance('a'), principalBalance - 100000)
    equal(await balance('b'), balanceBeforeMove + 100000)
    await repository.changeDebt(uid, archivedPrincipal.id, null, randomUUID())
    equal(await balance('b'), balanceBeforeMove)
    console.log(`${checks} integration checks passed: persistence, isolation, balances, linked ledger, retries, concurrency, validation, and settlement.`)
  } finally {
    // These exact generated namespaces contain only records created by this run.
    await firestore.recursiveDelete(root)
    await firestore.recursiveDelete(firestore.collection('users').doc(otherUid))
    console.log('Isolated test records cleaned up.')
    await firestore.terminate()
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1 })
