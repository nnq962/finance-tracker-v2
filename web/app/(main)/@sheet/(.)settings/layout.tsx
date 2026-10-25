import type { ReactNode } from "react"

import { SettingsSheet } from "../../settings/_components/settings-sheet"

/** The sheet stays while its content loads, so it rises once, its skeleton first. */
export default function SettingsSheetLayout({ children }: { children: ReactNode }) {
  return <SettingsSheet>{children}</SettingsSheet>
}
