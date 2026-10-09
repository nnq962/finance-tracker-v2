import type * as React from "react"
import {
  ClockIcon,
  CoffeeIcon,
  HouseIcon,
  MicIcon,
  ShoppingBagIcon,
  SoupIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { PickGrid } from "@/components/app/pick-grid"
import { AccountLogo } from "@/components/account-logo"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ContactAvatar } from "@/app/(main)/debts/_components/contact-avatar"
import { cn } from "@/lib/utils"

// The welcome's pictures: the app's own blocks at their real size, with
// made-up figures, so each screen shows what it talks about as it will look.
// They are drawings: the welcome makes them inert and hides them from screen
// readers, the title and line under them say it all.

const amountRow = (amount: number, caption?: React.ReactNode) => (
  <span className="flex flex-col items-end">
    <Money amount={amount} sign="always" size="sm" tone={amount > 0 ? "income" : "default"} />
    {caption ? <span className="text-xs text-muted-foreground">{caption}</span> : null}
  </span>
)

const momo = {
  name: "MoMo",
  type: "e-wallet" as const,
  institutionName: "MoMo",
  logoUrl: "/institutions/wallets/momo.svg",
  logoFallback: "MM",
}

/** The net worth card of the overview, and the accounts it adds up. */
export function AccountsPicture() {
  const accounts = [
    { name: "Tiền mặt", type: "cash" as const, logoUrl: undefined, logoFallback: "TM", balance: 2_150_000 },
    { name: "Vietcombank", type: "bank" as const, logoUrl: "/institutions/banks/vietcombank.svg", logoFallback: "VCB", balance: 48_900_000 },
    { name: "MoMo", type: "e-wallet" as const, logoUrl: "/institutions/wallets/momo.svg", logoFallback: "MM", balance: 4_053_000 },
  ]

  return (
    <div className="flex w-full flex-col gap-3">
      <Card variant="inverse">
        <CardContent>
          <CardLabel as="p">Tài sản ròng</CardLabel>
          <Money amount={55_103_000} size="xl" className="mt-1.5" />
          <p className="mt-0.5 text-sm">
            <span className="font-semibold text-income tabular-nums">+3,2tr</span>
            <CardLabel as="span" className="ml-1.5">
              tháng này
            </CardLabel>
          </p>
        </CardContent>
      </Card>
      <SettingsGroup>
        {accounts.map((account) => (
          <SettingsRow
            key={account.name}
            media={<AccountLogo account={{ ...account, institutionName: account.name }} />}
            title={account.name}
            action={<Money amount={account.balance} size="sm" />}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}

/** The add-transaction form: the amount, large, and the categories' grid. */
export function AddTransactionPicture() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">Chi tiền</span>
        <Money amount={-45_000} size="xl" tone="expense" />
      </div>
      <PickGrid
        id="welcome-categories"
        caption="Hạng mục"
        value="lunch"
        onValueChange={() => {}}
        onShowAll={() => {}}
        items={[
          { id: "lunch", label: "Ăn trưa", media: <IconTile icon={SoupIcon} tone="orange" /> },
          { id: "coffee", label: "Cà phê", media: <IconTile icon={CoffeeIcon} tone="orange" /> },
          { id: "shopping", label: "Mua sắm", media: <IconTile icon={ShoppingBagIcon} tone="pink" /> },
        ]}
      />
      <SettingsGroup>
        <SettingsRow
          media={<AccountLogo account={momo} />}
          title="Tài khoản"
          value="MoMo"
        />
        <SettingsRow icon={ClockIcon} title="Thời gian" value="Hôm nay, 12:04" />
      </SettingsGroup>
    </div>
  )
}

/** What is said to the AI, as messages, and the transactions they become. */
export function AiPicture() {
  const said = (text: string) => (
    <p className="flex items-center gap-2 self-end rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
      <MicIcon className="size-4" aria-hidden="true" />
      {text}
    </p>
  )

  return (
    <div className="flex w-full flex-col gap-3">
      {said("ăn trưa 45k ví MoMo")}
      {said("lương về 18 triệu Vietcombank")}
      <SparklesIcon className="size-5 self-center text-ai-strong" aria-hidden="true" />
      <SettingsGroup>
        <SettingsRow
          icon={SoupIcon}
          tone="orange"
          title="Ăn trưa"
          description="MoMo"
          action={amountRow(-45_000, "12:04")}
        />
        <SettingsRow
          icon={WalletIcon}
          tone="emerald"
          title="Lương"
          description="Vietcombank"
          action={amountRow(18_000_000, "12:05")}
        />
      </SettingsGroup>
    </div>
  )
}

/** The overview's money in and out by month, and where the spending goes. */
export function OverviewPicture() {
  const months = [
    { label: "T5", income: 0.7, expense: 0.55 },
    { label: "T6", income: 0.75, expense: 0.7 },
    { label: "T7", income: 0.7, expense: 0.5 },
    { label: "T8", income: 0.9, expense: 0.65 },
    { label: "T9", income: 0.75, expense: 0.8 },
    { label: "T10", income: 1, expense: 0.6 },
  ]
  const categories = [
    { name: "Ăn uống", share: 42, icon: SoupIcon, tone: "orange" as const },
    { name: "Nhà cửa", share: 31, icon: HouseIcon, tone: "blue" as const },
    { name: "Mua sắm", share: 17, icon: ShoppingBagIcon, tone: "pink" as const },
  ]

  return (
    <div className="flex w-full flex-col gap-3">
      <Card size="sm">
        <CardContent>
          <CardLabel as="p">Thu và chi theo tháng</CardLabel>
          <div className="mt-3 flex h-24 items-end justify-between gap-2">
            {months.map((month, index) => (
              <div key={month.label} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                  <span className="w-2 rounded-full bg-income" style={{ height: `${month.income * 100}%` }} />
                  <span
                    className={cn("w-2 rounded-full bg-expense", index < months.length - 1 && "opacity-40")}
                    style={{ height: `${month.expense * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{month.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <CardLabel as="p">Theo hạng mục</CardLabel>
          {categories.map(({ name, share, icon, tone }) => (
            <div key={name} className="flex items-center gap-3">
              <IconTile icon={icon} tone={tone} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground tabular-nums">{share}%</span>
                </div>
                <Progress value={share} aria-hidden="true" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/** The evening reminder as it arrives, and the debts with their due dates. */
export function DebtsPicture() {
  return (
    <div className="flex w-full flex-col gap-3">
      {/* As iOS shows a notification: a rounded banner with the app's icon. */}
      <div className="flex items-center gap-3 rounded-[22px] bg-card p-3 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, as on the Home Screen */}
        <img src="/icons/pwa-192.png" alt="" className="size-9 rounded-[9px]" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex justify-between gap-2">
            <span className="font-semibold">Finance Tracker</span>
            <span className="text-xs text-muted-foreground">21:00</span>
          </p>
          <p className="truncate text-muted-foreground">Hôm nay bạn chưa ghi chi tiêu nào</p>
        </div>
      </div>
      <SettingsGroup>
        <SettingsRow
          media={<ContactAvatar contactId="welcome-lan-anh" initials="LA" />}
          title="Lan Anh"
          description="Cho vay"
          action={amountRow(3_500_000, "Còn 3 ngày")}
        />
        <SettingsRow
          media={<ContactAvatar contactId="welcome-chi-ha" initials="CH" />}
          title="Chị Hà"
          description="Đi vay"
          action={amountRow(-800_000, <span className="text-expense">Quá hạn 2 ngày</span>)}
        />
      </SettingsGroup>
    </div>
  )
}
