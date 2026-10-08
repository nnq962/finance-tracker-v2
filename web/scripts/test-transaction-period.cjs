/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness transpiles TypeScript modules before loading them. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const ts = require('typescript')

// Resolve the app's "@/" imports from the web root, as Next.js does.
const originalLoad = Module._load
Module._load = function (id, parent, main) {
  return originalLoad.call(this, id.startsWith('@/') ? path.join(__dirname, '..', id.slice(2)) : id, parent, main)
}

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
  getTransactionMonthKey,
  getTransactionMonthRange,
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

// One way of writing dates across the app, in Vietnam time.
const dates = require('../lib/format-date.ts')
assert.equal(dates.formatDate('2026-09-01'), '01/09/2026')
assert.equal(dates.formatLongDate('2026-10-04'), 'Chủ Nhật, 04/10/2026')
assert.equal(dates.formatDayLabel('2026-10-02', '2026-10-02'), 'Hôm nay, 02/10')
assert.equal(dates.formatDayLabel('2026-10-01', '2026-10-02'), 'Hôm qua, 01/10')
assert.equal(dates.formatDayLabel('2026-09-30', '2026-10-02'), 'Thứ Tư, 30/09')
assert.equal(dates.formatDayLabel('2026-10-01'), 'Thứ Năm, 01/10')
assert.equal(dates.toDateKey(localSeptemberTransaction.occurredAt), '2026-09-01')
assert.equal(dates.formatTime(localSeptemberTransaction.occurredAt), '00:30')
assert.equal(dates.formatTime('2026-09-01T10:05:00.000Z'), '17:05')
assert.equal(getTransactionPeriod([localSeptemberTransaction], 'month', today, today, today).transactions.length, 1)
assert.equal(getTransactionPeriod([localSeptemberTransaction], 'month', '2026-08-01', today, today).transactions.length, 0)

assert.equal(shiftPeriodAnchor('2026-03-31', 'month', -1), '2026-02-01')
assert.equal(shiftPeriodAnchor('2026-01-31', 'month', 1), '2026-02-01')
assert.equal(shiftPeriodAnchor('2026-02-01', 'month', 1), '2026-03-01')
assert.equal(getTransactionMonthKey(undefined, today), '2026-09')
assert.equal(getTransactionMonthKey('2026-08', today), '2026-08')
assert.equal(getTransactionMonthKey('2026-10', today), '2026-09')
assert.equal(getTransactionMonthKey('invalid', today), '2026-09')
assert.equal(getTransactionMonthKey('0000-01', today), '2026-09')
const septemberRange = getTransactionMonthRange('2026-09', 1)
assert.equal(septemberRange.start.toISOString(), '2026-07-31T17:00:00.000Z')
assert.equal(septemberRange.end.toISOString(), '2026-09-30T17:00:00.000Z')

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
