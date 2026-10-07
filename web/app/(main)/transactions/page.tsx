import { Page } from "@/components/page"

import { TransactionsScreen } from "./_components/transactions-screen"
import { loadTransactions, type TransactionsSearchParams } from "./_lib/load-transactions"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>
}) {
  const data = await loadTransactions(await searchParams)

  return (
    <Page>
      <TransactionsScreen {...data} />
    </Page>
  )
}
