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
  MAX_AMOUNT,
  getAmountSuggestions,
  getFrequentAmounts,
} = require('../lib/amount-suggestions.ts')

// Typed digits scale from thousands upwards.
assert.deepEqual(
  getAmountSuggestions(30, []),
  [30_000, 300_000, 3_000_000, 30_000_000, 300_000_000],
)
assert.deepEqual(
  getAmountSuggestions(5, []),
  [5_000, 50_000, 500_000, 5_000_000, 50_000_000],
)

// Frequent past amounts that start with the typed digits come first in the
// pick (then everything is sorted ascending); at most two of them.
const history = [35_000, 35_000, 35_000, 320_000, 320_000, 3_500_000, 45_000]
assert.deepEqual(
  getAmountSuggestions(3, history),
  [3_000, 30_000, 35_000, 300_000, 320_000],
)

// Nothing typed: the most frequent amounts, ascending.
assert.deepEqual(getAmountSuggestions(null, history), [35_000, 45_000, 320_000, 3_500_000])
assert.deepEqual(getAmountSuggestions(null, []), [])

// Never suggest the typed value itself, never exceed the allowed maximum.
assert.ok(!getAmountSuggestions(30_000, [30_000]).includes(30_000))
assert.deepEqual(getAmountSuggestions(999_999_999_999, []), [999_999_999_999_000])
assert.deepEqual(getAmountSuggestions(MAX_AMOUNT, []), [])
for (const typed of [1, 42, 999, 12_345, 7_000_000]) {
  const suggestions = getAmountSuggestions(typed, history)
  assert.ok(suggestions.length <= 5)
  assert.ok(suggestions.every((amount) => amount > 0 && amount <= MAX_AMOUNT))
  assert.deepEqual(suggestions, [...suggestions].sort((left, right) => left - right))
  assert.equal(new Set(suggestions).size, suggestions.length)
}

// Frequency ranking ignores invalid amounts and keeps first-seen order on ties.
assert.deepEqual(getFrequentAmounts([20_000, 10_000, 10_000, 20_000, -5, 1.5]), [20_000, 10_000])

console.log('Amount suggestion checks passed.')
