import "server-only"

import { after } from "next/server"

import { syncBudgetAlerts } from "@/lib/budgets/alerts"

/**
 * After spending is saved, changed or counted again: once the response has
 * gone, pushes the limits it has just taken to 80% or past 100%. A failure
 * is only logged; the transaction is saved either way.
 */
export function scheduleBudgetAlerts(userId: string) {
  after(async () => {
    try {
      await syncBudgetAlerts(userId, { notify: true })
    } catch (error) {
      console.error("Budget alerts failed", error)
    }
  })
}
