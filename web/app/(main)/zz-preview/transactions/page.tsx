// Temporary mockup of the new transactions page, with the real data:
// reviewed here, then it replaces /transactions. Not committed.
import { notFound } from "next/navigation"

import { Page } from "@/components/page"

import { TransactionsScreen } from "../../transactions/_components/transactions-screen"
import { loadTransactions, type TransactionsSearchParams } from "../../transactions/_lib/load-transactions"

export default async function TransactionsPreviewPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const data = await loadTransactions(await searchParams)

  return (
    <Page>
      <TransactionsScreen {...data} />
    </Page>
  )
}
