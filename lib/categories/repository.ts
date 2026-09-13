import "server-only"

import { FieldValue } from "firebase-admin/firestore"

import { defaultCategoryGroups } from "@/lib/categories/defaults"
import type {
  CategoryFormValues,
  CategoryGroup,
  CategoryItem,
  CategoryStatus,
  CategoryType,
} from "@/lib/categories/types"
import { CategoryValidationError } from "@/lib/categories/validation"
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"

const CATEGORY_SCHEMA_VERSION = 1
const MAX_GROUPS_PER_TYPE = 100
const MAX_ITEMS_PER_GROUP = 200
const MAX_BATCHED_ITEMS = 498

type CategoryGroupDocument = CategoryFormValues & {
  type: CategoryType
  order: number
  status: CategoryStatus
}

type CategoryItemDocument = CategoryFormValues & {
  groupId: string
  type: CategoryType
  order: number
  status: CategoryStatus
}

function getUserReference(userId: string) {
  return getFirebaseAdminFirestore().collection("users").doc(userId)
}

function getGroupsCollection(userId: string) {
  return getUserReference(userId).collection("categoryGroups")
}

function getItemsCollection(userId: string) {
  return getUserReference(userId).collection("categoryItems")
}

function compareByOrderThenName<T extends { id: string; name: string; order: number }>(
  left: T,
  right: T,
) {
  return left.order - right.order ||
    left.name.localeCompare(right.name, "vi") ||
    left.id.localeCompare(right.id)
}

export async function ensureDefaultCategories(userId: string) {
  const firestore = getFirebaseAdminFirestore()
  const userReference = getUserReference(userId)
  const settingsReference = userReference
    .collection("categorySettings")
    .doc("default")

  await firestore.runTransaction(async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsReference)

    if (settingsSnapshot.exists) return

    const now = FieldValue.serverTimestamp()

    defaultCategoryGroups.forEach((group, groupIndex) => {
      transaction.set(getGroupsCollection(userId).doc(group.id), {
        name: group.name,
        type: group.type,
        iconName: group.iconName,
        colorName: group.colorName,
        order: groupIndex,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })

      group.items.forEach((item, itemIndex) => {
        transaction.set(getItemsCollection(userId).doc(item.id), {
          groupId: group.id,
          type: group.type,
          name: item.name,
          iconName: item.iconName,
          colorName: item.colorName,
          order: itemIndex,
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
      })
    })

    transaction.set(settingsReference, {
      schemaVersion: CATEGORY_SCHEMA_VERSION,
      initializedAt: now,
      updatedAt: now,
    })
  })
}

export async function getCategoryGroups(
  userId: string,
): Promise<CategoryGroup[]> {
  await ensureDefaultCategories(userId)

  const [groupSnapshot, itemSnapshot] = await Promise.all([
    getGroupsCollection(userId).get(),
    getItemsCollection(userId).get(),
  ])
  const itemsByGroup = new Map<string, Array<CategoryItem & { order: number }>>()

  itemSnapshot.docs.forEach((document) => {
    const data = document.data() as CategoryItemDocument

    if (data.status !== "active") return

    const items = itemsByGroup.get(data.groupId) ?? []
    items.push({
      id: document.id,
      groupId: data.groupId,
      type: data.type,
      name: data.name,
      iconName: data.iconName,
      colorName: data.colorName,
      order: data.order,
    })
    itemsByGroup.set(data.groupId, items)
  })

  return groupSnapshot.docs
    .map((document) => {
      const data = document.data() as CategoryGroupDocument

      if (data.status !== "active") return null

      const items = (itemsByGroup.get(document.id) ?? [])
        .sort(compareByOrderThenName)
        .map((item) => ({
          id: item.id,
          groupId: item.groupId,
          type: item.type,
          name: item.name,
          iconName: item.iconName,
          colorName: item.colorName,
        }))

      return {
        id: document.id,
        type: data.type,
        name: data.name,
        iconName: data.iconName,
        colorName: data.colorName,
        order: data.order,
        items,
      }
    })
    .filter((group): group is CategoryGroup & { order: number } => group !== null)
    .sort(compareByOrderThenName)
    .map((group) => ({
      id: group.id,
      type: group.type,
      name: group.name,
      iconName: group.iconName,
      colorName: group.colorName,
      items: group.items,
    }))
}

export async function createCategoryGroup(
  userId: string,
  type: CategoryType,
  values: CategoryFormValues,
) {
  await ensureDefaultCategories(userId)
  const collection = getGroupsCollection(userId)
  const snapshot = await collection.get()
  const activeGroupCount = snapshot.docs.filter((document) => {
    const data = document.data() as CategoryGroupDocument
    return data.status === "active" && data.type === type
  }).length

  if (activeGroupCount >= MAX_GROUPS_PER_TYPE) {
    throw new CategoryValidationError(
      `Mỗi loại chỉ được có tối đa ${MAX_GROUPS_PER_TYPE} nhóm.`,
    )
  }

  const now = FieldValue.serverTimestamp()
  await collection.add({
    ...values,
    type,
    order: Date.now(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateCategoryGroup(
  userId: string,
  groupId: string,
  values: CategoryFormValues,
) {
  const reference = getGroupsCollection(userId).doc(groupId)
  const snapshot = await reference.get()

  if (!snapshot.exists || snapshot.get("status") !== "active") {
    throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
  }

  await reference.update({
    ...values,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function archiveCategoryGroup(userId: string, groupId: string) {
  const groupReference = getGroupsCollection(userId).doc(groupId)
  const [groupSnapshot, itemSnapshot] = await Promise.all([
    groupReference.get(),
    getItemsCollection(userId).where("groupId", "==", groupId).get(),
  ])

  if (!groupSnapshot.exists || groupSnapshot.get("status") !== "active") {
    throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
  }

  if (itemSnapshot.size > MAX_BATCHED_ITEMS) {
    throw new CategoryValidationError(
      "Nhóm có quá nhiều hạng mục để xoá an toàn.",
    )
  }

  const batch = getFirebaseAdminFirestore().batch()
  const now = FieldValue.serverTimestamp()
  batch.update(groupReference, { status: "archived", updatedAt: now })
  itemSnapshot.docs.forEach((document) => {
    if (document.get("status") === "active") {
      batch.update(document.ref, { status: "archived", updatedAt: now })
    }
  })
  await batch.commit()
}

export async function createCategoryItem(
  userId: string,
  groupId: string,
  values: CategoryFormValues,
) {
  const groupReference = getGroupsCollection(userId).doc(groupId)
  const [groupSnapshot, itemSnapshot] = await Promise.all([
    groupReference.get(),
    getItemsCollection(userId).where("groupId", "==", groupId).get(),
  ])

  if (!groupSnapshot.exists || groupSnapshot.get("status") !== "active") {
    throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
  }

  const activeItemCount = itemSnapshot.docs.filter(
    (document) => document.get("status") === "active",
  ).length

  if (activeItemCount >= MAX_ITEMS_PER_GROUP) {
    throw new CategoryValidationError(
      `Mỗi nhóm chỉ được có tối đa ${MAX_ITEMS_PER_GROUP} hạng mục.`,
    )
  }

  const type = groupSnapshot.get("type")
  if (type !== "expense" && type !== "income") {
    throw new CategoryValidationError("Loại nhóm hạng mục không hợp lệ.")
  }

  const now = FieldValue.serverTimestamp()
  await getItemsCollection(userId).add({
    ...values,
    groupId,
    type,
    order: Date.now(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateCategoryItem(
  userId: string,
  itemId: string,
  values: CategoryFormValues,
) {
  const reference = getItemsCollection(userId).doc(itemId)
  const snapshot = await reference.get()

  if (!snapshot.exists || snapshot.get("status") !== "active") {
    throw new CategoryValidationError("Hạng mục không tồn tại.")
  }

  await reference.update({
    ...values,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function archiveCategoryItem(userId: string, itemId: string) {
  const reference = getItemsCollection(userId).doc(itemId)
  const snapshot = await reference.get()

  if (!snapshot.exists || snapshot.get("status") !== "active") {
    throw new CategoryValidationError("Hạng mục không tồn tại.")
  }

  await reference.update({
    status: "archived",
    updatedAt: FieldValue.serverTimestamp(),
  })
}
