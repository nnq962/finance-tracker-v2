"use client"

import * as React from "react"
import { LoaderCircleIcon, PlusIcon, SaveIcon, TicketPercentIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { RequiredMark } from "@/components/forms/required-mark"
import { useFieldErrors } from "@/components/forms/use-field-errors"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { formatDate, toDateKey } from "@/lib/format-date"
import { createCouponAction, setCouponActiveAction } from "@/lib/plans/actions"
import type { AdminCoupon } from "@/lib/plans/coupons"

/** The coupons with their uses, each switched on or off, and a sheet to make a new one. */
export function AdminCoupons({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter()
  const [creating, setCreating] = React.useState(false)
  const [toggling, setToggling] = React.useState<string | null>(null)

  const toggle = async (coupon: AdminCoupon, active: boolean) => {
    setToggling(coupon.id)
    const result = await setCouponActiveAction(coupon.id, active)
    setToggling(null)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <SettingsGroup
        title="Mã giảm giá"
        action={
          <Button type="button" variant="ghost" size="xs" onClick={() => setCreating(true)}>
            <PlusIcon />
            Tạo mã
          </Button>
        }
      >
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <SettingsRow
              key={coupon.id}
              icon={TicketPercentIcon}
              color="violet"
              title={`${coupon.code} · −${coupon.percentOff}%`}
              description={[
                `Đã dùng ${coupon.used}${coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ""}`,
                coupon.expiresAt ? `Hết hạn ${formatDate(toDateKey(new Date(new Date(coupon.expiresAt).getTime() - 1)))}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              action={
                <Switch
                  checked={coupon.active}
                  disabled={toggling === coupon.id}
                  aria-label={`${coupon.active ? "Tắt" : "Bật"} mã ${coupon.code}`}
                  onCheckedChange={(active) => void toggle(coupon, active)}
                />
              }
            />
          ))
        ) : (
          <SettingsRow title="Chưa có mã giảm giá" />
        )}
      </SettingsGroup>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title="Tạo mã giảm giá" />
          {/* Mounted per opening, so each starts empty. */}
          {creating ? (
            <CouponForm
              onCreated={() => {
                setCreating(false)
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

function CouponForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = React.useState("")
  const [percentOff, setPercentOff] = React.useState("")
  const [maxRedemptions, setMaxRedemptions] = React.useState("")
  const [expiresOn, setExpiresOn] = React.useState("")
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
        if (expiresOn && expiresOn < toDateKey(new Date())) found.expiresOn = "Không thể chọn ngày đã qua."
        const ids: Record<CouponField, string> = {
          code: "coupon-code",
          percentOff: "coupon-percent",
          maxRedemptions: "coupon-max",
          expiresOn: "coupon-expires",
        }
        if (report(found, ["code", "percentOff", "maxRedemptions", "expiresOn"], (name) => ids[name])) return

        setPending(true)
        const result = await createCouponAction({ code, percentOff: percent, maxRedemptions: max, expiresOn })
        setPending(false)
        if (!result.success) {
          setErrorMessage(result.error)
          return
        }
        toast.success(`Đã tạo mã ${code}`)
        onCreated()
      }}
    >
      <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.code) || undefined}>
            <FieldLabel htmlFor="coupon-code">
              Mã <RequiredMark />
            </FieldLabel>
            <Input
              id="coupon-code"
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
            {errors.percentOff ? <FieldError>{errors.percentOff}</FieldError> : null}
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
        </FieldGroup>
      </fieldset>
      <SheetFooter>
        {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
          Tạo mã
        </Button>
      </SheetFooter>
    </form>
  )
}
