import { TransactionsPageViews } from "./_components/transactions-page-views"
import { loadTransactions, type TransactionsSearchParams } from "./_lib/load-transactions"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>
}) {
  const { view, contacts, debts, requestedDebtId, ...transactions } = await loadTransactions(await searchParams)

  return (
    <TransactionsPageViews
      view={view}
      transactions={transactions}
      debts={{ accounts: transactions.accounts, initialContacts: contacts, initialDebts: debts, requestedDebtId }}
    />
  )
}
