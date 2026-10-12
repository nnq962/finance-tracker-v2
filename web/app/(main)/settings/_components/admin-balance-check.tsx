"use client"

import * as React from "react"
import { ScaleIcon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Spinner } from "@/components/ui/spinner"
import type { BalanceMismatch } from "@/lib/accounts/reconcile"
import { formatCurrency } from "@/lib/format-currency"
import { checkBalancesAction } from "@/lib/plans/actions"
import type { AdminUser } from "@/lib/plans/admin-data"

/**
 * Checks that every account's balance is still its opening balance plus what
 * moved it, for the admin: a row to run it, then the accounts that differ,
 * each with the user, what it says and what it should say. Nothing is fixed.
 */
export function AdminBalanceCheck({ users }: { users: AdminUser[] }) {
  const [result, setResult] = React.useState<{ checked: number; mismatches: BalanceMismatch[] } | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const userName = (id: string) => {
    const user = users.find((item) => item.id === id)
    return user?.email || user?.name || id
  }

  const check = () =>
    startTransition(async () => {
      const outcome = await checkBalancesAction()
      if (!outcome.success) {
        toast.error(outcome.error)
        return
      }
      setResult({ checked: outcome.checked, mismatches: outcome.mismatches })
    })

  return (
    <SettingsGroup
      title="Dữ liệu"
      footer="Số dư mỗi tài khoản phải bằng số dư ban đầu cộng mọi giao dịch, chuyển khoản và lần trả nợ của nó."
    >
      <SettingsRow
        icon={ScaleIcon}
        title="Kiểm tra số dư"
        description={
          result
            ? result.mismatches.length
              ? `${result.mismatches.length} tài khoản lệch`
              : `${result.checked} tài khoản đều khớp`
            : undefined
        }
        value={isPending ? <Spinner /> : undefined}
        disabled={isPending}
        chevron={false}
        onClick={check}
      />
      {result?.mismatches.map((mismatch) => (
        <SettingsRow
          key={mismatch.accountId}
          title={mismatch.name}
          description={`${userName(mismatch.userId)} · đúng ra ${formatCurrency(mismatch.expected)}`}
          value={<span className="tabular-nums text-expense">{formatCurrency(mismatch.balance)}</span>}
        />
      ))}
    </SettingsGroup>
  )
}
