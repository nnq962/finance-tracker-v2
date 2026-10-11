"use server"

import { getAccounts } from "@/lib/accounts/repository"
import { aiJson } from "@/lib/ai/llm"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { toDateKey } from "@/lib/format-date"
import { plans } from "@/lib/plans/plans"
import { releaseAiRequest, reserveAiRequest } from "@/lib/plans/repository"
import { getAccountFlows, getTransactionsInRange } from "@/lib/transactions/repository"

import { answerQuestion, keepComparedPeriod } from "./answer"
import { classifyRequest } from "./intent"
import { buildQuestionPrompt, questionPlanSchema, readQuestionReply } from "./question-plan"
import type { AssistantContext, AssistantReply, QuestionPlan } from "./types"

const MAX_LENGTH = 300

/** A Vietnam day's start, as a moment. */
const dayStart = (dateKey: string) => new Date(`${dateKey}T00:00:00+07:00`)

/** The turn before as the client sent it back, kept only if it has the shape of one. */
function readContext(value: unknown): AssistantContext | undefined {
  if (!value || typeof value !== "object") return undefined
  const { question, plan } = value as { question?: unknown; plan?: unknown }
  if (typeof question !== "string" || !plan || typeof plan !== "object") return undefined
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
  if (intent === "other") return { kind: "other" }

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
    const { messages, keys } = buildQuestionPrompt(text, { accounts, categoryGroups, contacts, today }, context)
    const read = readQuestionReply(await aiJson(messages, questionPlanSchema), keys)
    const plan = read && keepComparedPeriod(read, context?.plan, today)
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
    })
    return { kind: "answer", answer, plan, quota }
  } catch (error) {
    console.error("Assistant: answering failed", error)
    await giveBack()
    return { kind: "failed" }
  }
}
