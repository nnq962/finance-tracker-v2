/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS harness loads the pure TypeScript summary module. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const originalLoad = Module._load
Module._load = function (id, parent, main) {
  if (id.startsWith('@/')) id = path.join(process.cwd(), id.slice(2))
  return originalLoad.call(this, id, parent, main)
}
require.extensions['.ts'] = (mod, filename) => mod._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
)

const { getOverviewSummary } = require('../lib/overview/summary.ts')
const accounts = [
  { id: 'active', balance: 9_000_000, status: 'active' },
  { id: 'archived', balance: 1_000_000, status: 'archived' },
]
const debts = [
  { id: 'borrowed', contactId: 'friend', direction: 'borrowed', amount: 5_000_000, paidAmount: 0, hasInterest: false, recordedAt: '2026-09-01', dueAt: '2026-09-25', status: 'active', payments: [] },
  { id: 'lent', contactId: 'coworker', direction: 'lent', amount: 3_000_000, paidAmount: 0, hasInterest: false, recordedAt: '2026-09-01', dueAt: '2026-11-01', status: 'active', payments: [] },
  { id: 'settled-summary', contactId: 'friend', direction: 'lent', amount: 1_000_000, paidAmount: 1_100_000, hasInterest: true, interestRate: 1, interestPeriod: 'month', recordedAt: '2026-01-01', status: 'settled' },
]
const contacts = [{ id: 'friend', name: 'Bạn' }, { id: 'coworker', name: 'Đồng nghiệp' }]
const occurredAt = '2026-09-22T04:00:00.000Z'
const transactions = [
  { id: 'income', kind: 'income', amount: 2_000_000, occurredAt },
  { id: 'expense', kind: 'expense', amount: -500_000, categoryGroupId: 'food', categoryGroupName: 'Ăn uống', occurredAt },
  { id: 'transfer', kind: 'transfer', amount: 1_000_000, occurredAt },
  { id: 'debt', source: 'debt', kind: 'income', amount: 5_000_000, occurredAt },
]

const summary = getOverviewSummary(accounts, debts, contacts, transactions, '2026-09-23')
assert.deepEqual(summary.netWorth, {
  cash: 10_000_000,
  leftOut: { count: 0, cash: 0 },
  receivable: 3_000_000,
  payable: 5_000_000,
  total: 8_000_000,
})
assert.equal(summary.cashFlow.current.income, 2_000_000)
assert.equal(summary.cashFlow.current.expense, 500_000)
assert.equal(summary.dueDebts.length, 1)
assert.equal(summary.dueDebts[0].contactName, 'Bạn')
assert.equal(summary.dueDebts[0].daysUntilDue, 2)

// Calendar and allocation totals leave out loans; allocation also leaves out
// transfers.
const { summarizeAllocation, summarizeDays } = require('../lib/overview/month-data.ts')
assert.deepEqual(summarizeDays(transactions), {
  '2026-09-22': { income: 2_000_000, expense: 500_000, count: 3 },
})
assert.deepEqual(summarizeAllocation(transactions), {
  '2026-09': { expense: { food: 500_000 }, income: { other: 2_000_000 } },
})

// A transfer's fee is spending everywhere, in a group of its own, unless the
// account paying it is left out of the figures; the transfer counts once.
const withFee = [
  ...transactions,
  { id: 'fee', kind: 'transfer', amount: 1_000_000, fee: 20_000, occurredAt },
  { id: 'fee-left-out', kind: 'transfer', amount: 1_000_000, fee: 5_000, fromAccountExcluded: true, occurredAt },
]
assert.equal(getOverviewSummary(accounts, debts, contacts, withFee, '2026-09-23').cashFlow.current.expense, 520_000)
assert.deepEqual(summarizeDays(withFee)['2026-09-22'], { income: 2_000_000, expense: 520_000, count: 5 })
assert.deepEqual(summarizeAllocation(withFee)['2026-09'].expense, { food: 500_000, 'transfer-fee': 20_000 })
const { getTransactionSummary } = require('../app/(main)/transactions/_lib/get-transaction-summary.ts')
assert.equal(getTransactionSummary(withFee).expense, 520_000)

// A repayment pays the interest accrued by its date first; once paid off,
// the interest parts add up to all of it. Interest is income on a loan made,
// spending on a loan taken; the principal is neither.
const { getPaymentInterests } = require('../lib/debts/calculations.ts')
const loan = { id: 'loan', direction: 'lent', amount: 10_000_000, hasInterest: true, interestRate: 1, interestPeriod: 'month', recordedAt: '2026-07-01',
  payments: [
    { id: 'p1', amount: 1_000_000, paidAt: '2026-07-31', paidTime: '09:00' },
    { id: 'p2', amount: 9_200_000, paidAt: '2026-08-30', paidTime: '09:00' },
  ] }
const parts = getPaymentInterests(loan)
assert.equal(parts.get('p1'), 100_000)
assert.equal(parts.get('p2'), 100_000)
assert.equal(getPaymentInterests({ ...loan, hasInterest: false }).size, 0)
const repayment = { id: 'p2', source: 'debt', debtId: 'loan', kind: 'income', amount: 9_200_000, interest: 100_000, occurredAt }
assert.equal(getTransactionSummary([repayment]).income, 100_000)
assert.deepEqual(summarizeAllocation([repayment])['2026-09'].income, { 'debt-interest': 100_000 })
assert.deepEqual(summarizeDays([repayment])['2026-09-22'], { income: 100_000, expense: 0, count: 0 })
assert.equal(getTransactionSummary([{ ...repayment, accountExcluded: true }]).income, 0)
// A loan made from an account left out of the figures is left out of the net worth.
const leftOutLoan = getOverviewSummary([{ id: 'quỹ', balance: 0, status: 'active', excluded: true }], [{ ...debts[1], accountId: 'quỹ' }], contacts, [], '2026-09-23')
assert.equal(leftOutLoan.netWorth.receivable, 0)

console.log('Overview summary checks passed.')
