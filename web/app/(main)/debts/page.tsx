import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import {
  getContacts,
  getDebts,
} from "@/lib/debts/repository"

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  const {
    data: [accounts, contacts, debts],
  } = await loadWithSession("debts", (user) =>
    Promise.all([
      getAccounts(user.uid),
      getContacts(user.uid),
      getDebts(user.uid),
    ]),
  )
  const requestedDebtId = debts.some((item) => item.id === debt) ? debt : undefined

  // Every debt comes with its payment history, so a tapped one's sheet opens
  // at once from what the browser has (2026-10-17).
  return (
    <DebtsDashboard
      requestedDebtId={requestedDebtId}
      accounts={accounts}
      initialContacts={contacts}
      initialDebts={debts}
    />
  )
}
