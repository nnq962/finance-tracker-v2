import "server-only"

import type { Transaction } from "kysely"
import { unstable_cache } from "next/cache"

import { categoryGroupsCacheTag } from "@/lib/cache-tags"
import { defaultCategoryGroups } from "@/lib/categories/defaults"
import type {
  CategoryFormValues,
  CategoryGroup,
  CategoryItemFormValues,
  CategoryType,
} from "@/lib/categories/types"
import { CategoryValidationError } from "@/lib/categories/validation"
import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"

const MAX_GROUPS_PER_TYPE = 100
const MAX_ITEMS_PER_GROUP = 200

/** A name as compared for duplicates: same letters, whatever the case or how its marks were typed. */
const nameKey = (name: string) => name.normalize("NFC").toLocaleLowerCase("vi-VN")

/**
 * Two groups of a type, or two categories in a group, may not share a name
 * (2026-10-17: picking one when recording, by hand or through the AI, could
 * not tell them apart). Run inside the caller's transaction, after the lock
 * that serialises its writes. A rename that keeps the same name passes, so
 * duplicates from before still save their other changes.
 */
function assertNameFree(
  names: { id: string; name: string }[],
  name: string,
  message: string,
  self?: { id: string; name: string },
) {
  if (self && nameKey(self.name) === nameKey(name)) return
  if (names.some((row) => row.id !== self?.id && nameKey(row.name) === nameKey(name))) {
    throw new CategoryValidationError(message)
  }
}

function compareByOrderThenName<T extends { id: string; name: string; sortOrder: number }>(
  left: T,
  right: T,
) {
  return left.sortOrder - right.sortOrder ||
    left.name.localeCompare(right.name, "vi") ||
    left.id.localeCompare(right.id)
}

/**
 * Writes the default category groups and their items. For a user with no
 * categories, inside the caller's transaction.
 */
export async function insertDefaultCategories(trx: Transaction<DB>, userId: string) {
  for (const [groupIndex, group] of defaultCategoryGroups.entries()) {
    const { id: groupId } = await trx
      .insertInto("categoryGroups")
      .values({
        userId,
        type: group.type,
        name: group.name,
        iconName: group.iconName,
        colorName: group.colorName,
        sortOrder: groupIndex,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    if (group.items.length > 0) {
      await trx
        .insertInto("categoryItems")
        .values(group.items.map((item, itemIndex) => ({
          userId,
          groupId,
          type: group.type,
          name: item.name,
          iconName: item.iconName,
          sortOrder: itemIndex,
        })))
        .execute()
    }
  }
}

/**
 * Creates the user's row and, the first time only, the default categories.
 * Safe to call on every sign-in: the user row is locked while it checks, so
 * concurrent first logins create the defaults once.
 */
export async function ensureDefaultCategories(userId: string) {
  await getDb().transaction().execute(async (trx) => {
    await trx
      .insertInto("users")
      .values({ id: userId })
      .onConflict((conflict) => conflict.column("id").doNothing())
      .execute()

    const user = await trx
      .selectFrom("users")
      .select("categoriesInitializedAt")
      .where("id", "=", userId)
      .forUpdate()
      .executeTakeFirstOrThrow()

    if (user.categoriesInitializedAt) return

    const existing = await trx
      .selectFrom("categoryGroups")
      .select("id")
      .where("userId", "=", userId)
      .limit(1)
      .executeTakeFirst()

    if (!existing) await insertDefaultCategories(trx, userId)

    await trx
      .updateTable("users")
      .set({ categoriesInitializedAt: new Date() })
      .where("id", "=", userId)
      .execute()
  })
}

async function getCategoryGroupsUncached(
  userId: string,
): Promise<CategoryGroup[]> {
  const db = getDb()
  const [groups, items] = await Promise.all([
    db.selectFrom("categoryGroups")
      .select(["id", "type", "name", "iconName", "colorName", "sortOrder"])
      .where("userId", "=", userId)
      .where("status", "=", "active")
      .execute(),
    db.selectFrom("categoryItems")
      .select(["id", "groupId", "type", "name", "iconName", "sortOrder"])
      .where("userId", "=", userId)
      .where("status", "=", "active")
      .execute(),
  ])

  return groups
    .sort(compareByOrderThenName)
    .map((group) => ({
      id: group.id,
      type: group.type as CategoryType,
      name: group.name,
      iconName: group.iconName as CategoryGroup["iconName"],
      colorName: group.colorName as CategoryGroup["colorName"],
      items: items
        .filter((item) => item.groupId === group.id)
        .sort(compareByOrderThenName)
        .map((item) => ({
          id: item.id,
          groupId: item.groupId,
          type: item.type as CategoryType,
          name: item.name,
          iconName: item.iconName as CategoryGroup["iconName"],
          // Items take their color from the group.
          colorName: group.colorName as CategoryGroup["colorName"],
        })),
    }))
}

export async function getCategoryGroups(
  userId: string,
): Promise<CategoryGroup[]> {
  return unstable_cache(
    () => getCategoryGroupsUncached(userId),
    ["category-groups", userId],
    {
      revalidate: 3600,
      tags: [categoryGroupsCacheTag(userId)],
    },
  )()
}

export async function createCategoryGroup(
  userId: string,
  type: CategoryType,
  values: CategoryFormValues,
) {
  await ensureDefaultCategories(userId)

  return getDb().transaction().execute(async (trx) => {
    // Serialises group creation per user so the limit below holds.
    await trx.selectFrom("users").select("id").where("id", "=", userId).forUpdate().execute()

    const { count } = await trx
      .selectFrom("categoryGroups")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("userId", "=", userId)
      .where("type", "=", type)
      .where("status", "=", "active")
      .executeTakeFirstOrThrow()

    if (Number(count) >= MAX_GROUPS_PER_TYPE) {
      throw new CategoryValidationError(
        `Mỗi loại chỉ được có tối đa ${MAX_GROUPS_PER_TYPE} nhóm.`,
      )
    }

    assertNameFree(await activeGroupNames(trx, userId, type), values.name, groupTakenMessage(type, values.name))

    const { id } = await trx
      .insertInto("categoryGroups")
      .values({ userId, type, ...values, sortOrder: Date.now() })
      .returning("id")
      .executeTakeFirstOrThrow()

    return id
  })
}

/** The user's active groups of a type, for the duplicate check. */
function activeGroupNames(trx: Transaction<DB>, userId: string, type: CategoryType) {
  return trx
    .selectFrom("categoryGroups")
    .select(["id", "name"])
    .where("userId", "=", userId)
    .where("type", "=", type)
    .where("status", "=", "active")
    .execute()
}

const groupTakenMessage = (type: CategoryType, name: string) =>
  `Đã có nhóm ${type === "expense" ? "chi" : "thu"} “${name}”. Đặt tên khác.`

export async function updateCategoryGroup(
  userId: string,
  groupId: string,
  values: CategoryFormValues,
) {
  await getDb().transaction().execute(async (trx) => {
    // The same lock as creating a group, so two saves cannot take one name.
    await trx.selectFrom("users").select("id").where("id", "=", userId).forUpdate().execute()

    const group = await trx
      .selectFrom("categoryGroups")
      .select(["id", "name", "type"])
      .where("id", "=", groupId)
      .where("userId", "=", userId)
      .where("status", "=", "active")
      .executeTakeFirst()

    if (!group) {
      throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
    }

    const type = group.type as CategoryType
    assertNameFree(await activeGroupNames(trx, userId, type), values.name, groupTakenMessage(type, values.name), group)

    await trx.updateTable("categoryGroups").set(values).where("id", "=", groupId).execute()
  })
}

export async function archiveCategoryGroup(userId: string, groupId: string) {
  await getDb().transaction().execute(async (trx) => {
    const group = await trx
      .updateTable("categoryGroups")
      .set({ status: "archived" })
      .where("id", "=", groupId)
      .where("userId", "=", userId)
      .where("status", "=", "active")
      .returning("id")
      .executeTakeFirst()

    if (!group) {
      throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
    }

    await trx
      .updateTable("categoryItems")
      .set({ status: "archived" })
      .where("userId", "=", userId)
      .where("groupId", "=", groupId)
      .where("status", "=", "active")
      .execute()

    // Its spending limit goes with it (its alerts with it, by cascade): a
    // deleted group cannot come back, and the confirmation says so.
    await trx
      .deleteFrom("budgets")
      .where("userId", "=", userId)
      .where("categoryGroupId", "=", groupId)
      .execute()
  })
}

export async function createCategoryItem(
  userId: string,
  groupId: string,
  values: CategoryItemFormValues,
) {
  return getDb().transaction().execute(async (trx) => {
    // Locking the group serialises item creation against archiving it and
    // against other creates, so the per-group limit holds.
    const group = await trx
      .selectFrom("categoryGroups")
      .select(["type", "status"])
      .where("id", "=", groupId)
      .where("userId", "=", userId)
      .forUpdate()
      .executeTakeFirst()

    if (!group || group.status !== "active") {
      throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
    }

    const { count } = await trx
      .selectFrom("categoryItems")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("userId", "=", userId)
      .where("groupId", "=", groupId)
      .where("status", "=", "active")
      .executeTakeFirstOrThrow()

    if (Number(count) >= MAX_ITEMS_PER_GROUP) {
      throw new CategoryValidationError(
        `Mỗi nhóm chỉ được có tối đa ${MAX_ITEMS_PER_GROUP} hạng mục.`,
      )
    }

    assertNameFree(await activeItemNames(trx, userId, groupId), values.name, itemTakenMessage(values.name))

    const { id } = await trx
      .insertInto("categoryItems")
      .values({
        userId,
        groupId,
        type: group.type,
        ...values,
        sortOrder: Date.now(),
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    return id
  })
}

/** A group's active categories, for the duplicate check. */
function activeItemNames(trx: Transaction<DB>, userId: string, groupId: string) {
  return trx
    .selectFrom("categoryItems")
    .select(["id", "name"])
    .where("userId", "=", userId)
    .where("groupId", "=", groupId)
    .where("status", "=", "active")
    .execute()
}

const itemTakenMessage = (name: string) => `Nhóm này đã có hạng mục “${name}”. Đặt tên khác.`

export async function updateCategoryItem(
  userId: string,
  itemId: string,
  values: CategoryItemFormValues,
) {
  await getDb().transaction().execute(async (trx) => {
    const item = await trx
      .selectFrom("categoryItems")
      .select(["id", "name", "groupId"])
      .where("id", "=", itemId)
      .where("userId", "=", userId)
      .where("status", "=", "active")
      .executeTakeFirst()

    // Its group locked, as creating a category locks it, so two saves cannot take one name.
    const group = item
      ? await trx
          .selectFrom("categoryGroups")
          .select("status")
          .where("id", "=", item.groupId)
          .where("userId", "=", userId)
          .forUpdate()
          .executeTakeFirst()
      : undefined

    if (!item || group?.status !== "active") {
      throw new CategoryValidationError("Hạng mục không tồn tại.")
    }

    assertNameFree(await activeItemNames(trx, userId, item.groupId), values.name, itemTakenMessage(values.name), item)

    const result = await trx
      .updateTable("categoryItems")
      .set(values)
      .where("id", "=", itemId)
      .where("status", "=", "active")
      .executeTakeFirst()

    if (result.numUpdatedRows === BigInt(0)) {
      throw new CategoryValidationError("Hạng mục không tồn tại.")
    }
  })
}

export async function archiveCategoryItem(userId: string, itemId: string) {
  const result = await getDb()
    .updateTable("categoryItems")
    .set({ status: "archived" })
    .where("id", "=", itemId)
    .where("userId", "=", userId)
    .where("status", "=", "active")
    .executeTakeFirst()

  if (result.numUpdatedRows === BigInt(0)) {
    throw new CategoryValidationError("Hạng mục không tồn tại.")
  }
}
