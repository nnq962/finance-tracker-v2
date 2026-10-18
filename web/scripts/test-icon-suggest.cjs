/* eslint-disable @typescript-eslint/no-require-imports -- Loads the TypeScript module through the test harness. */
/*
 * Checks icon suggestions for names people give jars and categories:
 * common words (lib/icons/icon-keywords.ts) come first, with or without
 * accents, then icons whose names share a word.
 *
 * Run: node scripts/test-icon-suggest.cjs
 */
const assert = require('node:assert/strict')
require('./lib/db-harness.cjs')
const { suggestIcons } = require('../lib/icons/suggest-icons.ts')

const first = (name) => suggestIcons(name)[0]
assert.equal(first('Du lịch Nhật'), 'plane')
assert.equal(first('du lich nhat'), 'plane', 'without accents too')
assert.equal(first('Cưới'), 'heart-basic')
assert.equal(first('Mua xe máy'), 'motorbike')
assert.equal(first('mua oto'), 'car')
assert.equal(first('iPhone mới'), 'smartphone')
assert.equal(first('Học phí đại học'), 'graduation')
assert.equal(first('Quỹ khẩn cấp'), 'vault')
assert.equal(first('Cà phê sáng'), 'coffee', 'icon names still match')
assert.deepEqual(suggestIcons(''), [])
assert.deepEqual(suggestIcons('x'), [], 'one letter says nothing')
// "con" is a word, not part of "concert".
assert.notEqual(first('Concert'), 'baby')
// The category a jar's purchase starts in, against the default categories.
const { defaultCategoryGroups } = require('../lib/categories/defaults.ts')
const { guessBoughtCategory } = require('../lib/savings/bought-category.ts')
const groups = defaultCategoryGroups
  .filter((group) => group.type === 'expense')
  .map((group) => ({ name: group.name, iconName: group.iconName, items: group.items.map((item) => ({ id: item.name, name: item.name, iconName: item.iconName })) }))
const guess = (name, icon) => guessBoughtCategory({ name, goal: { icon } }, groups)
assert.equal(guess('iPhone 17', 'smartphone'), 'Đồ công nghệ', 'a phone is tech, not the taxi app item with a phone icon')
assert.equal(guess('Laptop mới', 'piggy-bank'), 'Đồ công nghệ', 'from the name when the icon is the default')
assert.equal(guess('Áo khoác', 'shirt'), 'Quần áo')
assert.equal(guess('Tủ lạnh mới', 'refrigerator'), 'Đồ gia dụng')
assert.equal(guess('Mua xe máy', 'motorbike'), '', 'no confident guess: the user picks')
assert.equal(guess('Du lịch Nhật', 'plane'), '')
assert.equal(guess('Quỹ gì đó', 'piggy-bank'), '')
// A user's own category with the jar's icon wins.
assert.equal(guessBoughtCategory({ name: 'Mua xe máy', goal: { icon: 'motorbike' } }, [...groups, { name: 'Xe cộ', iconName: 'car', items: [{ id: 'xe', name: 'Xe máy', iconName: 'motorbike' }] }]), 'xe')

console.log('Icon suggestion and bought category checks passed.')
process.exit(0)
