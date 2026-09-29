import {
  ArrowLeftRightIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  TagsIcon,
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
    title: "Tài khoản",
    mobileTitle: "Tài khoản",
    url: "/accounts",
    icon: WalletCardsIcon,
  },
  {
    title: "Hạng mục",
    mobileTitle: "Hạng mục",
    url: "/categories",
    icon: TagsIcon,
  },
  {
    title: "Nợ & Cho vay",
    mobileTitle: "Vay nợ",
    url: "/debts",
    icon: HandCoinsIcon,
  },
]
