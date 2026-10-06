"use client"

import * as React from "react"
import { PlusIcon, SaveIcon, TicketPercentIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
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
} from "@/components/ui/alert-dialog"
import { FormSection } from "@/components/app/form-section"
import { RequiredMark } from "@/components/forms/required-mark"
import { useFieldErrors } from "@/components/forms/use-field-errors"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import {
  createCouponAction,
  deleteCouponAction,
  setCouponActiveAction,
  updateCouponAction,
} from "@/lib/plans/actions"
import type { AdminCoupon } from "@/lib/plans/coupons"
import { priceWithCoupon } from "@/lib/plans/plans"

/** The last day a code works, from its end (the start of the next day in Vietnam). */
const lastDayOf = (expiresAt: string) => toDateKey(new Date(new Date(expiresAt).getTime() - 1))

/** The coupons with their uses, each switched on or off, and a sheet to make a new one. */
export function AdminCoupons({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter()
  // "new", a coupon's id, or nothing; kept while the sheet slides away.
  const [editing, setEditing] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const coupon = coupons.find((item) => item.id === editing)

  const openSheet = (id: string) => {
    setEditing(id)
    setOpen(true)
  }

  return (
    <>
      <SettingsGroup
        title="Mã giảm giá"
        action={
          <Button type="button" variant="ghost" size="xs" onClick={() => openSheet("new")}>
            <PlusIcon />
            Tạo mã
          </Button>
        }
      >
        {coupons.length > 0 ? (
          coupons.map((item) => (
            <SettingsRow
              key={item.id}
              icon={TicketPercentIcon}
              title={`${item.code} · −${item.percentOff}%`}
              description={[
                `Đã dùng ${item.used}${item.maxRedemptions ? `/${item.maxRedemptions}` : ""}`,
                item.expiresAt ? `Hết hạn ${formatDate(lastDayOf(item.expiresAt))}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              value={item.active ? undefined : "Đã tắt"}
              onClick={() => openSheet(item.id)}
            />
          ))
        ) : (
          <SettingsRow title="Chưa có mã giảm giá" />
        )}
      </SettingsGroup>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          variant="screen"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title={coupon ? `Mã ${coupon.code}` : "Tạo mã giảm giá"} />
          {/* Keyed, so each opening starts from the code's saved values. */}
          {editing && (editing === "new" || coupon) ? (
            <CouponForm
              key={editing}
              coupon={coupon}
              onDone={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

type CouponField = "code" | "percentOff" | "maxRedemptions" | "expiresOn"

function CouponForm({ coupon, onDone }: { coupon?: AdminCoupon; onDone: () => void }) {
  const [code, setCode] = React.useState(coupon?.code ?? "")
  const [percentOff, setPercentOff] = React.useState(coupon ? String(coupon.percentOff) : "")
  const [maxRedemptions, setMaxRedemptions] = React.useState(coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "")
  const [expiresOn, setExpiresOn] = React.useState(coupon?.expiresAt ? lastDayOf(coupon.expiresAt) : "")
  const [active, setActive] = React.useState(coupon?.active ?? true)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const { errors, clear, report } = useFieldErrors<CouponField>()

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={async (event) => {
        event.preventDefault()
        setErrorMessage(null)
        const found: Partial<Record<CouponField, string>> = {}
        if (!/^[A-Z0-9]{3,20}$/.test(code)) found.code = "Mã gồm 3–20 chữ cái hoặc số, không dấu."
        const percent = Number(percentOff)
        if (!Number.isInteger(percent) || percent < 1 || percent > 100) found.percentOff = "Nhập mức giảm từ 1 đến 100%."
        const max = maxRedemptions ? Number(maxRedemptions) : undefined
        if (max !== undefined && (!Number.isInteger(max) || max < 1)) found.maxRedemptions = "Nhập số nguyên lớn hơn 0."
        if (expiresOn && expiresOn < toDateKey(new Date()) && expiresOn !== (coupon?.expiresAt ? lastDayOf(coupon.expiresAt) : "")) {
          found.expiresOn = "Không thể chọn ngày đã qua."
        }
        const ids: Record<CouponField, string> = {
          code: "coupon-code",
          percentOff: "coupon-percent",
          maxRedemptions: "coupon-max",
          expiresOn: "coupon-expires",
        }
        if (report(found, ["code", "percentOff", "maxRedemptions", "expiresOn"], (name) => ids[name])) return

        setPending(true)
        const limits = { percentOff: percent, maxRedemptions: max ?? null, expiresOn }
        const result = coupon
          ? await updateCouponAction(coupon.id, limits)
          : await createCouponAction({ code, ...limits })
        if (result.success && coupon && active !== coupon.active) {
          const toggled = await setCouponActiveAction(coupon.id, active)
          if (!toggled.success) {
            setPending(false)
            setErrorMessage(toggled.error)
            return
          }
        }
        setPending(false)
        if (!result.success) {
          setErrorMessage(result.error)
          return
        }
        toast.success(coupon ? `Đã lưu mã ${code}` : `Đã tạo mã ${code}`)
        onDone()
      }}
    >
      <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
        <FormSection>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.code) || undefined}>
              <FieldLabel htmlFor="coupon-code">
                Mã <RequiredMark />
              </FieldLabel>
              <Input
                id="coupon-code"
                // The code stays once made: people may already have it.
                disabled={Boolean(coupon)}
                value={code}
                maxLength={20}
                autoCapitalize="characters"
                autoComplete="off"
                aria-invalid={Boolean(errors.code) || undefined}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\s+/g, "").toUpperCase())
                  clear("code")
                }}
              />
              {errors.code ? <FieldError>{errors.code}</FieldError> : null}
            </Field>
            <Field data-invalid={Boolean(errors.percentOff) || undefined}>
              <FieldLabel htmlFor="coupon-percent">
                Mức giảm <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="coupon-percent"
                  inputMode="numeric"
                  value={percentOff}
                  aria-invalid={Boolean(errors.percentOff) || undefined}
                  onChange={(event) => {
                    setPercentOff(event.target.value.replace(/\D/g, "").slice(0, 3))
                    clear("percentOff")
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>%</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {errors.percentOff ? (
                <FieldError>{errors.percentOff}</FieldError>
              ) : Number(percentOff) >= 1 && Number(percentOff) <= 100 ? (
                // The prices it gives, rounded as checkout rounds them.
                <FieldDescription>
                  Gói tháng {formatCurrency(priceWithCoupon("month", Number(percentOff)).amount)} · Gói năm{" "}
                  {formatCurrency(priceWithCoupon("year", Number(percentOff)).amount)}
                </FieldDescription>
              ) : null}
            </Field>
            <Field data-invalid={Boolean(errors.maxRedemptions) || undefined}>
              <FieldLabel htmlFor="coupon-max">Số lượt tối đa</FieldLabel>
              <Input
                id="coupon-max"
                inputMode="numeric"
                placeholder="Không giới hạn"
                value={maxRedemptions}
                aria-invalid={Boolean(errors.maxRedemptions) || undefined}
                onChange={(event) => {
                  setMaxRedemptions(event.target.value.replace(/\D/g, "").slice(0, 7))
                  clear("maxRedemptions")
                }}
              />
              {errors.maxRedemptions ? <FieldError>{errors.maxRedemptions}</FieldError> : null}
            </Field>
            <Field data-invalid={Boolean(errors.expiresOn) || undefined}>
              <FieldLabel htmlFor="coupon-expires">Hết hạn sau ngày</FieldLabel>
              <div className="flex min-w-0">
                <Input
                  id="coupon-expires"
                  type="date"
                  min={toDateKey(new Date())}
                  value={expiresOn}
                  aria-invalid={Boolean(errors.expiresOn) || undefined}
                  onChange={(event) => {
                    setExpiresOn(event.target.value)
                    clear("expiresOn")
                  }}
                  className="w-auto min-w-0 max-w-full flex-1"
                />
              </div>
              {errors.expiresOn ? <FieldError>{errors.expiresOn}</FieldError> : null}
            </Field>
            {coupon ? (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="coupon-active">Đang hoạt động</FieldLabel>
                  <FieldDescription>Tắt để ngừng nhận mã, lượt đã dùng vẫn giữ.</FieldDescription>
                </FieldContent>
                <Switch id="coupon-active" checked={active} onCheckedChange={setActive} />
              </Field>
            ) : null}
            {coupon ? (
              <Button type="button" variant="outline" className="w-full" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon />
                Xoá mã
              </Button>
            ) : null}
          </FieldGroup>
        </FormSection>
      </fieldset>
      <SheetFooter>
        {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <SaveIcon />}
          {coupon ? "Lưu thay đổi" : "Tạo mã"}
        </Button>
      </SheetFooter>

      {coupon ? (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá mã {coupon.code}?</AlertDialogTitle>
              <AlertDialogDescription>
                {coupon.used > 0
                  ? `Lịch sử ${coupon.used} lượt dùng sẽ mất. Muốn giữ lịch sử, hãy tắt mã thay vì xoá.`
                  : "Mã sẽ bị xoá vĩnh viễn."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const result = await deleteCouponAction(coupon.id)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success(`Đã xoá mã ${coupon.code}`)
                  onDone()
                }}
              >
                <Trash2Icon />
                Xoá mã
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </form>
  )
}
