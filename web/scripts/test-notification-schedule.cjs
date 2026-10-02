/* eslint-disable @typescript-eslint/no-require-imports -- Loads pure TypeScript scheduling logic. */
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

const { getNextReminderAt } = require('../lib/notifications/schedule.ts')
const examples = [
  ['20:00', '2026-10-01T12:59:59.999Z', '2026-10-01T13:00:00.000Z'],
  ['20:00', '2026-10-01T13:00:00.000Z', '2026-10-01T13:00:00.000Z'],
  ['20:00', '2026-10-01T13:00:00.001Z', '2026-10-02T13:00:00.000Z'],
  // The Vietnam date is already October 2, while UTC is still October 1.
  ['00:10', '2026-10-01T17:01:00.000Z', '2026-10-01T17:10:00.000Z'],
  ['00:00', '2026-10-01T16:59:59.999Z', '2026-10-01T17:00:00.000Z'],
  ['00:00', '2026-10-01T17:00:00.001Z', '2026-10-02T17:00:00.000Z'],
  ['20:00', '2026-12-31T14:00:00.000Z', '2027-01-01T13:00:00.000Z'],
  ['20:00', '2028-02-28T14:00:00.000Z', '2028-02-29T13:00:00.000Z'],
  ['20:00', '2028-02-29T14:00:00.000Z', '2028-03-01T13:00:00.000Z'],
  // Older settings with arbitrary minutes remain supported.
  ['20:07', '2026-10-01T12:00:00.000Z', '2026-10-01T13:07:00.000Z'],
]
const originalTimezone = process.env.TZ
try {
  for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
    process.env.TZ = timezone
    for (const [time, now, expected] of examples) {
      assert.equal(getNextReminderAt(time, new Date(now)).toISOString(), expected)
    }
  }
} finally {
  if (originalTimezone === undefined) delete process.env.TZ
  else process.env.TZ = originalTimezone
}
console.log('Notification schedule checks passed: Vietnam timezone, exact boundary, midnight, year/month rollover, leap day and legacy minutes.')
