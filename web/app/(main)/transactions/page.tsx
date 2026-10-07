import { Page } from "@/components/page"

import { TransactionsDashboard } from "./_components/transactions-dashboard"
import { loadTransactions, type TransactionsSearchParams } from "./_lib/load-transactions"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>
}) {
  const data = await loadTransactions(await searchParams)

  return (
    <Page>
      <TransactionsDashboard {...data} />
    </Page>
  )
}
