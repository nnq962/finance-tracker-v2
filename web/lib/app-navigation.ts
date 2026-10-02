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
