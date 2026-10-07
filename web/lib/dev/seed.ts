import "server-only"

import { randomUUID } from "node:crypto"

import { createAccount, getAccounts } from "@/lib/accounts/repository"
import { todayDate } from "@/lib/debts/calculations"
import { createContact, createDebt, getContacts, saveDebtPayment } from "@/lib/debts/repository"
import { ensureDefaultCategories, getCategoryGroups } from "@/lib/categories/repository"
import { markOnboardingSeen } from "@/lib/onboarding/repository"
import { createTransaction } from "@/lib/transactions/repository"

const DAY_MS = 24 * 60 * 60 * 1000

// Expenses by default category name: amounts to pick from, and a time of day.
const dailySpending = [
  { category: "Ăn sáng", amounts: [25_000, 30_000, 35_000, 45_000], hour: 7 },
  { category: "Ăn trưa", amounts: [45_000, 55_000, 65_000], hour: 12 },
  { category: "Ăn tối", amounts: [80_000, 120_000, 150_000], hour: 19 },
  { category: "Taxi và xe công nghệ", amounts: [32_000, 48_000, 65_000], hour: 8 },
  { category: "Phương tiện công cộng", amounts: [7_000, 14_000], hour: 17 },
] as const

const occasionalSpending = [
  { category: "Quần áo", amounts: [250_000, 450_000, 690_000] },
  { category: "Đồ công nghệ", amounts: [390_000, 1_290_000] },
  { category: "Đồ gia dụng", amounts: [120_000, 180_000, 320_000] },
  { category: "Internet", amounts: [220_000] },
] as const

/**
 * Gives the dev user three accounts and about two months of transactions, the
 * first time only, through the same repository calls as the app, so balances
 * add up. A seeded number generator keeps every run the same.
 */
export async function seedDevUser(userId: string) {
  await ensureDefaultCategories(userId)
  // The welcome screens would cover every screenshot.
  await markOnboardingSeen(userId)
  if ((await getAccounts(userId)).length === 0) await seedMoney(userId)
  await seedDebts(userId)
}

/** Three accounts and about two months of transactions. */
async function seedMoney(userId: string) {

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  for (const account of [
    { name: "Vietcombank", type: "bank", institutionId: "vietcombank", balance: 25_000_000 },
    { name: "Ví MoMo", type: "e-wallet", institutionId: "momo", balance: 1_500_000 },
    { name: "Tiền mặt", type: "cash", balance: 2_000_000 },
  ] as const) {
    await createAccount(userId, { ...account, openedAt: new Date(start.getTime() - DAY_MS) })
  }

  const accounts = await getAccounts(userId)
  const accountId = (name: string) => accounts.find((account) => account.name === name)!.id
  const items = (await getCategoryGroups(userId)).flatMap((group) => group.items)
  const categoryId = (name: string) => items.find((item) => item.name === name)!.id

  let state = 42
  const random = () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const at = (day: Date, hour: number) =>
    new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(random() * 60))
  // Today's later hours have not happened yet.
  const add = async (values: Parameters<typeof createTransaction>[1]) => {
    if (values.occurredAt <= now) await createTransaction(userId, values)
  }

  for (let day = new Date(start); day <= now; day = new Date(day.getTime() + DAY_MS)) {
    const monthDay = day.getDate()

    if (monthDay === 5) {
      await add({
        kind: "income", amount: 18_000_000, accountId: accountId("Vietcombank"),
        categoryId: categoryId("Lương hàng tháng"), occurredAt: at(day, 9),
      })
    }
    if (monthDay === 6) {
      await add({
        kind: "expense", amount: 4_500_000, accountId: accountId("Vietcombank"),
        categoryId: categoryId("Tiền thuê nhà"), occurredAt: at(day, 10), note: "Tiền nhà tháng này",
      })
      await add({
        kind: "transfer", amount: 1_000_000, fee: 0, fromAccountId: accountId("Vietcombank"),
        toAccountId: accountId("Ví MoMo"), occurredAt: at(day, 20),
      })
    }
    if (monthDay === 10) {
      await add({
        kind: "expense", amount: pick([380_000, 450_000, 520_000]), accountId: accountId("Vietcombank"),
        categoryId: categoryId("Điện nước"), occurredAt: at(day, 18),
      })
    }
    if (monthDay === 15 && random() < 0.6) {
      await add({
        kind: "income", amount: pick([1_500_000, 2_500_000, 3_200_000]), accountId: accountId("Vietcombank"),
        categoryId: categoryId("Làm việc tự do"), occurredAt: at(day, 16), note: "Dự án thiết kế",
      })
    }

    for (const spending of dailySpending) {
      if (random() < 0.45) {
        await add({
          kind: "expense", amount: pick(spending.amounts),
          accountId: accountId(pick(["Ví MoMo", "Tiền mặt", "Tiền mặt"])),
          categoryId: categoryId(spending.category), occurredAt: at(day, spending.hour),
        })
      }
    }
    if (random() < 0.12) {
      const spending = pick(occasionalSpending)
      await add({
        kind: "expense", amount: pick(spending.amounts), accountId: accountId("Vietcombank"),
        categoryId: categoryId(spending.category), occurredAt: at(day, 21),
      })
    }
  }
}

/** "YYYY-MM-DD", `days` from today (negative: before). */
function dayFromToday(days: number) {
  const date = new Date(`${todayDate()}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * A few people and loans each way, once: one overdue, one part paid, one
 * with interest, one settled. Recorded as opening balances, so the accounts
 * only move with the payments.
 */
async function seedDebts(userId: string) {
  if ((await getContacts(userId)).length > 0) return

  const accounts = await getAccounts(userId)
  const accountId = (name: string) => accounts.find((account) => account.name === name)!.id
  const contact = async (name: string, relationship: string) =>
    (await createContact(userId, { name, relationship }, randomUUID())).id
  const minh = await contact("Minh Tuấn", "Đồng nghiệp")
  const lan = await contact("Lan Anh", "Bạn thân")
  const ha = await contact("Chị Hà", "Chị gái")
  const hoang = await contact("Hoàng Nam", "Bạn đại học")

  const debt = async (values: {
    contactId: string
    direction: "lent" | "borrowed"
    amount: number
    note: string
    recordedDaysAgo: number
    dueInDays?: number
    interest?: { rate: number; period: "month" | "year" }
  }) =>
    (
      await createDebt(
        userId,
        {
          contactId: values.contactId,
          recordingMode: "opening",
          direction: values.direction,
          amount: values.amount,
          hasInterest: Boolean(values.interest),
          interestRate: values.interest?.rate,
          interestPeriod: values.interest?.period,
          note: values.note,
          recordedAt: dayFromToday(-values.recordedDaysAgo),
          dueAt: values.dueInDays === undefined ? undefined : dayFromToday(values.dueInDays),
        },
        randomUUID(),
      )
    ).id
  const pay = (debtId: string, amount: number, account: string, daysAgo: number) =>
    saveDebtPayment(
      userId,
      debtId,
      undefined,
      { amount, accountId: accountId(account), paidAt: dayFromToday(-daysAgo), paidTime: "10:00", note: "" },
      randomUUID(),
    )

  await debt({ contactId: minh, direction: "lent", amount: 2_000_000, note: "Mượn sửa xe", recordedDaysAgo: 40, dueInDays: -5 })
  const deposit = await debt({ contactId: lan, direction: "lent", amount: 5_000_000, note: "Tiền cọc phòng", recordedDaysAgo: 20, dueInDays: 12 })
  await pay(deposit, 1_500_000, "Vietcombank", 6)
  await debt({
    contactId: ha, direction: "borrowed", amount: 10_000_000, note: "Mua laptop", recordedDaysAgo: 60,
    interest: { rate: 1, period: "month" },
  })
  await debt({ contactId: hoang, direction: "borrowed", amount: 800_000, note: "Ăn tối sinh nhật", recordedDaysAgo: 10, dueInDays: 3 })
  const ticket = await debt({ contactId: hoang, direction: "lent", amount: 300_000, note: "Vé xem phim", recordedDaysAgo: 30 })
  await pay(ticket, 300_000, "Tiền mặt", 25)
}
