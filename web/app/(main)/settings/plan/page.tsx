import { redirect } from "next/navigation"

/**
 * The plans now open over settings (a sheet on a phone, a dialog on wider
 * screens); this keeps older links and payOS returns working.
 */
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  redirect(order ? `/settings?screen=plan&order=${encodeURIComponent(order)}` : "/settings?screen=plan")
}
