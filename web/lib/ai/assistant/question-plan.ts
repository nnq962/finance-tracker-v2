import "server-only"

import type { ChatMessage } from "@/lib/ai/llm"
import { archivedLabel } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Contact } from "@/lib/debts/types"
import {
  BALANCE_ADJUSTMENT_GROUP,
  BALANCE_ADJUSTMENT_NAME,
  DEBT_INTEREST_GROUP,
  DEBT_INTEREST_NAME,
  TRANSFER_FEE_GROUP,
  TRANSFER_FEE_NAME,
} from "@/lib/transactions/types"

import type { Compare, Measure, PeriodPreset, QuestionPlan, View } from "./types"

const measures: Measure[] = [
  "spending",
  "income",
  "net",
  "transactions",
  "transfers",
  "account_flow",
  "balance",
  "account_info",
  "lent",
  "borrowed",
  "debts",
  "debts_due",
  "collected",
  "repaid",
  "new_lent",
  "new_borrowed",
  "net_worth",
]
/** Measured now, not over a period: no period unless one is asked for. */
const timeless: Measure[] = ["balance", "account_info", "lent", "borrowed", "debts", "debts_due", "net_worth"]
const views: View[] = ["total", "by_group", "by_category", "by_account", "by_day", "by_month", "top", "list"]
const presets: PeriodPreset[] = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "last_days",
  "last_months",
  "month",
  "year",
  "range",
  "all",
]
const compares: Compare[] = ["none", "previous", "last_year"]

/** What the model fills in: the plan, flat, with the user's things under short keys ("g2", "c3", "a1", "p1"). */
export const questionPlanSchema = {
  type: "object",
  properties: {
    answerable: { type: "boolean" },
    measure: { type: "string", enum: measures },
    view: { type: "string", enum: views },
    periodPreset: { type: "string", enum: presets },
    periodDays: { type: ["integer", "null"] },
    periodMonths: { type: ["integer", "null"] },
    periodMonth: { type: ["integer", "null"] },
    periodYear: { type: ["integer", "null"] },
    periodFrom: { type: ["string", "null"] },
    periodTo: { type: ["string", "null"] },
    compare: { type: "string", enum: compares },
    order: { type: "string", enum: ["most", "least"] },
    groupIds: { type: "array", items: { type: "string" } },
    categoryIds: { type: "array", items: { type: "string" } },
    accountIds: { type: "array", items: { type: "string" } },
    contactIds: { type: "array", items: { type: "string" } },
    search: { type: "string" },
    minAmount: { type: ["integer", "null"] },
    maxAmount: { type: ["integer", "null"] },
    onlyExcluded: { type: "boolean" },
    debtStatus: { type: "string", enum: ["open", "settled"] },
    limit: { type: ["integer", "null"] },
  },
  required: [
    "answerable",
    "measure",
    "view",
    "periodPreset",
    "periodDays",
    "periodMonths",
    "periodMonth",
    "periodYear",
    "periodFrom",
    "periodTo",
    "compare",
    "order",
    "groupIds",
    "categoryIds",
    "accountIds",
    "contactIds",
    "search",
    "minAmount",
    "maxAmount",
    "onlyExcluded",
    "debtStatus",
    "limit",
  ],
}

type Reply = {
  answerable: boolean
  measure: Measure
  view: View
  periodPreset: PeriodPreset
  periodDays: number | null
  periodMonths: number | null
  periodMonth: number | null
  periodYear: number | null
  periodFrom: string | null
  periodTo: string | null
  compare: Compare
  order: "most" | "least"
  groupIds: string[]
  categoryIds: string[]
  accountIds: string[]
  contactIds: string[]
  search: string
  minAmount: number | null
  maxAmount: number | null
  onlyExcluded: boolean
  debtStatus: "open" | "settled"
  limit: number | null
}

type Context = { accounts: Account[]; categoryGroups: CategoryGroup[]; contacts: Contact[]; today: string }

/** The user's things under short keys, both ways. */
export type Keys = { toId: Map<string, string>; toKey: Map<string, string> }

const systemGroups = [
  { id: TRANSFER_FEE_GROUP, name: TRANSFER_FEE_NAME, note: "chi, phí của các lần chuyển khoản" },
  { id: DEBT_INTEREST_GROUP, name: DEBT_INTEREST_NAME, note: "thu khi người khác trả lãi, chi khi người dùng trả lãi" },
  { id: BALANCE_ADJUSTMENT_GROUP, name: BALANCE_ADJUSTMENT_NAME, note: "thu hoặc chi, khi sửa số dư tài khoản" },
]

function buildKeys({ accounts, categoryGroups, contacts }: Context) {
  const lines: string[] = []
  const toId = new Map<string, string>()
  const toKey = new Map<string, string>()
  const add = (key: string, id: string) => {
    toId.set(key, id)
    toKey.set(id, key)
  }

  lines.push("Nhóm hạng mục (groupIds):")
  categoryGroups.forEach((group, index) => {
    add(`g${index + 1}`, group.id)
    lines.push(`- g${index + 1}: ${group.name} (${group.type === "income" ? "thu" : "chi"})`)
  })
  // What the app counts on its own, with no group of the user's.
  systemGroups.forEach((group, index) => {
    const key = `g${categoryGroups.length + index + 1}`
    add(key, group.id)
    lines.push(`- ${key}: ${group.name} (${group.note})`)
  })
  lines.push("Hạng mục (categoryIds):")
  let item = 0
  for (const group of categoryGroups) {
    for (const category of group.items) {
      item += 1
      add(`c${item}`, category.id)
      lines.push(`- c${item}: ${group.name} › ${category.name}`)
    }
  }
  lines.push("Tài khoản (accountIds):")
  accounts.forEach((account, index) => {
    add(`a${index + 1}`, account.id)
    lines.push(`- a${index + 1}: ${account.name}${account.status === "archived" ? ` (${archivedLabel(account)})` : ""}`)
  })
  lines.push("Người vay và cho vay (contactIds):")
  contacts.forEach((contact, index) => {
    add(`p${index + 1}`, contact.id)
    lines.push(`- p${index + 1}: ${contact.name}`)
  })
  return { lines: lines.join("\n"), keys: { toId, toKey } }
}

const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]

function systemPrompt(lists: string, today: string) {
  const weekday = weekdays[new Date(`${today}T00:00:00Z`).getUTCDay()]
  return `Bạn đọc câu hỏi của người dùng về tiền của chính họ trong app ghi chép thu chi, và điền một yêu cầu tra cứu. Bạn không tính và không trả lời con số: code sẽ tra theo yêu cầu bạn điền.

Hôm nay là ${weekday}, ${today}. Tuần bắt đầu từ thứ hai.

Các trường:
- answerable: false nếu câu hỏi cần thứ app không có (giá vàng, tỷ giá, lời khuyên đầu tư, số dư tại một ngày trong quá khứ, dự đoán). Khi đó các trường khác để mặc định.
- measure, trong một khoảng thời gian:
  spending = tiền đã chi (kể cả phí chuyển khoản và tiền lãi trả cho khoản đi vay); income = tiền đã nhận (kể cả tiền lãi người khác trả cho khoản cho vay; tiền gốc vay và trả nợ không phải thu chi); net = thu trừ chi (dư bao nhiêu, lời lỗ, thu chi); transactions = mọi giao dịch, không phân biệt thu chi; transfers = chuyển tiền giữa các tài khoản của người dùng (kèm phí); account_flow = tiền vào và tiền ra của tài khoản ("tiền vào ra Vietcombank"); collected = tiền người khác trả nợ cho người dùng (thu nợ); repaid = tiền người dùng trả nợ cho người khác (trả nợ); new_lent = khoản cho vay mới ghi; new_borrowed = khoản đi vay mới ghi.
- measure, hiện tại (không cần thời gian):
  balance = số dư tài khoản; account_info = thông tin tài khoản: số dư ban đầu, ngày mở, ghi chú, tài khoản đã khoá; lent = người khác đang nợ người dùng (cho vay); borrowed = người dùng đang nợ người khác (đi vay); debts = cả cần thu lẫn cần trả; debts_due = khoản nợ sắp đến hạn hoặc quá hạn, cả hai chiều; net_worth = tài sản ròng (tổng tài sản, "mình có bao nhiêu tiền tất cả"). Hỏi về một khoản nợ của một người (đã trả bao nhiêu, lãi, hạn trả, lịch sử trả) là lent hoặc borrowed với contactIds của người đó.
- view: total = một con số; by_group = chia theo nhóm hạng mục; by_category = chia theo hạng mục; by_account = chia theo tài khoản; by_day = theo từng ngày ("ngày nào chi nhiều nhất"); by_month = theo từng tháng ("6 tháng gần đây", "từng tháng năm nay"); top = những khoản lớn nhất; list = liệt kê các giao dịch. Hỏi "tiêu vào đâu", "hạng mục nào nhiều nhất" là by_group (hoặc by_category khi đã chọn một nhóm). Hỏi "khoản nào lớn nhất" là top. Hỏi "những khoản", "các giao dịch", "đã chi gì" là list.
- order: most = nhiều nhất, lớn nhất (mặc định); least = ít nhất, nhỏ nhất, "chi gì ít nhất", "khoản nhỏ nhất". Dùng cùng view top (từng khoản) hoặc by_group / by_category / by_account (theo nhóm).
- periodPreset: today, yesterday, this_week, last_week, this_month, last_month, this_year, last_year; last_days = n ngày gần đây (periodDays = n); last_months = n tháng gần đây kể cả tháng này (periodMonths = n); month = một tháng (periodMonth, periodYear nếu nói năm, không thì null); year = một năm (periodYear); range = từ ngày đến ngày (periodFrom, periodTo dạng YYYY-MM-DD); all = từ trước tới nay. Không nói thời gian: các measure hiện tại dùng all; by_month không nói thời gian dùng last_months với periodMonths = 6; còn lại dùng this_month.
- compare: previous = so với kỳ trước liền kề (tháng trước, tuần trước); last_year = so với cùng kỳ năm ngoái; none khi không hỏi so sánh. Khi có so sánh, view là total hoặc by_group.
- groupIds, categoryIds, accountIds, contactIds: chỉ dùng các mã trong danh sách bên dưới, khi người dùng nhắc tới. Một nhóm cả nhóm thì dùng groupIds. Không nhắc thì để [].
- search: từ cần tìm trong ghi chú khi người dùng nhắc một món không có hạng mục riêng ("phở", "trà sữa"); không thì "".
- minAmount, maxAmount: số tiền mỗi khoản, bằng đồng, khi người dùng nói ("trên 500 nghìn" thì minAmount = 500000; "dưới 100k" thì maxAmount = 100000); không thì null.
- onlyExcluded: true khi hỏi những khoản "không tính vào báo cáo", "ngoài báo cáo" (hay "không tính vào thống kê"); không thì false.
- debtStatus: settled chỉ khi hỏi danh sách các khoản nợ đã trả xong, đã tất toán (khi đó measure là debts, hoặc lent / borrowed nếu nói rõ chiều); hỏi một người "đã trả được bao nhiêu", "còn nợ bao nhiêu" là open. Không thì open.
- limit: số dòng khi người dùng nói rõ ("5 khoản lớn nhất"); không thì null.

Câu hỏi nối tiếp câu trước giữ nguyên mọi trường của yêu cầu trước, chỉ đổi phần được nhắc tới:
- "còn tháng trước?", "thế tháng 8 thì sao?": đổi kỳ sang kỳ được nhắc.
- "thế ăn uống thì sao?": đổi hạng mục.
- "so với tháng trước", "so với tháng 8 thì sao?", "nhiều hơn hay ít hơn tháng trước?": KHÔNG đổi kỳ; kỳ được nhắc sau chữ "so với" là kỳ để so, không phải kỳ để xem. Giữ nguyên các trường period* của yêu cầu trước và đặt compare = previous (last_year nếu so với năm ngoái). Ví dụ đang xem tháng 9 mà hỏi "so với tháng 8" thì periodMonth vẫn là 9.

${lists}`
}

type Example = [string, Partial<Reply>]

const base: Reply = {
  answerable: true,
  measure: "spending",
  view: "total",
  periodPreset: "this_month",
  periodDays: null,
  periodMonths: null,
  periodMonth: null,
  periodYear: null,
  periodFrom: null,
  periodTo: null,
  compare: "none",
  order: "most",
  groupIds: [],
  categoryIds: [],
  accountIds: [],
  contactIds: [],
  search: "",
  minAmount: null,
  maxAmount: null,
  onlyExcluded: false,
  debtStatus: "open",
  limit: null,
}

const examples: Example[] = [
  ["tháng này tiêu hết bao nhiêu", {}],
  ["tuần trước tiêu vào những gì", { view: "by_group", periodPreset: "last_week" }],
  ["5 khoản chi lớn nhất tháng chín", { view: "top", periodPreset: "month", periodMonth: 9, limit: 5 }],
  ["năm nay lương được bao nhiêu so với năm ngoái", { measure: "income", periodPreset: "this_year", compare: "last_year" }],
  ["mấy hôm nay ăn phở hết bao nhiêu", { view: "list", periodPreset: "last_days", periodDays: 7, search: "phở" }],
  ["các giao dịch hôm qua", { measure: "transactions", view: "list", periodPreset: "yesterday" }],
  ["tài khoản nào còn nhiều tiền nhất", { measure: "balance", view: "by_account", periodPreset: "all" }],
  ["mình đang nợ ai", { measure: "borrowed", view: "list", periodPreset: "all" }],
  ["tài sản ròng của tôi là bao nhiêu", { measure: "net_worth", periodPreset: "all" }],
  ["tháng này chi gì ít nhất", { view: "by_group", order: "least" }],
  ["khoản chi nhỏ nhất tuần này", { view: "top", order: "least", periodPreset: "this_week" }],
  ["thu chi 6 tháng gần đây", { measure: "net", view: "by_month", periodPreset: "last_months", periodMonths: 6 }],
  ["ngày nào tháng này chi nhiều nhất", { view: "by_day" }],
  ["các khoản chi trên 1 triệu năm nay", { view: "list", periodPreset: "this_year", minAmount: 1000000 }],
  ["tháng này đã thu nợ được bao nhiêu", { measure: "collected" }],
  ["khoản nào sắp đến hạn", { measure: "debts_due", periodPreset: "all" }],
  ["tổng cần thu và cần trả", { measure: "debts", periodPreset: "all" }],
  ["những khoản nợ đã trả xong", { measure: "debts", periodPreset: "all", debtStatus: "settled" }],
  ["giá vàng hôm nay", { answerable: false }],
]

const reply = (fields: Partial<Reply>) => JSON.stringify({ ...base, ...fields })

/** The plan back in the model's terms, for a follow-up to build on. */
function planToReply(plan: QuestionPlan, keys: Keys): Reply {
  const key = (id: string) => keys.toKey.get(id)
  const known = (ids: string[]) => ids.map(key).filter((value): value is string => Boolean(value))
  return {
    answerable: plan.answerable,
    measure: plan.measure,
    view: plan.view,
    periodPreset: plan.period.preset,
    periodDays: plan.period.days,
    periodMonths: plan.period.months ?? null,
    periodMonth: plan.period.month,
    periodYear: plan.period.year,
    periodFrom: plan.period.from,
    periodTo: plan.period.to,
    compare: plan.compare,
    order: plan.order,
    groupIds: known(plan.groupIds),
    categoryIds: known(plan.categoryIds),
    accountIds: known(plan.accountIds),
    contactIds: known(plan.contactIds),
    search: plan.search,
    minAmount: plan.minAmount ?? null,
    maxAmount: plan.maxAmount ?? null,
    onlyExcluded: plan.onlyExcluded ?? false,
    debtStatus: plan.debtStatus ?? "open",
    limit: plan.limit,
  }
}

/** The conversation that asks the model to read `question`, the turn before it included. */
export function buildQuestionPrompt(
  question: string,
  context: Context,
  previous?: { question: string; plan: QuestionPlan },
) {
  const { lines, keys } = buildKeys(context)
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(lines, context.today) },
    ...examples.flatMap(([said, fields]) => [
      { role: "user" as const, content: said },
      { role: "assistant" as const, content: reply(fields) },
    ]),
    ...(previous
      ? [
          { role: "user" as const, content: previous.question },
          { role: "assistant" as const, content: JSON.stringify(planToReply(previous.plan, keys)) },
        ]
      : []),
    { role: "user", content: question },
  ]
  return { messages, keys }
}

const isDateKey = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
const whole = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null

/** The model's reply held to known values and turned into the user's ids; null when it is not a plan. */
export function readQuestionReply(value: unknown, keys: Keys): QuestionPlan | null {
  if (!value || typeof value !== "object") return null
  const reply = value as Partial<Record<keyof Reply, unknown>>
  const pick = <T extends string>(field: unknown, allowed: T[], fallback: T) =>
    allowed.includes(field as T) ? (field as T) : fallback
  const ids = (field: unknown, prefix: string) =>
    Array.isArray(field)
      ? [...new Set(field.filter((key): key is string => typeof key === "string" && key.startsWith(prefix)))]
          .map((key) => keys.toId.get(key))
          .filter((id): id is string => Boolean(id))
      : []

  const measure = pick(reply.measure, measures, "spending")
  return {
    answerable: reply.answerable !== false,
    measure,
    view: pick(reply.view, views, "total"),
    period: {
      preset: pick(reply.periodPreset, presets, timeless.includes(measure) ? "all" : "this_month"),
      days: whole(reply.periodDays, 1, 3660),
      months: whole(reply.periodMonths, 1, 120),
      month: whole(reply.periodMonth, 1, 12),
      year: whole(reply.periodYear, 2000, 2100),
      from: isDateKey(reply.periodFrom) ? reply.periodFrom : null,
      to: isDateKey(reply.periodTo) ? reply.periodTo : null,
    },
    compare: pick(reply.compare, compares, "none"),
    order: reply.order === "least" ? "least" : "most",
    groupIds: ids(reply.groupIds, "g"),
    categoryIds: ids(reply.categoryIds, "c"),
    accountIds: ids(reply.accountIds, "a"),
    contactIds: ids(reply.contactIds, "p"),
    search: typeof reply.search === "string" ? reply.search.trim().slice(0, 60) : "",
    minAmount: whole(reply.minAmount, 0, 999_999_999_999_999),
    maxAmount: whole(reply.maxAmount, 0, 999_999_999_999_999),
    onlyExcluded: reply.onlyExcluded === true,
    debtStatus: reply.debtStatus === "settled" ? "settled" : "open",
    limit: whole(reply.limit, 1, 20),
  }
}
