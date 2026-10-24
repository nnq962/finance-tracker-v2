"use client"

import { HistoryIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"

/**
 * The search screen before anything is typed (2026-10-24): the recent
 * searches, newest first, a tap searching again, a swipe left removing one,
 * Xoá clearing them; none yet, a line on what can be searched. The kinds and
 * the list make way, as in native search screens.
 */
export function SearchHistory({
  items,
  onPick,
  onRemove,
  onClear,
}: {
  items: string[]
  onPick: (query: string) => void
  onRemove: (query: string) => void
  onClear: () => void
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 pt-2 text-sm text-pretty text-muted-foreground">
        Tìm theo hạng mục, tài khoản hay ghi chú. Gõ không dấu cũng được.
      </p>
    )
  }

  return (
    <SettingsGroup
      title="Tìm gần đây"
      action={
        <Button type="button" variant="ghost" size="xs" className="-mr-2" onClick={onClear}>
          Xoá
        </Button>
      }
    >
      {items.map((item) => (
        <SettingsRow
          key={item}
          icon={HistoryIcon}
          tone="neutral"
          title={item}
          chevron={false}
          onClick={() => onPick(item)}
          swipeAction={{ label: "Xoá", onAction: () => onRemove(item) }}
        />
      ))}
    </SettingsGroup>
  )
}
