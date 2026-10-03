import type { OllamaMessage } from "@/lib/ai/ollama"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"
import { MAX_MONEY } from "@/lib/money"

import type { TransactionKind } from "../_types/transaction"
import { shiftDate, type AiTransactionDraft } from "./ai-transaction-draft"

type Context = { accounts: Account[]; categoryGroups: CategoryGroup[]; today: string }

/** The user's lists as the model sees them, under short keys ("c3", "a1"). */
type Lists = {
  categories: { key: string; item: CategoryItem; label: string }[]
  accounts: { key: string; account: Account }[]
}

/** What the model answers, held to `transactionReplySchema`. */
type Reply = {
  isTransaction: boolean
  kind: TransactionKind
  amount: number | null
  title: string
  date: string
  categoryId: string | null
  accountId: string | null
  toAccountId: string | null
}

export const transactionReplySchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["expense", "income", "transfer"] },
    amount: { type: ["integer", "null"] },
    title: { type: "string" },
    date: { type: "string" },
    categoryId: { type: ["string", "null"] },
    accountId: { type: ["string", "null"] },
    toAccountId: { type: ["string", "null"] },
    isTransaction: { type: "boolean" },
  },
  required: ["kind", "amount", "title", "date", "categoryId", "accountId", "toAccountId", "isTransaction"],
}

const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]

const accountTypeLabels: Record<Account["type"], string> = {
  cash: "tiền mặt",
  bank: "ngân hàng",
  "e-wallet": "ví điện tử",
}

/** Lower case without Vietnamese marks, so "Ăn trưa" matches "an trua". */
function normalize(text: string) {
  return text
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
}

function buildLists({ accounts, categoryGroups }: Context): Lists {
  return {
    categories: categoryGroups
      .flatMap((group) => group.items.map((item) => ({ item, label: `${group.name} › ${item.name}` })))
      .map((category, index) => ({ key: `c${index + 1}`, ...category })),
    accounts: accounts
      .filter((account) => account.status === "active")
      .map((account, index) => ({ key: `a${index + 1}`, account })),
  }
}

function describeAccount(account: Account) {
  const institution =
    account.institutionName && normalize(account.institutionName) !== normalize(account.name)
      ? `, ${account.institutionName}`
      : ""
  return `${account.name} (${accountTypeLabels[account.type]}${institution})`
}

function systemPrompt(lists: Lists, today: string) {
  const weekday = weekdays[new Date(`${today}T00:00:00Z`).getUTCDay()]
  return `Bạn đọc một câu tiếng Việt (thường là văn nói, có thể sai chính tả do nhận giọng nói) mô tả MỘT khoản thu, chi hoặc chuyển tiền, rồi trả về JSON.

Hôm nay là ${weekday}, ${today}. Tuần bắt đầu từ thứ hai.

Số tiền (amount, số nguyên VND):
- k, nghìn, ngàn, ng, cành = 1.000; lít, xị = 100.000; triệu, tr, củ, m = 1.000.000; tỷ, tỏi = 1.000.000.000.
- "1tr2" = 1.200.000, "2 triệu rưỡi" = 2.500.000, "35 nghìn rưỡi" = 35.500, "1 lít rưỡi" = 150.000. Số có thể viết bằng chữ.
- Không nói số tiền thì amount = null. Đừng nhầm số lượng ("2 ly") hay giờ ("4h") với số tiền.

Loại (kind): "expense" chi, "income" thu (lương, thưởng, được cho, bán được, hoàn tiền, lãi), "transfer" chuyển giữa hai tài khoản của chính mình (nạp, rút, chuyển từ A sang B). Trả tiền cho người khác bằng chuyển khoản vẫn là expense.

Ngày (date, YYYY-MM-DD): mặc định hôm nay; hiểu "hôm qua", "hôm kia", "tối qua", "thứ hai tuần trước", "ngày 5", "mùng 2"... Không bao giờ sau hôm nay.

title: tên ngắn gọn của khoản, viết hoa chữ đầu, bỏ số tiền, ngày và tài khoản (ví dụ "Ăn trưa", "Trà sữa", "Đổ xăng").

categoryId: id danh mục hợp nhất CÙNG loại (chi cho expense, thu cho income), null nếu không có cái nào hợp hoặc là transfer.
Danh mục:
${lists.categories.map(({ key, item, label }) => `${key} (${item.type === "expense" ? "chi" : "thu"}): ${label}`).join("\n") || "(chưa có)"}

accountId: tài khoản tiền đi ra (với income là tài khoản nhận tiền); toAccountId: tài khoản nhận của transfer, ngoài ra null. Quẹt thẻ/chuyển khoản ngân hàng X là tài khoản X. Không nói rõ tài khoản thì null, đừng đoán.
Tài khoản:
${lists.accounts.map(({ key, account }) => `${key}: ${describeAccount(account)}`).join("\n") || "(chưa có)"}

isTransaction: false nếu câu không nói về một khoản thu, chi hay chuyển tiền nào (chào hỏi, câu hỏi, nói linh tinh), ngoài ra true.`
}

/** The first category of `kind` whose name holds one of `keywords`, tried in order. */
function findCategory(lists: Lists, kind: TransactionKind, keywords: string[]) {
  const ofKind = lists.categories.filter(({ item }) => item.type === kind)
  for (const keyword of keywords) {
    const found = ofKind.find(({ label }) => normalize(label).includes(keyword))
    if (found) return found.key
  }
  return null
}

/**
 * Worked answers for a small model to follow, written over the user's own
 * lists: a sample names an account or a category only when the user has
 * one of that kind, so every key in them is real.
 */
function examples(lists: Lists, today: string): OllamaMessage[] {
  const ofType = (type: Account["type"]) => lists.accounts.filter(({ account }) => account.type === type)
  const wallet = ofType("e-wallet")[0]
  const [bank, secondBank = bank] = ofType("bank")
  const transferFrom = bank ?? lists.accounts[0]
  const transferTo = (wallet ?? lists.accounts.find((entry) => entry !== transferFrom))
  const shots: [string, Omit<Reply, "isTransaction">][] = [
    [
      `cà phê sáng 25 cành${wallet ? ` ${wallet.account.name}` : ""}`,
      {
        kind: "expense", amount: 25_000, title: "Cà phê sáng", date: today,
        categoryId: findCategory(lists, "expense", ["ca phe", "an sang", "an uong"]),
        accountId: wallet?.key ?? null, toAccountId: null,
      },
    ],
    [
      `hôm qua nhận lương tháng 9 18 củ${bank ? ` vào ${bank.account.name}` : ""}`,
      {
        kind: "income", amount: 18_000_000, title: "Lương tháng 9", date: shiftDate(today, -1),
        categoryId: findCategory(lists, "income", ["luong"]),
        accountId: bank?.key ?? null, toAccountId: null,
      },
    ],
    [
      `đóng tiền nhà 4 triệu rưỡi${secondBank ? ` chuyển khoản ${secondBank.account.name}` : ""}`,
      {
        kind: "expense", amount: 4_500_000, title: "Tiền nhà", date: today,
        categoryId: findCategory(lists, "expense", ["thue nha", "tien nha", "nha"]),
        accountId: secondBank?.key ?? null, toAccountId: null,
      },
    ],
    [
      "đổ xăng 1 lít",
      {
        kind: "expense", amount: 100_000, title: "Đổ xăng", date: today,
        categoryId: findCategory(lists, "expense", ["xang", "di lai"]),
        accountId: null, toAccountId: null,
      },
    ],
  ]
  if (transferFrom && transferTo && transferFrom !== transferTo) {
    shots.push([
      `chuyển 3 xị từ ${transferFrom.account.name} sang ${transferTo.account.name}`,
      {
        kind: "transfer", amount: 300_000, title: `Chuyển sang ${transferTo.account.name}`, date: today,
        categoryId: null, accountId: transferFrom.key, toAccountId: transferTo.key,
      },
    ])
  }
  return shots.flatMap(([said, reply]) => [
    { role: "user" as const, content: said },
    { role: "assistant" as const, content: JSON.stringify({ ...reply, isTransaction: true }) },
  ])
}

/** The conversation that asks the model to read `request`, and its keys to read the answer back with. */
export function buildTransactionPrompt(request: string, context: Context) {
  const lists = buildLists(context)
  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt(lists, context.today) },
    ...examples(lists, context.today),
    { role: "user", content: request },
  ]
  return { messages, lists }
}

function isDateKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
  )
}

/**
 * A day the model gave, never after today: "ngày 30" said early in October
 * comes back as 30 October and means 30 September.
 */
function readDate(value: unknown, today: string) {
  if (!isDateKey(value)) return today
  if (value <= today) return value
  const [year, month, day] = value.split("-").map(Number)
  const lastMonth = new Date(Date.UTC(year, month - 2, day)).toISOString().slice(0, 10)
  // A day the month before does not have (31 September) rolls over; give up.
  return lastMonth.endsWith(`-${String(day).padStart(2, "0")}`) && lastMonth <= today ? lastMonth : today
}

/**
 * The model's answer as a draft, trusting none of it: unknown keys, a
 * category of the other kind, an amount out of range all come back empty,
 * for the user to fill in. Null when the request was not about money.
 */
export function readTransactionReply(reply: unknown, lists: Lists, today: string): AiTransactionDraft | null {
  const value = (typeof reply === "object" && reply !== null ? reply : {}) as Partial<Record<keyof Reply, unknown>>
  const kind = value.kind
  if (value.isTransaction === false) return null
  if (kind !== "expense" && kind !== "income" && kind !== "transfer") return null

  const accountId = (key: unknown) => lists.accounts.find((entry) => entry.key === key)?.account.id
  const category =
    kind === "transfer" ? undefined : lists.categories.find((entry) => entry.key === value.categoryId)?.item
  const fromId = accountId(value.accountId)
  const toId = kind === "transfer" ? accountId(value.toAccountId) : undefined
  const amount = value.amount
  const title = typeof value.title === "string" ? value.title.trim().slice(0, 120) : ""

  return {
    kind,
    amount: typeof amount === "number" && Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_MONEY ? amount : null,
    title: title ? title[0].toLocaleUpperCase("vi-VN") + title.slice(1) : category?.name ?? "",
    categoryId: category?.type === kind ? category.id : undefined,
    // Unsaid, the money comes from the first account, as the add sheet starts.
    accountId: fromId ?? lists.accounts[0]?.account.id,
    toAccountId: toId !== fromId ? toId : undefined,
    date: readDate(value.date, today),
  }
}
