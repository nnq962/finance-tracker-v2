"use client"

import * as React from "react"
import { SaveIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ActionSheet } from "@/components/app/action-sheet"
import { IconTile } from "@/components/app/icon-tile"
import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { gridChoices, PickGrid } from "@/components/app/pick-grid"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"
import { getJarIcon, jarIcons } from "@/lib/savings/jar-icons"
import { lastDayOfMonth, monthlyAmount, monthsLeft } from "@/lib/savings/plan"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"
import { cn } from "@/lib/utils"

import { createJarAction, deleteJarAction, updateJarAction } from "../../savings-actions"

/** The default when a new jar opens: the first idea, named after it. */
const FIRST_ICON = jarIcons[0]

/**
 * A jar made or changed: how much (the target, large at the top), what for
 * (a grid of icons that also names it until a name is typed; all of them on
 * a deeper screen), its name, and if wanted the month it is due, which
 * says how much to put in each month. Editing, the red bin beside Save
 * deletes it, asked once more.
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
  const [target, setTarget] = React.useState<number | null>(jar?.goal?.target ?? null)
  const [icon, setIcon] = React.useState<string>(jar?.goal?.icon ?? FIRST_ICON.id)
  const [name, setName] = React.useState(jar?.name ?? FIRST_ICON.label)
  // Typed by the user, so picking another icon leaves it alone.
  const [named, setNamed] = React.useState(Boolean(jar))
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
  usePageSheetScreen(allIcons ? { title: "Để dành cho", onBack: () => setAllIcons(false) } : null)

  const pick = (id: string) => {
    setIcon(id)
    if (!named) setName(getJarIcon(id).label)
  }

  // What is still needed spread over the months to the due one, as the jar's sheet will say.
  const monthly =
    withDue && target ? monthlyAmount({ balance: jar?.balance ?? 0, goal: { target, icon, due: lastDayOfMonth(dueMonth) } }, today) : null

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!target) {
      setTargetError("Nhập số tiền cần để dành.")
      document.getElementById("jar-target")?.focus()
      return
    }
    if (!name.trim()) {
      setError("Nhập tên hũ.")
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
      {withDue ? <input type="hidden" name="dueMonth" value={dueMonth} /> : null}

      {/* The deeper screen; the first stays mounted under it, so nothing typed is lost. */}
      {allIcons ? (
        <SettingsGroup>
          {jarIcons.map((item) => (
            <SettingsRow
              key={item.id}
              media={<IconTile icon={item.icon} tone={item.tone} size="sm" />}
              title={item.label}
              checked={icon === item.id}
              onClick={() => {
                pick(item.id)
                setAllIcons(false)
              }}
            />
          ))}
        </SettingsGroup>
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", allIcons && "hidden")}>
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

        <PickGrid
          id="jar-icon"
          caption="Để dành cho"
          items={gridChoices(jarIcons, icon).map((item) => ({
            id: item.id,
            label: item.label,
            media: <IconTile icon={item.icon} tone={item.tone} />,
          }))}
          value={icon}
          onValueChange={pick}
          onShowAll={() => setAllIcons(true)}
        />

        <div className="flex flex-col gap-2">
          <SettingsGroup>
            {/* The name typed in place, at the row's end, as iOS settings do. */}
            <li className={cn("flex min-h-16 items-center gap-3 px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="jar-name" className="shrink-0 text-sm font-medium">
                Tên
              </label>
              <input
                id="jar-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNamed(event.target.value.trim().length > 0)
                }}
                placeholder="Tên hũ"
                autoComplete="off"
                maxLength={80}
                className="min-w-0 flex-1 bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
            <SettingsRow
              title="Đặt hạn"
              description="Tính số tiền cần nạp mỗi tháng"
              action={<Switch aria-label="Đặt hạn" checked={withDue} onCheckedChange={setWithDue} />}
            />
            {withDue ? (
              <SettingsRow
                title="Hạn"
                value={`${formatDate(lastDayOfMonth(dueMonth))} · còn ${monthsLeft(dueMonth, today)} tháng`}
                onClick={() => setPickingMonth(true)}
              />
            ) : null}
          </SettingsGroup>
          {monthly ? (
            <p className="px-4 text-xs text-muted-foreground">Cần nạp khoảng {formatCurrency(monthly)} mỗi tháng để đạt mục tiêu đúng hạn.</p>
          ) : null}
        </div>
      </div>

      {allIcons ? null : (
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
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? <Spinner /> : jar ? <SaveIcon /> : null}
              {pending ? "Đang lưu..." : jar ? "Lưu thay đổi" : "Tạo hũ"}
            </Button>
          </div>
        </PageSheetFooter>
      )}

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
