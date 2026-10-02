/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-categories-integration.cjs */
const assert = require('node:assert/strict')
const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const categories = require('../lib/categories/repository.ts')
const validation = require('../lib/categories/validation.ts')
const { createTransaction, getTransactions } = require('../lib/transactions/repository.ts')
const { defaultCategoryGroups } = require('../lib/categories/defaults.ts')

const count = async (text, params) => Number((await sql(text, params)).rows[0].count)

async function run() {
  try {
    assert.throws(
      () => validation.parseCategoryFormValues({ name: 'Test', colorName: 'orange', iconName: 'constructor' }),
      validation.CategoryValidationError,
    )
    assert.throws(
      () => validation.parseCategoryItemFormValues({ name: 'Test', iconName: 'toString' }),
      validation.CategoryValidationError,
    )
    assert.equal(validation.parseCategoryItemFormValues({ name: 'Test', iconName: 'coffee' }).iconName, 'coffee')
    assert.throws(() => validation.assertCategoryId('food'), validation.CategoryValidationError)

    // A user with categories of their own is not given the defaults.
    const userId = await createUser('category_test')
    const food = (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name)
      VALUES ($1, 'expense', 'Nhóm đã sửa', 'utensils', 'orange') RETURNING id`, [userId])).rows[0].id
    const breakfast = (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Mục đã sửa', 'coffee') RETURNING id`, [userId, food])).rows[0].id
    await categories.ensureDefaultCategories(userId)
    assert.equal(await count('SELECT count(*) FROM category_groups WHERE user_id = $1', [userId]), 1)
    assert.ok((await sql('SELECT categories_initialized_at FROM users WHERE id = $1', [userId])).rows[0].categories_initialized_at)

    // A new user gets every default once, even with concurrent first sign-ins.
    const newUserId = await createUser('category_test')
    await Promise.all([1, 2, 3].map(() => categories.ensureDefaultCategories(newUserId)))
    const groups = await categories.getCategoryGroups(newUserId)
    assert.deepEqual(groups.map((group) => group.name), defaultCategoryGroups.map((group) => group.name))
    assert.equal(
      groups.reduce((total, group) => total + group.items.length, 0),
      defaultCategoryGroups.reduce((total, group) => total + group.items.length, 0),
    )
    assert.ok(groups.every((group) => group.items.every((item) => item.colorName === group.colorName)))

    // Renames show on existing transactions, which read names by join.
    const account = (await sql(`INSERT INTO accounts (user_id, name, type, opening_balance, balance)
      VALUES ($1, 'Ví', 'cash', 100000, 100000) RETURNING id`, [userId])).rows[0].id
    await createTransaction(userId, { kind: 'expense', amount: 1000, accountId: account, categoryId: breakfast, occurredAt: new Date() })
    await categories.updateCategoryItem(userId, breakfast, { name: 'Bữa sáng', iconName: 'coffee' })
    await categories.updateCategoryGroup(userId, food, { name: 'Ăn uống', iconName: 'utensils', colorName: 'orange' })
    const [meal] = await getTransactions(userId)
    assert.equal(meal.categoryName, 'Bữa sáng')
    assert.equal(meal.categoryGroupName, 'Ăn uống')
    await assert.rejects(() => categories.updateCategoryGroup(newUserId, food, { name: 'Not mine', iconName: 'utensils', colorName: 'orange' }), validation.CategoryValidationError)

    // Creating an item races with archiving its group: either may win, but no
    // active item may remain in an archived group.
    for (let index = 0; index < 3; index++) {
      const groupId = await categories.createCategoryGroup(userId, 'expense', { name: 'Race', iconName: 'utensils', colorName: 'orange' })
      const [createResult, archiveResult] = await Promise.allSettled([
        categories.createCategoryItem(userId, groupId, { name: 'Mục mới', iconName: 'coffee' }),
        categories.archiveCategoryGroup(userId, groupId),
      ])
      assert.equal(archiveResult.status, 'fulfilled')
      if (createResult.status === 'rejected') {
        assert.ok(createResult.reason instanceof validation.CategoryValidationError)
      }
      assert.equal(await count(`SELECT count(*) FROM category_items WHERE group_id = $1 AND status = 'active'`, [groupId]), 0)
      await assert.rejects(
        () => categories.createCategoryItem(userId, groupId, { name: 'Mục muộn', iconName: 'coffee' }),
        validation.CategoryValidationError,
      )
    }
    console.log('Category integration checks passed.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
