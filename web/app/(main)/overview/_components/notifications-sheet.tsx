"use client"

import * as React from "react"
import { BellIcon, GiftIcon, HandCoinsIcon, PencilLineIcon, SparklesIcon, type LucideIcon } from "lucide-react"

import type { IconTileTone } from "@/components/app/icon-tile"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

type Notice = {
  id: string
  icon: LucideIcon
  tone: IconTileTone
  title: string
  body: string
  time: string
  read: boolean
  /** New ones are listed first, under "Mới". */
  recent: boolean
}

// Mockup: sample notices until it is decided where they come from.
const sampleNotices: Notice[] = [
  {
    id: "debt",
    icon: HandCoinsIcon,
    tone: "warning",
    title: "Sắp đến hạn",
    body: "Lan · 500.000đ · còn 2 ngày",
    time: "2 giờ",
    read: false,
    recent: true,
  },
  {
    id: "reminder",
    icon: PencilLineIcon,
    tone: "orange",
    title: "Hôm nay chưa ghi chi tiêu",
    body: "Ghi ngay để không sót",
    time: "20:00",
    read: false,
    recent: true,
  },
  {
    id: "ai",
    icon: SparklesIcon,
    tone: "ai",
    title: "Còn 3 lượt AI",
    body: "Làm nhiệm vụ để nhận thêm",
    time: "Hôm qua",
    read: false,
    recent: true,
  },
  {
    id: "mission",
    icon: GiftIcon,
    tone: "income",
    title: "+5 lượt AI",
    body: "Nhiệm vụ: Thêm tài khoản",
    time: "05/10",
    read: true,
    recent: false,
  },
]

/**
 * The bell at the top of the overview, with the unread count, and the page
 * sheet it opens: new notices first, each one marked read when tapped.
 */
export function NotificationsButton() {
  const [notices, setNotices] = React.useState(sampleNotices)
  const unread = notices.filter((notice) => !notice.read).length
  const markRead = (id?: string) =>
    setNotices((current) => current.map((notice) => (!id || notice.id === id ? { ...notice, read: true } : notice)))

  const group = (title: string, items: Notice[]) =>
    items.length > 0 ? (
      <SettingsGroup title={title}>
        {items.map((notice) => (
          <SettingsRow
            key={notice.id}
            icon={notice.icon}
            tone={notice.tone}
            title={notice.title}
            description={notice.body}
            chevron={false}
            onClick={() => markRead(notice.id)}
            action={
              <span className="flex flex-col items-end gap-1.5">
                <span className="text-xs text-muted-foreground">{notice.time}</span>
                <span
                  aria-label={notice.read ? undefined : "Chưa đọc"}
                  className={notice.read ? "size-2" : "size-2 rounded-full bg-transfer"}
                />
              </span>
            }
          />
        ))}
      </SettingsGroup>
    ) : null

  return (
    <PageSheet
      title="Thông báo"
      surface="grouped"
      className="space-y-6"
      trigger={
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
          className="relative shrink-0"
        >
          <BellIcon />
          {unread > 0 ? (
            <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-warning ring-2 ring-field" />
          ) : null}
        </Button>
      }
      action={
        unread > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => markRead()}>
            Đọc hết
          </Button>
        ) : null
      }
    >
      {notices.length > 0 ? (
        <>
          {group("Mới", notices.filter((notice) => notice.recent))}
          {group("Trước đó", notices.filter((notice) => !notice.recent))}
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có thông báo</EmptyTitle>
            <EmptyDescription>Nhắc nhở và tin về khoản nợ sẽ hiện ở đây.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageSheet>
  )
}
