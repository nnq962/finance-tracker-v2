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

    // Only the call that creates the user's row says it is new (the admin's bot announces it).
    const firstId = `category_test_${Date.now()}_first`
    try {
      assert.deepEqual(await categories.ensureDefaultCategories(firstId), { isNew: true })
      assert.deepEqual(await categories.ensureDefaultCategories(firstId), { isNew: false })
      const together = await Promise.all([1, 2].map((n) => categories.ensureDefaultCategories(`${firstId}_${n}`)))
      assert.ok(together.every((result) => result.isNew))
    } finally {
      await sql("DELETE FROM users WHERE id LIKE $1", [`${firstId}%`])
    }

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

    // Creating an item gives back its id, as the AI assistant picks it next.
    const itemId = await categories.createCategoryItem(userId, food, { name: 'Mục từ gợi ý', iconName: 'coffee' })
    assert.equal((await sql('SELECT name FROM category_items WHERE id = $1', [itemId])).rows[0].name, 'Mục từ gợi ý')

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
    // No two groups of a type, nor two categories in a group, share a name,
    // whatever the case; the other type, another group, or keeping one's own name is fine.
    const dupe = await categories.createCategoryGroup(userId, 'expense', { name: 'Đi lại', iconName: 'utensils', colorName: 'blue' })
    await assert.rejects(() => categories.createCategoryGroup(userId, 'expense', { name: 'ĐI LẠI', iconName: 'utensils', colorName: 'blue' }), /Đã có nhóm chi/)
    await categories.createCategoryGroup(userId, 'income', { name: 'Đi lại', iconName: 'utensils', colorName: 'blue' })
    await assert.rejects(() => categories.updateCategoryGroup(userId, food, { name: 'đi lại', iconName: 'utensils', colorName: 'orange' }), /Đã có nhóm chi/)
    await categories.updateCategoryGroup(userId, dupe, { name: 'Đi lại', iconName: 'coffee', colorName: 'rose' })
    const taxi = await categories.createCategoryItem(userId, dupe, { name: 'Taxi', iconName: 'coffee' })
    await assert.rejects(() => categories.createCategoryItem(userId, dupe, { name: 'taxi', iconName: 'coffee' }), /đã có hạng mục/)
    await categories.createCategoryItem(userId, food, { name: 'Taxi', iconName: 'coffee' })
    const bus = await categories.createCategoryItem(userId, dupe, { name: 'Xe buýt', iconName: 'coffee' })
    await assert.rejects(() => categories.updateCategoryItem(userId, bus, { name: 'TAXI', iconName: 'coffee' }), /đã có hạng mục/)
    await categories.updateCategoryItem(userId, taxi, { name: 'Taxi', iconName: 'utensils' })
    // Duplicates from before still save their other changes.
    const old = (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name)
      VALUES ($1, $2, 'expense', 'Taxi', 'coffee') RETURNING id`, [userId, dupe])).rows[0].id
    await categories.updateCategoryItem(userId, old, { name: 'Taxi', iconName: 'utensils' })
    await categories.archiveCategoryItem(userId, old)

    // Deleting a group takes its spending limit (and the limit's alerts) with it.
    const budget = (await sql(`INSERT INTO budgets (user_id, category_group_id, amount) VALUES ($1, $2, 500000) RETURNING id`, [userId, dupe])).rows[0].id
    await sql(`INSERT INTO budget_alerts (user_id, budget_id, month, level) VALUES ($1, $2, date_trunc('month', now())::date, 80)`, [userId, budget])
    await categories.archiveCategoryGroup(userId, dupe)
    assert.equal(await count('SELECT count(*) FROM budgets WHERE id = $1', [budget]), 0)
    assert.equal(await count('SELECT count(*) FROM budget_alerts WHERE budget_id = $1', [budget]), 0)
    await categories.createCategoryGroup(userId, 'expense', { name: 'Đi lại', iconName: 'utensils', colorName: 'blue' })

    console.log('Category integration checks passed.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
