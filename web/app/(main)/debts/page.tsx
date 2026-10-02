import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import { compareDebtsByUrgency } from "./_lib/debt-presentation"
import {
  getContacts,
  getDebts,
} from "@/lib/debts/repository"

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  const {
    data: [accounts, contacts, allDebts],
  } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      getContacts(user.uid),
      getDebts(user.uid),
    ]),
  )
  // Without a debt in the URL, the side panel opens the most urgent open one.
  const defaultDebt = allDebts
    .filter((item) => item.status !== "settled")
    .sort(compareDebtsByUrgency)[0] ?? allDebts[0]
  const selectedDebtId = allDebts.some((item) => item.id === debt)
    ? debt
    : defaultDebt?.id
  // Only the selected debt's payment history goes to the browser; another
  // debt's loads when it is selected (the URL changes and the page reloads).
  const debts = allDebts.map((item) =>
    item.id === selectedDebtId ? item : { ...item, payments: undefined },
  )

  return (
    <DebtsDashboard
      selectedDebtId={selectedDebtId}
      accounts={accounts}
      initialContacts={contacts}
      initialDebts={debts}
    />
  )
}
