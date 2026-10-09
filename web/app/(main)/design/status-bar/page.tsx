import { notFound } from "next/navigation"

import { Page } from "@/components/page"

import { StatusBarLab } from "./status-bar-lab"

/**
 * Dev only: a bench for how Safari tints the status bar under an overlay,
 * to compare the bar with the dimmed content by eye on a phone.
 */
export default function StatusBarLabPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <Page>
      <StatusBarLab />
    </Page>
  )
}
