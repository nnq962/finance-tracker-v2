import {
  ArrowLeftRightIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

export type AppNavigationItem = {
  title: string
  mobileTitle: string
  url: string
  icon: LucideIcon
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    title: "Tổng quan",
    mobileTitle: "Tổng quan",
    url: "/overview",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Giao dịch",
    mobileTitle: "Giao dịch",
    url: "/transactions",
    icon: ArrowLeftRightIcon,
  },
  {
    title: "Ngân sách",
    mobileTitle: "Ngân sách",
    url: "/budget",
    icon: WalletCardsIcon,
  },
  {
    title: "Nợ & Cho vay",
    mobileTitle: "Vay nợ",
    url: "/debts",
    icon: HandCoinsIcon,
  },
]

/**
 * Pages opened from Settings rather than from the menus, such as the design
 * catalogue: Settings stays lit on them, as a tab does under a pushed screen.
 */
const settingsPages = ["/design"]

/** The menu item a page belongs to: its own, or Settings for the pages opened from it. */
export function menuUrlFor(pathname: string) {
  return settingsPages.includes(pathname) ? "/settings" : pathname
}
