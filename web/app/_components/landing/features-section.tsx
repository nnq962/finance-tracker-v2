import { ArrowDownLeftIcon, ArrowUpRightIcon, BellRingIcon, MoonIcon, SmartphoneIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { FlowTiles } from "@/components/app/flow-tiles"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { NetWorth } from "@/app/(main)/overview/_components/overview-sections"
import { DebtBalance } from "@/app/(main)/debts/_components/debt-balance"

import { SectionHeading } from "./section-heading"

const accounts = [
  { name: "Vietcombank", type: "bank" as const, institutionName: "Vietcombank", logoUrl: "/institutions/banks/vietcombank.svg", logoFallback: "VCB", balance: 48_900_000, kind: "Ngân hàng" },
  { name: "MoMo", type: "e-wallet" as const, institutionName: "MoMo", logoUrl: "/institutions/wallets/momo.svg", logoFallback: "MM", balance: 4_053_000, kind: "Ví điện tử" },
  { name: "Tiền mặt", type: "cash" as const, institutionName: "Tiền mặt", logoUrl: undefined, logoFallback: "TM", balance: 2_150_000, kind: "Tiền mặt" },
]

/** One cell of the bento: its name and a line on a grey panel, then the app's own block, inert. */
function Cell({ title, line, className, children }: { title: string; line: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("surface-grouped flex min-w-0 flex-col gap-5 rounded-[28px] bg-track p-5 sm:p-6 dark:bg-foreground/5", className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{line}</p>
      </div>
      <div inert aria-hidden="true" className="mt-auto">
        {children}
      </div>
    </div>
  )
}

/**
 * What the app does, as a bento of the app's own blocks with made-up
 * figures: the net worth, money in and out, the accounts, the debts, the
 * daily reminder and the app on a phone.
 */
export function FeaturesSection() {
  return (
    <section aria-labelledby="features-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading anchor="tinh-nang" id="features-title" label="Một nơi để theo dõi" title="Từng khoản ghi lại, cả bức tranh hiện ra.">
        Các phần trong Finance Tracker nối với nhau: ghi một giao dịch là số dư, tổng quan và vay nợ cùng khớp theo.
      </SectionHeading>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Cell title="Tổng quan" line="Tài sản ròng, thu chi tháng này và phần đang cho vay, đang nợ." className="lg:col-span-2">
          <NetWorth
            data={{ total: 51_403_000, cash: 56_903_000, receivable: 5_500_000, payable: 11_000_000, archivedCash: 0 } as OverviewSummary["netWorth"]}
            month={{ income: 18_000_000, expense: 395_000 }}
          />
        </Cell>
        <Cell title="Giao dịch" line="Tiền vào, tiền ra của tháng, lọc theo tài khoản và hạng mục.">
          <FlowTiles
            variant="lead"
            tiles={[
              { value: "in", label: "Tiền vào", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
              { value: "out", label: "Tiền ra", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
            ]}
          />
        </Cell>
        <Cell title="Tài khoản" line="Ngân hàng, ví điện tử và tiền mặt, mỗi nơi một số dư.">
          <SettingsGroup>
            {accounts.map((account) => (
              <SettingsRow
                key={account.name}
                media={<AccountLogo account={account} />}
                title={account.name}
                description={account.kind}
                action={<Money amount={account.balance} size="sm" />}
              />
            ))}
          </SettingsGroup>
        </Cell>
        <Cell title="Vay nợ" line="Ai nợ bạn, bạn nợ ai, hạn trả và lãi, kèm lịch sử từng lần trả." className="lg:col-span-2">
          <DebtBalance lent={5_500_000} borrowed={11_000_000} lentCount={2} borrowedCount={2} />
        </Cell>
        <Cell title="Nhắc mỗi ngày" line="Chọn giờ, nhận thông báo trên điện thoại để không bỏ sót.">
          <SettingsGroup>
            <SettingsRow icon={BellRingIcon} title="Đến giờ ghi chép rồi!" description="Hôm nay bạn đã chi tiêu những gì?" value="21:00" />
          </SettingsGroup>
        </Cell>
        <Cell title="Như một app" line="Cài lên màn hình chính, dùng trên điện thoại hay máy tính." className="lg:col-span-2">
          <SettingsGroup>
            <SettingsRow icon={SmartphoneIcon} title="Cài vào màn hình chính" description="iPhone, Android và máy tính" />
            <SettingsRow icon={MoonIcon} title="Sáng hay tối" description="Theo máy, hoặc chọn riêng" />
          </SettingsGroup>
        </Cell>
      </div>
    </section>
  )
}
