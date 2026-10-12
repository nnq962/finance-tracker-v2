/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS harness loads the pure TypeScript prompt module. */
/* Run: node scripts/test-record-reply.cjs */
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText,
  filename,
)
// The icon registry imports lucide-react's components; their names are what matter here.
require.extensions['.tsx'] = require.extensions['.ts']

const { buildTransactionPrompt, readRecordReply, MAX_RECORD_ITEMS } = require('../lib/ai/transaction-prompt.ts')

const account = (id, name, type = 'cash') => ({ id, name, type, status: 'active', balance: 0, openingBalance: 0, logoFallback: '', excluded: false, linked: false, openedAt: '', updatedAt: '' })
const accounts = [account('cash', 'Tiền mặt'), account('momo', 'Ví MoMo', 'e-wallet'), { ...account('old', 'Cũ'), status: 'archived' }]
const categoryGroups = [
  { id: 'food', type: 'expense', name: 'Ăn uống', iconName: 'utensils', colorName: 'orange', items: [
    { id: 'lunch', groupId: 'food', type: 'expense', name: 'Ăn trưa', iconName: 'soup', colorName: 'orange' },
  ] },
  { id: 'pay', type: 'income', name: 'Lương', iconName: 'wallet', colorName: 'emerald', items: [
    { id: 'salary', groupId: 'pay', type: 'income', name: 'Lương', iconName: 'wallet', colorName: 'emerald' },
  ] },
]
const today = '2026-10-12'
const { messages, lists } = buildTransactionPrompt('x', { accounts, categoryGroups, today })
assert.match(messages[0].content, /MỘT HOẶC NHIỀU/)
const key = (kind, id) => lists[kind].find((entry) => (entry.item ?? entry.account ?? entry.group).id === id).key
const blank = { amountSaid: '', daysAgo: null, weekday: null, weeksAgo: null, day: null, month: null, hour: null, minute: null, dayPeriod: '',
  categoryId: null, newCategoryName: '', newCategoryGroupId: null, newGroupName: '', newCategoryIcon: '', accountId: null, toAccountId: null, note: '', fee: null, excluded: false }
const read = (items, lastAccountIds = {}) => readRecordReply({ isTransaction: true, items }, { request: 'x', lists, today, now: '19:00', lastAccountIds })

// Several told at once, each read on its own; an account unsaid is the last
// used for that kind, none when there is none (the user picks it).
const drafts = read([
  { ...blank, kind: 'expense', amount: 40_000, categoryId: key('categories', 'lunch'), dayPeriod: 'trưa' },
  { ...blank, kind: 'income', amount: 15_000_000, categoryId: key('categories', 'salary'), accountId: key('accounts', 'cash'), daysAgo: 1 },
  { ...blank, kind: 'transfer', amount: 1_000_000, accountId: key('accounts', 'cash'), toAccountId: key('accounts', 'momo'), fee: 2_000 },
], { expense: 'momo' })
assert.deepEqual(drafts.map((draft) => [draft.kind, draft.amount, draft.accountId, draft.date, draft.time, draft.fee]), [
  ['expense', 40_000, 'momo', today, '12:00', 0],
  ['income', 15_000_000, 'cash', '2026-10-11', '19:00', 0],
  ['transfer', 1_000_000, 'cash', today, '19:00', 2_000],
])
assert.equal(read([{ ...blank, kind: 'expense', amount: 1 }])[0].accountId, undefined)
// The last used account no longer active is not filled in.
assert.equal(read([{ ...blank, kind: 'expense', amount: 1 }], { expense: 'old' })[0].accountId, undefined)

// Left out of the figures (income and spending only); a fee only on transfers.
const [excluded, feeless] = read([
  { ...blank, kind: 'expense', amount: 200_000, excluded: true, fee: 5_000 },
  { ...blank, kind: 'transfer', amount: 1, accountId: key('accounts', 'cash'), toAccountId: key('accounts', 'momo'), excluded: true },
])
assert.deepEqual([excluded.excluded, excluded.fee, feeless.excluded], [true, 0, false])

// A new category with the icon picked, kept only when it is one of the app's.
const [made, unknownIcon, existing] = read([
  { ...blank, kind: 'expense', amount: 70_000, newCategoryName: 'kem', newCategoryGroupId: key('groups', 'food'), newCategoryIcon: 'ice-cream-cone' },
  { ...blank, kind: 'expense', amount: 300_000, newCategoryName: 'Xem phim', newGroupName: 'Giải trí', newCategoryIcon: 'no-such-icon' },
  { ...blank, kind: 'expense', amount: 1, newCategoryName: 'ăn trưa' },
])
assert.deepEqual(made.suggestedCategory, { name: 'Kem', groupName: 'Ăn uống', groupId: 'food', iconName: 'ice-cream-cone' })
assert.deepEqual(unknownIcon.suggestedCategory, { name: 'Xem phim', groupName: 'Giải trí' })
// One the user already has is picked, not made again.
assert.deepEqual([existing.categoryId, existing.suggestedCategory], ['lunch', undefined])

// At most ten; nothing when the request was not about money.
assert.equal(read(Array.from({ length: 14 }, () => ({ ...blank, kind: 'expense', amount: 1 }))).length, MAX_RECORD_ITEMS)
assert.deepEqual(readRecordReply({ isTransaction: false, items: [{ ...blank, kind: 'expense', amount: 1 }] }, { request: 'x', lists, today, now: '19:00', lastAccountIds: {} }), [])
assert.deepEqual(readRecordReply('nonsense', { request: 'x', lists, today, now: '19:00', lastAccountIds: {} }), [])

console.log('Record reply checks passed.')
