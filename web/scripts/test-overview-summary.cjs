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
  archivedCash: 1_000_000,
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

console.log('Overview summary checks passed.')
