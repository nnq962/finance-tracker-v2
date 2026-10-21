import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { ArrowsLeftRight, SquaresFour, Wallet } from "@phosphor-icons/react/dist/ssr"
import {
  ArrowLeftRightIcon,
  LayoutDashboardIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

export type AppNavigationItem = {
  title: string
  mobileTitle: string
  url: string
  /** The sidebar's line icon (Lucide). */
  icon: LucideIcon
  /** The phone tab bar's filled glyph (Phosphor Fill, 2026-10-20), as iOS fills its tab icons. */
  tabIcon: PhosphorIcon
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    title: "Tổng quan",
    mobileTitle: "Tổng quan",
    url: "/overview",
    icon: LayoutDashboardIcon,
    tabIcon: SquaresFour,
  },
  {
    title: "Tài khoản",
    mobileTitle: "Tài khoản",
    url: "/budget",
    icon: WalletCardsIcon,
    tabIcon: Wallet,
  },
  {
    title: "Giao dịch",
    mobileTitle: "Giao dịch",
    url: "/transactions",
    icon: ArrowLeftRightIcon,
    tabIcon: ArrowsLeftRight,
  },
]
// Vay nợ left the menus on 2026-10-21: it is a view of Giao dịch (Giao dịch | Vay nợ), so the tab bar holds three pages and Timi.

/**
 * Pages opened from Settings rather than from the menus, such as the design
 * catalogue: Settings stays lit on them, as a tab does under a pushed screen.
 */
const settingsPages = ["/design"]

/** The menu item a page belongs to: its own, or Settings for the pages opened from it. */
export function menuUrlFor(pathname: string) {
  return settingsPages.includes(pathname) ? "/settings" : pathname
}
