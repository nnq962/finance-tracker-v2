import { redirect } from "next/navigation"

import { debtsUrl } from "@/lib/debts/debts-url"

/** The old debts page (until 2026-10-21): now the Vay nợ view of Giao dịch, so old links and notices still land. */
export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  redirect(debtsUrl(debt))
}
