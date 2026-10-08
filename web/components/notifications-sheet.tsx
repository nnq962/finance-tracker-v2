"use client"

import * as React from "react"
import { BellIcon, GiftIcon, HandCoinsIcon, PencilLineIcon, SparklesIcon, type LucideIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import type { IconTileTone } from "@/components/app/icon-tile"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { appEvents, sendAppEvent, type AppEvent } from "@/lib/app-events"
import { formatMomentLabel, toDateKey } from "@/lib/format-date"

type Notice = {
  id: string
  icon: LucideIcon
  tone: IconTileTone
  title: string
  body: string
  /** When it came, an ISO moment. */
  at: string
  read: boolean
  /** New ones are listed first, under "Mới". */
  recent: boolean
  /** What a tap opens: a page, or a sheet on its page. Without it, a tap only marks it read. */
  opens?: { href: string } | { event: AppEvent }
}

/** A moment on a day counted back from today, at a Vietnam clock time. */
function daysAgo(days: number, time: string) {
  const day = new Date(Date.now() - days * 86_400_000)
  return `${toDateKey(day)}T${time}:00+07:00`
}

// Mockup: sample notices until it is decided where they come from.
function sampleNotices(): Notice[] {
  return [
    {
      id: "debt",
      icon: HandCoinsIcon,
      tone: "warning",
      title: "Sắp đến hạn",
      body: "Lan · 500.000đ · còn 2 ngày",
      at: daysAgo(0, "08:00"),
      read: false,
      recent: true,
      opens: { href: "/debts" },
    },
    {
      id: "reminder",
      icon: PencilLineIcon,
      tone: "orange",
      title: "Chưa ghi chi tiêu",
      body: "Hôm qua bạn chưa ghi khoản nào",
      at: daysAgo(1, "20:00"),
      read: false,
      recent: true,
      opens: { event: appEvents.addTransaction },
    },
    {
      id: "ai",
      icon: SparklesIcon,
      tone: "ai",
      title: "Còn 3 lượt AI",
      body: "Nâng cấp Pro hoặc làm nhiệm vụ để có thêm",
      at: daysAgo(1, "09:30"),
      read: false,
      recent: true,
      opens: { event: appEvents.openPlans },
    },
    {
      id: "mission",
      icon: GiftIcon,
      tone: "income",
      title: "+5 lượt AI",
      body: "Nhiệm vụ: Thêm tài khoản",
      at: daysAgo(3, "10:15"),
      read: true,
      recent: false,
    },
  ]
}

/**
 * The bell, with the unread count while there is any, and the page sheet it
 * opens: new notices first, unread ones as in Mail (a blue dot, the title in
 * semibold), each with when it came. A tap marks it read and opens what it is
 * about, closing the sheet: the debts, the add-transaction sheet, the plans. On phones it
 * sits at the top of the overview, a grey round button; on wider screens in
 * the top bar beside the theme switch, bare like it (`variant="ghost"`).
 */
export function NotificationsButton({ variant = "secondary" }: { variant?: "secondary" | "ghost" }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [notices, setNotices] = React.useState(sampleNotices)
  const unread = notices.filter((notice) => !notice.read).length
  const markRead = (id?: string) =>
    setNotices((current) => current.map((notice) => (!id || notice.id === id ? { ...notice, read: true } : notice)))
  const openNotice = (notice: Notice) => {
    markRead(notice.id)
    if (!notice.opens) return
    setOpen(false)
    if ("href" in notice.opens) router.push(notice.opens.href)
    else sendAppEvent(notice.opens.event, pathname, (href) => router.push(href))
  }

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
            // A notice is read here, so its body shows whole.
            fullDescription
            unread={!notice.read}
            value={formatMomentLabel(notice.at)}
            chevron={Boolean(notice.opens)}
            onClick={() => openNotice(notice)}
          />
        ))}
      </SettingsGroup>
    ) : null

  return (
    <PageSheet
      title="Thông báo"
      surface="grouped"
      className="space-y-6"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          size="icon"
          variant={variant}
          aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
          className="relative shrink-0"
        >
          <BellIcon />
          {unread > 0 ? (
            // On the bell's shoulder, from just right of its centre, so a wider "9+" grows outwards.
            <Badge variant="count" aria-hidden="true" className="absolute top-1 left-[calc(50%+4px)]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          ) : null}
        </Button>
      }
      action={
        unread > 0 ? (
          // A pill as tall as ✕ and floating like it, so it is as easy to reach.
          <Button type="button" variant="secondary" onClick={() => markRead()}>
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
