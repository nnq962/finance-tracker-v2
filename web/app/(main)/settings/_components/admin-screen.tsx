"use client"

import * as React from "react"
import { CrownIcon, LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { getGrantsAction, grantProAction, revokeProAction } from "@/lib/plans/actions"
import type { AdminData, AdminUser } from "@/lib/plans/admin-data"
import { paymentReference, plans, proPrices, type PlanPeriod } from "@/lib/plans/plans"
import type { SubscriptionGrant } from "@/lib/plans/repository"

import { AdminCoupons } from "./admin-coupons"

const dateOf = (iso: string) => formatDate(toDateKey(iso))

/** Lower case without Vietnamese marks, for searching names. */
const plain = (text: string) =>
  text.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")

/**
 * Users and their plans, for the admin: the month's takings, everyone with a
 * search, and per user a form to grant Pro once a payment arrives.
 */
export function AdminScreen({ data }: { data: AdminData }) {
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // Kept while the sheet slides away, so its content does not vanish first.
  const [detailOpen, setDetailOpen] = React.useState(false)
  const selected = data.users.find((user) => user.id === selectedId)

  const term = plain(query.trim())
  const shown = term
    ? data.users.filter((user) =>
        [user.email, user.name, paymentReference(user.id)].some((text) => plain(text).includes(term)),
      )
    : data.users
  const proCount = data.users.filter((user) => user.proEndsAt).length

  return (
    <div className="space-y-6">
      <SettingsGroup title="Tháng này">
        <SettingsRow title="Doanh thu" description={`${data.takings.count} lần cấp Pro`} value={formatCurrency(data.takings.total)} />
        <SettingsRow title="Người dùng" value={String(data.users.length)} />
        <SettingsRow title="Đang dùng Pro" value={String(proCount)} />
      </SettingsGroup>

      <AdminCoupons coupons={data.coupons} />

      <Input
        type="search"
        aria-label="Tìm người dùng"
        placeholder="Tìm theo email, tên hoặc mã FT…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <SettingsGroup title="Người dùng">
        {shown.length > 0 ? (
          shown.map((user) => (
            <SettingsRow
              key={user.id}
              title={user.email || user.name || user.id}
              description={`${paymentReference(user.id)} · AI ${user.aiUsed}/${plans[user.proEndsAt ? "pro" : "free"].aiMonthlyLimit}`}
              value={user.proEndsAt ? <Badge variant="grape">Pro · {dateOf(user.proEndsAt)}</Badge> : plans.free.label}
              onClick={() => {
                setSelectedId(user.id)
                setDetailOpen(true)
              }}
            />
          ))
        ) : (
          <SettingsRow title="Không tìm thấy người dùng" />
        )}
      </SettingsGroup>

      {/* A user opens in a sheet of its own on top of this one, as native navigation pushes a screen. */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {selected ? (
            <>
              <SheetNavHeader backLabel="Quản trị" title={selected.email || selected.name || "Người dùng"} />
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
                {/* Keyed, so another user starts with a fresh form. */}
                <AdminUserDetail key={selected.id} user={selected} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function AdminUserDetail({ user }: { user: AdminUser }) {
  const [period, setPeriod] = React.useState<PlanPeriod>("month")
  const [amount, setAmount] = React.useState<number | null>(proPrices.month.amount)
  const [note, setNote] = React.useState("")
  const [grants, setGrants] = React.useState<SubscriptionGrant[] | null>(null)
  const [revokeOpen, setRevokeOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const loadGrants = React.useCallback(async () => {
    const result = await getGrantsAction(user.id)
    if (result.success) setGrants(result.grants)
    else toast.error(result.error)
  }, [user.id])

  // The history is read when the user is opened, and again after a change.
  React.useEffect(() => {
    let current = true
    getGrantsAction(user.id).then((result) => {
      if (!current) return
      if (result.success) setGrants(result.grants)
      else toast.error(result.error)
    })
    return () => {
      current = false
    }
  }, [user.id])

  const grant = () =>
    startTransition(async () => {
      const result = await grantProAction(user.id, { period, amount: amount ?? 0, note })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Đã cấp Pro ${proPrices[period].label} cho ${user.email || user.name}.`)
      setNote("")
      await loadGrants()
    })

  const revoke = () =>
    startTransition(async () => {
      const result = await revokeProAction(user.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Đã thu hồi Pro.")
      await loadGrants()
    })

  return (
    <div className="space-y-6">
      <SettingsGroup title="Người dùng">
        <SettingsRow title={user.name || "Chưa có tên"} description={user.email || "Chưa có email"} />
        <SettingsRow title="Mã chuyển khoản" value={paymentReference(user.id)} />
        <SettingsRow
          title="Gói"
          value={user.proEndsAt ? <Badge variant="grape">Pro · đến {dateOf(user.proEndsAt)}</Badge> : plans.free.label}
        />
        <SettingsRow title="Lượt AI tháng này" value={String(user.aiUsed)} />
        <SettingsRow title="Tham gia" value={dateOf(user.createdAt)} />
      </SettingsGroup>

      <SettingsGroup
        title="Cấp Pro"
        footer="Pro mới bắt đầu từ hôm nay, hoặc nối tiếp ngay sau hạn Pro hiện tại."
      >
        {/* The group's card holds a list; the form is its one item. */}
        <li className="space-y-4 p-3">
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(value) => {
              if (value !== "month" && value !== "year") return
              setPeriod(value)
              setAmount(proPrices[value].amount)
            }}
            className="flex-wrap"
            aria-label="Thời hạn"
          >
            {(["month", "year"] as const).map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {proPrices[value].label} · {formatCurrency(proPrices[value].amount)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Field>
            <FieldLabel htmlFor="grant-amount">Số tiền đã nhận</FieldLabel>
            <CurrencyInput id="grant-amount" name="amount" value={amount} onValueChange={setAmount} />
          </Field>
          <Field>
            <FieldLabel htmlFor="grant-note">Ghi chú</FieldLabel>
            <Input
              id="grant-note"
              value={note}
              maxLength={200}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <Button type="button" className="w-full" disabled={isPending} onClick={grant}>
            {isPending ? <LoaderCircleIcon className="animate-spin" /> : <CrownIcon />}
            Cấp Pro {proPrices[period].label}
          </Button>
        </li>
      </SettingsGroup>

      <SettingsGroup title="Lịch sử cấp Pro">
        {grants === null ? (
          <SettingsRow title="Đang tải…" />
        ) : grants.length > 0 ? (
          grants.map((item) => (
            <SettingsRow
              key={item.id}
              title={`${dateOf(item.startsAt)} → ${dateOf(item.endsAt)}`}
              description={[item.note, item.revoked ? "Đã thu hồi" : null].filter(Boolean).join(" · ") || undefined}
              value={formatCurrency(item.amount)}
            />
          ))
        ) : (
          <SettingsRow title="Chưa từng dùng Pro" />
        )}
      </SettingsGroup>

      {user.proEndsAt ? (
        <SettingsGroup>
          <SettingsRow destructive title="Thu hồi Pro" disabled={isPending} onClick={() => setRevokeOpen(true)} />
        </SettingsGroup>
      ) : null}

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi Pro?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.email || user.name} sẽ về gói {plans.free.label} ngay, kể cả phần Pro đã cấp nối tiếp. Số tiền đã ghi
              vẫn nằm trong lịch sử.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRevokeOpen(false)
                revoke()
              }}
            >
              Thu hồi Pro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
