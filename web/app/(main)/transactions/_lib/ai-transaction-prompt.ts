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

/**
 * When it happened, as said: the model only notes the words ("thứ năm tuần
 * trước" is weekday 5, weeksAgo 1) and the day is worked out here.
 */
type When = {
  daysAgo: number | null
  weekday: number | null
  weeksAgo: number | null
  day: number | null
  month: number | null
}

/** What the model answers, held to `transactionReplySchema`. */
type Reply = When & {
  kind: TransactionKind
  /** The amount in the words said ("7 cành"), written down before it is worked out. */
  amountSaid: string
  amount: number | null
  categoryId: string | null
  accountId: string | null
  toAccountId: string | null
  note: string
  isTransaction: boolean
}

export const transactionReplySchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["expense", "income", "transfer"] },
    amountSaid: { type: "string" },
    amount: { type: ["integer", "null"] },
    daysAgo: { type: ["integer", "null"] },
    weekday: { type: ["integer", "null"] },
    weeksAgo: { type: ["integer", "null"] },
    day: { type: ["integer", "null"] },
    month: { type: ["integer", "null"] },
    categoryId: { type: ["string", "null"] },
    accountId: { type: ["string", "null"] },
    toAccountId: { type: ["string", "null"] },
    // After the category, so it holds only what the category leaves out.
    note: { type: "string" },
    isTransaction: { type: "boolean" },
  },
  required: ["kind", "amountSaid", "amount", "daysAgo", "weekday", "weeksAgo", "day", "month", "categoryId", "accountId", "toAccountId", "note", "isTransaction"],
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

Hôm nay là ${weekday}, ${today}.

Số tiền: amountSaid chép nguyên văn cụm số tiền người nói ("7 cành", "1tr2", "sáu mươi lăm nghìn"), "" nếu không nói; amount là số nguyên VND của đúng cụm đó:
- k, nghìn, ngàn, ng, cành = 1.000; lít, xị = 100.000; triệu, tr, củ, m = 1.000.000; tỷ, tỏi = 1.000.000.000.
- "1tr2" = 1.200.000, "2 triệu rưỡi" = 2.500.000, "35 nghìn rưỡi" = 35.500, "1 lít rưỡi" = 150.000. Số có thể viết bằng chữ.
- Không nói số tiền thì amount = null. Chỉ nhân đúng con số đã nói với đơn vị: "7 cành" = 7.000, "70 cành" = 70.000. Đừng nhầm số lượng ("2 ly") hay giờ ("4h") với số tiền.

Loại (kind): "expense" chi, "income" thu (lương, thưởng, được cho, bán được, hoàn tiền, lãi), "transfer" chuyển giữa hai tài khoản của chính mình (nạp, rút, chuyển từ A sang B). Trả tiền cho người khác bằng chuyển khoản vẫn là expense. Rút tiền mà không nói rút vào đâu thì là rút ra tài khoản tiền mặt.

Ngày: KHÔNG tự tính ra ngày, chỉ ghi lại người nói đã nói gì; trường nào không nói thì null, không nói gì về ngày thì tất cả null.
- daysAgo: hôm nay, sáng nay = 0; hôm qua, tối qua = 1; hôm kia = 2; "3 hôm trước" = 3.
- weekday: thứ hai = 2, thứ ba = 3, thứ tư = 4, thứ năm = 5, thứ sáu = 6, thứ bảy = 7, chủ nhật = 8. weeksAgo: tuần này = 0, tuần trước = 1; không nói tuần thì null.
- day, month: "ngày 5" là day 5; "mùng 2 tháng 9" là day 2, month 9. "Lương tháng 9" là tên khoản, không phải ngày.

note: ghi chú, CHỈ gồm chi tiết mà danh mục chưa nói lên: nơi chốn, người đi cùng, món hay đồ cụ thể, tháng của khoản lương... Giữ gần lời người nói, viết hoa chữ đầu, bỏ số tiền, ngày và thời gian ("tháng này", "hôm qua"), tài khoản và những gì tên danh mục đã nói. Danh mục là nhóm chung (Quần áo, Đồ gia dụng...) thì ghi tên món cụ thể ("Áo khoác"). Phần lớn câu không có chi tiết thêm: khi đó note = "".

categoryId: id danh mục cụ thể nhất CÙNG loại (chi cho expense, thu cho income); chọn theo nghĩa, không chỉ theo chữ (mẹ, bố, anh chị em là gia đình); mục "khác" chỉ khi không mục nào hợp; null nếu là transfer hoặc không có gì hợp.
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
function examples(lists: Lists): OllamaMessage[] {
  const when = (said: Partial<When> = {}): When => ({
    daysAgo: null, weekday: null, weeksAgo: null, day: null, month: null, ...said,
  })
  const ofType = (type: Account["type"]) => lists.accounts.filter(({ account }) => account.type === type)
  const wallet = ofType("e-wallet")[0]
  const [bank, secondBank = bank] = ofType("bank")
  const transferFrom = bank ?? lists.accounts[0]
  const transferTo = (wallet ?? lists.accounts.find((entry) => entry !== transferFrom))
  const shots: [string, Omit<Reply, "isTransaction">][] = [
    [
      `cà phê sáng 25 cành${wallet ? ` ${wallet.account.name}` : ""}`,
      {
        kind: "expense", amountSaid: "25 cành", amount: 25_000, note: "", ...when(),
        categoryId: findCategory(lists, "expense", ["ca phe", "an sang", "an uong"]),
        accountId: wallet?.key ?? null, toAccountId: null,
      },
    ],
    [
      `hôm qua nhận lương tháng 9 18 củ${bank ? ` vào ${bank.account.name}` : ""}`,
      {
        kind: "income", amountSaid: "18 củ", amount: 18_000_000, note: "Tháng 9", ...when({ daysAgo: 1 }),
        categoryId: findCategory(lists, "income", ["luong"]),
        accountId: bank?.key ?? null, toAccountId: null,
      },
    ],
    [
      `đóng tiền nhà 4 triệu rưỡi${secondBank ? ` chuyển khoản ${secondBank.account.name}` : ""}`,
      {
        kind: "expense", amountSaid: "4 triệu rưỡi", amount: 4_500_000, note: "", ...when(),
        categoryId: findCategory(lists, "expense", ["thue nha", "tien nha", "nha"]),
        accountId: secondBank?.key ?? null, toAccountId: null,
      },
    ],
    [
      "đổ xăng 1 lít",
      {
        kind: "expense", amountSaid: "1 lít", amount: 100_000, note: "", ...when(),
        categoryId: findCategory(lists, "expense", ["xang", "di lai"]),
        accountId: null, toAccountId: null,
      },
    ],
    [
      "ăn trưa 60 cành ở quán cô Ba",
      {
        kind: "expense", amountSaid: "60 cành", amount: 60_000, note: "Ở quán cô Ba", ...when(),
        categoryId: findCategory(lists, "expense", ["an trua", "com", "an uong"]),
        accountId: null, toAccountId: null,
      },
    ],
    [
      "mua đôi giày 800k",
      {
        kind: "expense", amountSaid: "800k", amount: 800_000, note: "Đôi giày", ...when(),
        categoryId: findCategory(lists, "expense", ["giay", "quan ao", "mua sam"]),
        accountId: null, toAccountId: null,
      },
    ],
  ]
  if (transferFrom && transferTo && transferFrom !== transferTo) {
    shots.push([
      `chuyển 3 xị từ ${transferFrom.account.name} sang ${transferTo.account.name}`,
      {
        kind: "transfer", amountSaid: "3 xị", amount: 300_000, note: "", ...when(),
        categoryId: null, accountId: transferFrom.key, toAccountId: transferTo.key,
      },
    ])
  }
  return shots.flatMap(([said, reply]) => [
    { role: "user" as const, content: said },
    // In the schema's order, which the model answers in.
    {
      role: "assistant" as const,
      content: JSON.stringify(
        { ...reply, isTransaction: true },
        Object.keys(transactionReplySchema.properties),
      ),
    },
  ])
}

/** The conversation that asks the model to read `request`, and its keys to read the answer back with. */
export function buildTransactionPrompt(request: string, context: Context) {
  const lists = buildLists(context)
  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt(lists, context.today) },
    ...examples(lists),
    { role: "user", content: request },
  ]
  return { messages, lists }
}

/** A whole number from `min` to `max`, or null. */
function wholeIn(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null
}

/** The "YYYY-MM-DD" key of a day, or null when the month has no such day (31 September). */
function dayKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCDate() === day ? date.toISOString().slice(0, 10) : null
}

/**
 * The day meant by what was said, never after today: "ngày 30" said early
 * in October is 30 September, "thứ sáu" said on a Tuesday is last week's.
 */
function resolveDay(said: Partial<Record<keyof When, unknown>>, today: string) {
  const [year, month] = today.split("-").map(Number)

  const day = wholeIn(said.day, 1, 31)
  if (day !== null) {
    const saidMonth = wholeIn(said.month, 1, 12)
    // This month's (or the month said), unless it is still to come: then
    // the month (or year) before's.
    const latest = dayKey(year, saidMonth ?? month, day)
    const earlier = saidMonth ? dayKey(year - 1, saidMonth, day) : dayKey(year, month - 1, day)
    const chosen = latest && latest <= today ? latest : earlier
    return chosen && chosen <= today ? chosen : today
  }

  const weekday = wholeIn(said.weekday, 2, 8)
  if (weekday !== null) {
    const sinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
    const monday = shiftDate(today, -sinceMonday - 7 * (wholeIn(said.weeksAgo, 0, 52) ?? 0))
    const candidate = shiftDate(monday, weekday - 2)
    return candidate > today ? shiftDate(candidate, -7) : candidate
  }

  const daysAgo = wholeIn(said.daysAgo, 0, 366)
  return daysAgo === null ? today : shiftDate(today, -daysAgo)
}

/**
 * The model's answer as a draft, trusting none of it: unknown keys, a
 * category of the other kind, an amount out of range all come back empty,
 * for the user to fill in. Null when the request was not about money.
 */
export function readTransactionReply(
  reply: unknown,
  { request, lists, today }: { request: string; lists: Lists; today: string },
): AiTransactionDraft | null {
  const value = (typeof reply === "object" && reply !== null ? reply : {}) as Partial<Record<keyof Reply, unknown>>
  const kind = value.kind
  if (value.isTransaction === false) return null
  if (kind !== "expense" && kind !== "income" && kind !== "transfer") return null

  const accountId = (key: unknown) => lists.accounts.find((entry) => entry.key === key)?.account.id
  const category =
    kind === "transfer" ? undefined : lists.categories.find((entry) => entry.key === value.categoryId)?.item
  const fromId = accountId(value.accountId)
  // A withdrawal that does not say where to goes into cash, which the model
  // knows but does not always tie to a cash account under another name ("Ví").
  const cash = lists.accounts.find(({ account }) => account.type === "cash" && account.id !== fromId)
  const toId =
    kind === "transfer"
      ? accountId(value.toAccountId) ?? (/\brut\b/.test(normalize(request)) ? cash?.account.id : undefined)
      : undefined
  const amount = value.amount
  const said = typeof value.note === "string" ? value.note.trim().slice(0, 200) : ""
  // A note that only repeats the category, or the day ("Tháng này"), says nothing.
  const note =
    (category && normalize(said) === normalize(category.name)) ||
    /^(thang|tuan|hom|sang|trua|chieu|toi) (nay|qua|kia|truoc)$/.test(normalize(said))
      ? ""
      : said

  return {
    kind,
    amount: typeof amount === "number" && Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_MONEY ? amount : null,
    note: note ? note[0].toLocaleUpperCase("vi-VN") + note.slice(1) : "",
    categoryId: category?.type === kind ? category.id : undefined,
    // Unsaid, the money comes from the first account, as the add sheet starts.
    accountId: fromId ?? lists.accounts[0]?.account.id,
    toAccountId: toId !== fromId ? toId : undefined,
    date: resolveDay(value, today),
  }
}
