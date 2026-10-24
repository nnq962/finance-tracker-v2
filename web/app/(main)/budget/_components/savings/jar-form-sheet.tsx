"use client"

import * as React from "react"
import { SaveIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ActionSheet } from "@/components/app/action-sheet"
import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { PageSheet, PageSheetFooter, PageSheetScreen } from "@/components/app/page-sheet"
import { ColorPicker } from "@/components/forms/color-picker"
import { CurrencyInput } from "@/components/forms/currency-input"
import { IconPicker, IconPickerScreen } from "@/components/forms/icon-picker"
import { InlineInput } from "@/components/forms/inline-input"
import { groupCaptionClassName, SettingsFieldRow, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import type { Account } from "@/lib/accounts/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"
import { DEFAULT_JAR_COLOR, DEFAULT_JAR_ICON, isJarColorName, isJarIconName } from "@/lib/savings/jar-icons"
import { dueLeftLabel, lastDayOfMonth, monthlyAmount } from "@/lib/savings/plan"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"
import { cn } from "@/lib/utils"

import { createJarAction, deleteJarAction, updateJarAction } from "../../savings-actions"
import { JarRing } from "./jar-ring"

function Caption({ children }: { children: React.ReactNode }) {
  return <h3 className={cn("px-4", groupCaptionClassName)}>{children}</h3>
}

/**
 * A jar made or changed, laid out as a category's editor (2026-10-16): the
 * jar's ring following each choice, how much (the target, large), its name
 * typed by the user, its icon from the app's category icons (suggested by
 * the name; all of them, with a search, on a deeper screen) and its colour,
 * and if wanted the month it is due, which says how much to put in each
 * month. Editing, the red bin beside Save deletes it, asked once more.
 */
export function JarFormSheet({
  jar,
  open,
  onOpenChange,
  onDeleted,
}: {
  /** The jar to change; none makes a new one. */
  jar?: Account
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Once a delete is confirmed: the jar's own sheet closes too. */
  onDeleted?: () => void
}) {
  return (
    <PageSheet title={jar ? "Sửa hũ" : "Hũ tiết kiệm mới"} open={open} onOpenChange={onOpenChange}>
      {/* A fresh form each time it opens. */}
      {open ? <JarForm jar={jar} onDone={() => onOpenChange(false)} onDeleted={onDeleted} /> : null}
    </PageSheet>
  )
}

function JarForm({ jar, onDone, onDeleted }: { jar?: Account; onDone: () => void; onDeleted?: () => void }) {
  const today = toDateKey(new Date())
  const thisMonth = today.slice(0, 7)
  const [pending, startTransition] = React.useTransition()
  const [requestId] = React.useState(() => randomId())
  const [error, setError] = React.useState<string | null>(null)
  const [targetError, setTargetError] = React.useState<string | null>(null)
  // At the name's row, as every form says what is missing where it is (2026-10-24; was the footer's line).
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [target, setTarget] = React.useState<number | null>(jar?.goal?.target ?? null)
  const [icon, setIcon] = React.useState<CategoryIconName>(() =>
    jar?.goal && isJarIconName(jar.goal.icon) ? jar.goal.icon : DEFAULT_JAR_ICON,
  )
  const [color, setColor] = React.useState<CategoryColorName>(() =>
    jar?.goal && isJarColorName(jar.goal.color) ? jar.goal.color : DEFAULT_JAR_COLOR,
  )
  const [name, setName] = React.useState(jar?.name ?? "")
  // Bought: only its name is edited.
  const done = Boolean(jar?.goal?.completedAt)
  const [withDue, setWithDue] = React.useState(Boolean(jar?.goal?.due) || !jar)
  // Three months ahead to start with: a near goal, easily moved.
  const [dueMonth, setDueMonth] = React.useState(() => {
    if (jar?.goal?.due) return jar.goal.due.slice(0, 7)
    const [year, month] = thisMonth.split("-").map(Number)
    const ahead = new Date(Date.UTC(year, month + 1, 1))
    return ahead.toISOString().slice(0, 7)
  })
  const [pickingMonth, setPickingMonth] = React.useState(false)
  const [allIcons, setAllIcons] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  // What is still needed spread over the months to the due one, as the jar's sheet will say.
  const monthly =
    withDue && target ? monthlyAmount({ balance: jar?.balance ?? 0, goal: { target, icon, color, due: lastDayOfMonth(dueMonth) } }, today) : null

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!target) {
      setTargetError("Nhập số tiền cần để dành.")
      document.getElementById("jar-target")?.focus()
      return
    }
    if (!name.trim()) {
      setNameError("Nhập tên hũ.")
      document.getElementById("jar-name")?.focus()
      return
    }
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        const result = jar ? await updateJarAction(jar.id, formData) : await createJarAction(formData)
        if (!result.success) return setError(result.error)
        toast.success(jar ? "Đã lưu hũ." : "Đã tạo hũ.")
        onDone()
      } catch {
        setError("Không thể lưu hũ. Vui lòng thử lại.")
      }
    })
  }

  const remove = () => {
    if (!jar) return
    onDone()
    onDeleted?.()
    scheduleUndoableDelete({
      key: `account:${jar.id}`,
      title: `Đã xoá hũ “${jar.name}”`,
      pendingMessage: "Đang xoá hũ…",
      undoMessage: "Đã giữ lại hũ.",
      errorMessage: "Không thể xoá hũ. Vui lòng thử lại.",
      onCommit: async () => {
        const result = await deleteJarAction(jar.id)
        if (!result.success) throw new Error(result.error)
      },
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />
      {withDue ? <input type="hidden" name="dueMonth" value={dueMonth} /> : null}

      {/* The deeper screen; the first stays mounted under it, so nothing typed is lost. */}
      <PageSheetScreen open={allIcons} title="Biểu tượng" onBack={() => setAllIcons(false)}>
        <IconPickerScreen
          value={icon}
          color={color}
          onPick={(next) => {
            setIcon(next)
            setAllIcons(false)
          }}
        />
      </PageSheetScreen>

      {done ? (
        // Bought: its goal is what it was, only its name changes (and it can be deleted).
        <div className="flex flex-col gap-6 pb-4">
          <input type="hidden" name="target" value={target ?? ""} />
          <div className="flex flex-col items-center gap-2 pt-2 text-center">
            <JarRing jar={jar!} size="lead" />
            <p className="text-sm text-muted-foreground">
              Đã mua {formatDate(toDateKey(jar!.goal!.completedAt!))}. Hũ đã hoàn thành chỉ đổi được tên.
            </p>
          </div>
          <SettingsGroup>
            <SettingsFieldRow htmlFor="jar-name" title="Tên" invalid={Boolean(nameError)}>
              <InlineInput
                id="jar-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameError(null)
                }}
                maxLength={80}
                aria-invalid={Boolean(nameError) || undefined}
              />
            </SettingsFieldRow>
          </SettingsGroup>
          {nameError ? <FieldError className="-mt-4 px-4">{nameError}</FieldError> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          {/* What it will look like, following each choice. */}
          <div className="flex justify-center pt-2">
            <JarRing jar={{ balance: jar?.balance ?? 0, goal: { target: target ?? 0, icon, color } }} size="lead" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <label htmlFor="jar-target" className="text-xs text-muted-foreground">
              Mục tiêu
            </label>
            <CurrencyInput
              variant="hero"
              id="jar-target"
              name="target"
              value={target}
              onValueChange={(value) => {
                setTarget(value)
                setTargetError(null)
              }}
              invalid={Boolean(targetError)}
              required
            />
            {targetError ? <FieldError className="text-center">{targetError}</FieldError> : null}
          </div>

          <SettingsGroup>
            <SettingsFieldRow htmlFor="jar-name" title="Tên" invalid={Boolean(nameError)}>
              <InlineInput
                id="jar-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameError(null)
                }}
                placeholder="Mua xe máy"
                maxLength={80}
                aria-invalid={Boolean(nameError) || undefined}
              />
            </SettingsFieldRow>
          </SettingsGroup>
          {nameError ? <FieldError className="-mt-4 px-4">{nameError}</FieldError> : null}

          <section className="flex flex-col gap-2">
            <Caption>Biểu tượng</Caption>
            <IconPicker
              value={icon}
              color={color}
              name={name}
              fallback={[DEFAULT_JAR_ICON]}
              onValueChange={setIcon}
              onShowAll={() => setAllIcons(true)}
            />
            <p className="px-4 text-xs text-muted-foreground">Gợi ý theo tên. Ô cuối mở tất cả biểu tượng.</p>
          </section>

          <section className="flex flex-col gap-2">
            <Caption>Màu</Caption>
            <ColorPicker value={color} onValueChange={setColor} />
          </section>

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              <SettingsRow
                title="Đặt hạn"
                description="Tính số tiền cần nạp mỗi tháng"
                action={<Switch aria-label="Đặt hạn" checked={withDue} onCheckedChange={setWithDue} />}
              />
              {withDue ? (
                <SettingsRow
                  title="Hạn"
                  value={`${formatDate(lastDayOfMonth(dueMonth))} · ${dueLeftLabel(dueMonth, today)}`}
                  onClick={() => setPickingMonth(true)}
                />
              ) : null}
            </SettingsGroup>
            {monthly ? (
              <p className="px-4 text-xs text-muted-foreground">Cần nạp khoảng {formatCurrency(monthly)} mỗi tháng để đạt mục tiêu đúng hạn.</p>
            ) : null}
          </div>
        </div>
      )}

      <PageSheetFooter>
        {error ? <FieldError>{error}</FieldError> : null}
        {/* Deleting beside saving, as tall as it, as in the account's editor. */}
        <div className="flex items-center gap-2">
          {jar ? (
            <Button type="button" variant="destructive" className="w-30 px-0" aria-label="Xoá hũ" disabled={pending} onClick={() => setConfirmDelete(true)}>
              <Trash2Icon />
              Xoá
            </Button>
          ) : null}
          <Button type="submit" className="flex-1" loading={pending}>
            {jar ? <SaveIcon data-icon="inline-start" /> : null}
            {jar ? "Lưu thay đổi" : "Tạo hũ"}
          </Button>
        </div>
      </PageSheetFooter>

      <MonthPickerSheet
        open={pickingMonth}
        onOpenChange={setPickingMonth}
        value={dueMonth}
        min={thisMonth}
        onValueChange={setDueMonth}
      />
      {jar ? (
        <ActionSheet
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Xoá hũ “${jar.name}”? Các lần nạp, rút cũng bị xoá, tiền về lại tài khoản đã nạp.${
            jar.goal?.completedAt ? " Khoản chi lúc mua cũng bị xoá." : ""
          }`}
          options={[{ value: "delete", label: "Xoá hũ", destructive: true }]}
          onSelect={remove}
        />
      ) : null}
    </form>
  )
}
