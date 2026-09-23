import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import { getContacts, getDebts } from "@/lib/debts/repository"

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  const user = await requireSession()
  const [accounts, contacts, debts] = await Promise.all([getAccounts(user.uid), getContacts(user.uid), getDebts(user.uid)])

  return (
    <DebtsDashboard
      selectedDebtId={debt}
      accounts={accounts}
      initialContacts={contacts}
      initialDebts={debts}
    />
  )
}
