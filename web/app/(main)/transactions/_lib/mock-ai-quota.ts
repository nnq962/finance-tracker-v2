import * as React from "react"

export const AI_DAILY_LIMIT = 20

/**
 * Today's AI requests against the daily limit. A stand-in until the AI is
 * connected: requests are counted in this tab only, not by the server.
 */
export function useMockAiQuota() {
  const [used, setUsed] = React.useState(0)
  return {
    limit: AI_DAILY_LIMIT,
    remaining: Math.max(0, AI_DAILY_LIMIT - used),
    record: () => setUsed((current) => current + 1),
  }
}
