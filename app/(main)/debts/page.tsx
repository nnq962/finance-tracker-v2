import { DebtsDashboard } from "./_components/debts-dashboard"
import { contacts, debts } from "./_data/debts"

export default function DebtsPage() {
  return <DebtsDashboard initialContacts={contacts} initialDebts={debts} />
}
