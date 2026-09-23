import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import { contacts, debts } from "./_data/debts"

export default async function DebtsPage() {
  const user = await requireSession()
  const accounts = await getAccounts(user.uid)

  return (
    <DebtsDashboard
      accounts={accounts.filter((account) => account.status === "active")}
      initialContacts={contacts}
      initialDebts={debts}
    />
  )
}
