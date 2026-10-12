"use server"

import { getAccounts } from "@/lib/accounts/repository"
import { aiJson } from "@/lib/ai/llm"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { formatDate, toDateKey } from "@/lib/format-date"
import { plans } from "@/lib/plans/plans"
import { MISSION_REWARD, missionKeys, missionTitles } from "@/lib/onboarding/missions"
import { getMissionState } from "@/lib/onboarding/repository"
import { getPlanState, releaseAiRequest, reserveAiRequest } from "@/lib/plans/repository"
import { getAccountFlows, getDebtPaymentsInRange, getTransactionsInRange } from "@/lib/transactions/repository"

import { answerQuestion, keepComparedPeriod } from "./answer"
import { ASSISTANT_NAME, chatReply, takeChat } from "./chat"
import { classifyRequest } from "./intent"
import { buildQuestionPrompt, questionPlanSchema, readQuestionReply } from "./question-plan"
import type { Answer, AssistantContext, AssistantReply, QuestionPlan } from "./types"

const MAX_LENGTH = 300

/** A Vietnam day's start, as a moment. */
const dayStart = (dateKey: string) => new Date(`${dateKey}T00:00:00+07:00`)

/** The turn before as the client sent it back, kept only if it has the shape of one. */
function readContext(value: unknown): AssistantContext | undefined {
  if (!value || typeof value !== "object") return undefined
  const { question, plan, reply } = value as { question?: unknown; plan?: unknown; reply?: unknown }
  if (typeof question !== "string") return undefined
  if (typeof reply === "string") return { question: question.slice(0, MAX_LENGTH), reply: reply.slice(0, 600) }
  if (!plan || typeof plan !== "object") return undefined
  const candidate = plan as Partial<QuestionPlan>
  const strings = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === "string")
  if (
    typeof candidate.measure !== "string" ||
    typeof candidate.view !== "string" ||
    !candidate.period ||
    typeof candidate.period !== "object" ||
    !strings(candidate.groupIds) ||
    !strings(candidate.categoryIds) ||
    !strings(candidate.accountIds) ||
    !strings(candidate.contactIds)
  ) {
    return undefined
  }
  return { question: question.slice(0, MAX_LENGTH), plan: candidate as QuestionPlan }
}

/** The user's AI requests this month, the plan and when Pro ends, and the missions left; asking costs none. */
async function usageAnswer(userId: string): Promise<Answer> {
  const [state, missions] = await Promise.all([getPlanState(userId), getMissionState(userId)])
  const monthLeft = Math.max(0, state.aiLimit - state.aiUsed)
  const left = monthLeft + state.aiCredits
  const month = Number(toDateKey(new Date()).slice(5, 7))
  const nextMonth = (month % 12) + 1
  const isPro = state.plan === "pro"
  return {
    kicker: `Lượt AI · gói ${plans[state.plan].label}`,
    figureText: `Còn ${left} lượt`,
    line: [
      `Tháng ${month} đã dùng ${state.aiUsed}/${state.aiLimit} lượt`,
      state.aiCredits ? `còn ${state.aiCredits} lượt thưởng từ nhiệm vụ` : null,
      `lượt tháng mới có từ 1/${nextMonth}`,
      isPro ? null : `gói Pro có ${plans.pro.aiMonthlyLimit} lượt mỗi tháng`,
      isPro && state.proEndsAt ? `gói Pro dùng đến hết ${formatDate(toDateKey(state.proEndsAt))}` : null,
    ]
      .filter(Boolean)
      .join(", ") + ".",
    // The missions not yet rewarded: done ones wait to be claimed on the overview.
    blocks: (() => {
      const left = missionKeys.filter((key) => !missions.claimed.includes(key))
      return left.length
        ? [
            {
              type: "rows" as const,
              groups: [
                {
                  heading: `Nhiệm vụ còn lại · +${MISSION_REWARD} lượt mỗi nhiệm vụ`,
                  rows: left.map((key) => ({
                    icon: { kind: "initials" as const, text: missions.done[key] ? "✓" : "·" },
                    name: missionTitles[key],
                    sub: missions.done[key] ? "Đã xong, nhận thưởng ở Tổng quan" : "Chưa làm",
                    amount: MISSION_REWARD,
                    amountTone: "plain" as const,
                    amountText: `+${MISSION_REWARD} lượt`,
                  })),
                },
              ],
            },
          ]
        : []
    })(),
    followUps: [],
    link: isPro ? { label: "Xem lượt AI", href: "/settings" } : { label: "Nâng cấp Pro", href: "/settings?screen=plan" },
  }
}

/**
 * The assistant's one way in: sorts the request with the local model (free),
 * then answers a question about the user's money. A question counts against
 * the month's AI requests; one the model could not read is given back.
 * Records and other actions are only recognised here, and handed on.
 */
export async function askAssistantAction(request: string, previous?: unknown): Promise<AssistantReply> {
  const user = await requireSession()
  const text = typeof request === "string" ? request.trim().slice(0, MAX_LENGTH) : ""
  if (!text) return { kind: "other" }
  const context = readContext(previous)

  let intent
  try {
    intent = await classifyRequest(text, context?.question)
  } catch (error) {
    console.error("Assistant: sorting the request failed", error)
    return { kind: "failed" }
  }
  if (intent === "record") return { kind: "record", text }
  if (intent === "action") return { kind: "action" }
  if (intent === "usage") return { kind: "usage", answer: await usageAnswer(user.uid) }
  if (intent === "chat") {
    if (!takeChat(user.uid)) {
      return { kind: "chat", limited: true, text: `Hôm nay mình với bạn nói chuyện nhiều rồi đó 😄 Mai ${ASSISTANT_NAME} lại tán gẫu tiếp nhé, giờ mình quay lại chuyện tiền nong thôi.` }
    }
    try {
      return { kind: "chat", text: await chatReply(text, context) }
    } catch (error) {
      console.error("Assistant: chat failed", error)
      return { kind: "failed" }
    }
  }

  const reservation = await reserveAiRequest(user.uid)
  const quota = { used: reservation.used, limit: reservation.limit, credits: reservation.credits }
  if (!reservation.allowed) {
    return { kind: "quota", quota, proLimit: plans.pro.aiMonthlyLimit, isPro: reservation.limit >= plans.pro.aiMonthlyLimit }
  }
  const giveBack = () => releaseAiRequest(user.uid, reservation.source)

  try {
    const today = toDateKey(new Date())
    const [accounts, categoryGroups, contacts] = await Promise.all([
      getAccounts(user.uid),
      getCategoryGroups(user.uid),
      getContacts(user.uid),
    ])
    const previousQuestion = context?.plan ? { question: context.question, plan: context.plan } : undefined
    const { messages, keys } = buildQuestionPrompt(text, { accounts, categoryGroups, contacts, today }, previousQuestion)
    const read = readQuestionReply(await aiJson(messages, questionPlanSchema), keys)
    const plan = read && keepComparedPeriod(read, previousQuestion?.plan, today)
    if (!plan) {
      await giveBack()
      return { kind: "failed" }
    }
    if (!plan.answerable) {
      // Nothing to look up: not worth a request.
      await giveBack()
      return { kind: "other" }
    }

    const answer = await answerQuestion(plan, {
      today,
      accounts,
      categoryGroups,
      contacts,
      debts: () => getDebts(user.uid),
      transactions: (start, end) => getTransactionsInRange(user.uid, dayStart(start), dayStart(end), { excludeDebts: true }),
      flows: (start, end) => getAccountFlows(user.uid, dayStart(start), dayStart(end)),
      debtPayments: (start, end) => getDebtPaymentsInRange(user.uid, dayStart(start), dayStart(end)),
    })
    return { kind: "answer", answer, plan, quota }
  } catch (error) {
    console.error("Assistant: answering failed", error)
    await giveBack()
    return { kind: "failed" }
  }
}
