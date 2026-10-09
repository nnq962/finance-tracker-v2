import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"

import { DebtBalanceSkeleton } from "./_components/debt-balance"

export default function DebtsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải vay nợ"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <PageHeaderSkeleton title="Vay nợ" accessory={1} actions={["w-40", "w-44"]} />

        {/* As DebtsView: the balance, then "Cần thu" and "Cần trả" (side by
            side from lg up), each person's avatar, name and note, what is left
            and when it is due, and the chevron. */}
        <DebtBalanceSkeleton />
        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <SettingsGroupSkeleton key={index} rows={2} media="avatar" description trailing="amount" chevron />
          ))}
        </div>
        <FloatingActionsSkeleton />
      </div>

      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </Page>
  )
}
