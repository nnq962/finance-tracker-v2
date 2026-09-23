/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness transpiles TypeScript modules before loading them. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText,
  filename,
)

const {
  getLastNavigableDateKey,
  getTransactionDateKey,
  getTransactionPeriod,
  shiftPeriodAnchor,
} = require('../app/(main)/transactions/_lib/get-transaction-period.ts')
const { groupTransactionsByDate } = require('../app/(main)/transactions/_lib/group-transactions-by-date.ts')

const today = '2026-09-23'
const localSeptemberTransaction = {
  id: 'early-september',
  occurredAt: '2026-08-31T17:30:00.000Z',
}

assert.equal(getTransactionDateKey(localSeptemberTransaction.occurredAt), '2026-09-01')
assert.equal(groupTransactionsByDate([localSeptemberTransaction])[0].dateKey, '2026-09-01')
assert.equal(getTransactionPeriod([localSeptemberTransaction], 'month', today, today, today).transactions.length, 1)
assert.equal(getTransactionPeriod([localSeptemberTransaction], 'month', '2026-08-01', today, today).transactions.length, 0)

assert.equal(shiftPeriodAnchor('2026-03-31', 'month', -1), '2026-02-01')
assert.equal(shiftPeriodAnchor('2026-01-31', 'month', 1), '2026-02-01')
assert.equal(shiftPeriodAnchor('2026-02-01', 'month', 1), '2026-03-01')

assert.equal(getLastNavigableDateKey([], today), today)
const emptyCurrentPeriod = getTransactionPeriod([], 'month', today, today, today)
assert.equal(emptyCurrentPeriod.rangeLabel, 'Tháng 09, 2026')
assert.equal(emptyCurrentPeriod.contextLabel, 'tháng này')
assert.equal(emptyCurrentPeriod.isLatest, true)
assert.equal(emptyCurrentPeriod.transactions.length, 0)

const oldTransaction = { id: 'old', occurredAt: '2026-06-15T12:00:00.000Z' }
assert.equal(getLastNavigableDateKey([oldTransaction], today), today)
assert.equal(getTransactionPeriod([oldTransaction], 'month', today, today, today).contextLabel, 'tháng này')

const futureTransaction = { id: 'future', occurredAt: '2026-10-02T03:00:00.000Z' }
const lastNavigableDateKey = getLastNavigableDateKey([futureTransaction], today)
assert.equal(lastNavigableDateKey, '2026-10-02')
assert.equal(getTransactionPeriod([futureTransaction], 'month', today, today, lastNavigableDateKey).isLatest, false)
assert.equal(getTransactionPeriod([futureTransaction], 'month', '2026-10-01', today, lastNavigableDateKey).contextLabel, '1 tháng sau')

console.log('Transaction period checks passed.')
