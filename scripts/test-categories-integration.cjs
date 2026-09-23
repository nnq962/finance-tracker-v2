/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: CATEGORY_TEST_LIVE=1 node scripts/test-categories-integration.cjs */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { randomUUID } = require('node:crypto')
const ts = require('typescript')

if (process.env.CATEGORY_TEST_LIVE !== '1') {
  throw new Error('Set CATEGORY_TEST_LIVE=1 to run the isolated Firestore check.')
}

require('@next/env').loadEnvConfig(process.cwd())
const originalLoad = Module._load
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {}
  if (id.startsWith('@/')) id = path.join(process.cwd(), id.slice(2))
  return originalLoad.call(this, id, parent, main)
}
require.extensions['.ts'] = (mod, filename) => mod._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText,
  filename,
)

const categories = require('../lib/categories/repository.ts')
const validation = require('../lib/categories/validation.ts')
const { getFirebaseAdminFirestore } = require('../lib/firebase/admin.ts')
const firestore = getFirebaseAdminFirestore()
const userId = `codex_category_test_${randomUUID()}`
const emptyUserId = `codex_category_test_${randomUUID()}`
const root = firestore.collection('users').doc(userId)
const emptyRoot = firestore.collection('users').doc(emptyUserId)

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

    await root.collection('categoryGroups').doc('food').set({
      name: 'Nhóm đã sửa', type: 'expense', iconName: 'utensils', colorName: 'orange',
      order: 0, status: 'active',
    })
    await root.collection('categoryItems').doc('breakfast').set({
      name: 'Mục đã sửa', groupId: 'food', type: 'expense', iconName: 'coffee',
      order: 0, status: 'active',
    })
    await categories.ensureDefaultCategories(userId)
    assert.equal((await root.collection('categoryGroups').doc('food').get()).get('name'), 'Nhóm đã sửa')
    assert.equal((await root.collection('categoryItems').doc('breakfast').get()).get('name'), 'Mục đã sửa')
    assert.equal((await root.collection('categoryGroups').get()).size, 1)
    assert.equal((await root.collection('categorySettings').doc('default').get()).exists, true)

    await categories.ensureDefaultCategories(emptyUserId)
    assert.equal((await emptyRoot.collection('categoryGroups').doc('food').get()).exists, true)
    assert.equal((await emptyRoot.collection('categoryItems').doc('breakfast').get()).exists, true)

    for (let index = 0; index < 3; index++) {
      const groupId = `race_${index}`
      await root.collection('categoryGroups').doc(groupId).set({
        name: 'Race', type: 'expense', iconName: 'utensils', colorName: 'orange',
        order: index + 1, status: 'active',
      })
      const [createResult, archiveResult] = await Promise.allSettled([
        categories.createCategoryItem(userId, groupId, { name: 'Mục mới', iconName: 'coffee' }),
        categories.archiveCategoryGroup(userId, groupId),
      ])
      assert.equal(archiveResult.status, 'fulfilled')
      if (createResult.status === 'rejected') {
        assert.ok(createResult.reason instanceof validation.CategoryValidationError)
      }
      assert.equal((await root.collection('categoryGroups').doc(groupId).get()).get('status'), 'archived')
      const items = await root.collection('categoryItems').where('groupId', '==', groupId).get()
      assert.equal(items.docs.some((item) => item.get('status') === 'active'), false)
      await assert.rejects(
        () => categories.createCategoryItem(userId, groupId, { name: 'Mục muộn', iconName: 'coffee' }),
        validation.CategoryValidationError,
      )
    }
    console.log('Category integration checks passed.')
  } finally {
    await Promise.all([firestore.recursiveDelete(root), firestore.recursiveDelete(emptyRoot)])
    await firestore.terminate()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
