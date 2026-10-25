"use client"

import * as React from "react"
import {
  AlarmClockIcon,
  BellIcon,
  CheckCheckIcon,
  CrownIcon,
  GiftIcon,
  HandCoinsIcon,
  MegaphoneIcon,
  PencilLineIcon,
  SparklesIcon,
  TrendingDownIcon,
  type LucideIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"

import type { IconTileTone } from "@/components/app/icon-tile"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { TimiIcon } from "@/components/timi-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { sendAppEvent } from "@/lib/app-events"
import { formatMomentLabel } from "@/lib/format-date"
import { markNoticesReadAction } from "@/lib/notices/actions"
import type { Notice, NoticeKind } from "@/lib/notices/types"

/** Each kind's icon and colour: warnings amber, money red or green, the plan's in the AI's lime. */
const looks: Record<NoticeKind, { icon: LucideIcon; tone: IconTileTone }> = {
  "debt-due": { icon: HandCoinsIcon, tone: "warning" },
  "debt-overdue": { icon: AlarmClockIcon, tone: "expense" },
  unrecorded: { icon: PencilLineIcon, tone: "orange" },
  missions: { icon: GiftIcon, tone: "income" },
  ai: { icon: SparklesIcon, tone: "ai" },
  pro: { icon: CrownIcon, tone: "ai" },
  negative: { icon: TrendingDownIcon, tone: "expense" },
  release: { icon: BellIcon, tone: "neutral" },
  // Shown with Timi's own icon instead, as a phone shows an app's notice.
  broadcast: { icon: MegaphoneIcon, tone: "neutral" },
}

// What a version brought: the release notes (lib/releases.ts, which grows
// with every version) load when the sheet opens, not with every page.
const loadReleaseScreen = () => import("./release-screen")
const ReleaseScreen = dynamic(() => loadReleaseScreen().then((module) => module.ReleaseScreen), { ssr: false })

/*
 * The notices, shared by the bells on the page (a phone's and the desktop
 * bar's) and kept for a minute: changing pages asked the server again each
 * time, while the new page was being made (2026-10-17). Opening the sheet,
 * coming back to the app or reading a notice asks again.
 */
const NOTICES_FRESH_MS = 60_000
let noticesAt = 0
let noticesLoad: Promise<Notice[]> | null = null

function fetchNotices(fresh: boolean) {
  if (!fresh && noticesLoad && Date.now() - noticesAt < NOTICES_FRESH_MS) return noticesLoad
  noticesAt = Date.now()
  // A route, not getNoticesAction: Server Actions go one at a time with a
  // navigation waiting behind them, and this runs as every page opens.
  const load = fetch("/api/notices", { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error(String(response.status))
    return response.json() as Promise<Notice[]>
  })
  noticesLoad = load
  load.catch(() => {
    if (noticesLoad === load) noticesLoad = null
  })
  return load
}

/** Notices just read: the next bell to load asks the server, which has them read. */
function forgetNotices() {
  noticesAt = 0
}

/**
 * The bell, with the unread count while there is any, and the page sheet it
 * opens: notices worked out from the user's data (lib/notices), unread ones
 * first under "Mới" with a blue dot on their icon and the title in semibold,
 * each with when it came; ✓✓ in the bar reads them all, which is kept on the
 * server so every device agrees. A tap marks it read and opens what it is
 * about, closing the sheet (a debt, the add-transaction sheet, the plans, an
 * account), or, for a new version, what it brought on a screen of the sheet.
 * What the admin sent ("Tin từ Timi") carries Timi's icon.
 * On phones it sits at the top of the overview, a white elevated round button; on
 * wider screens in the top bar beside the theme switch, bare like it
 * (`variant="ghost"`).
 */
export function NotificationsButton({
  variant = "elevated",
  size = "icon",
}: {
  /** `secondary`: the grey round button, on the desktop top bar's white (2026-10-25). */
  variant?: "elevated" | "ghost" | "secondary"
  /** 44, a phone header's; `icon-sm` 36, the desktop top bar's. */
  size?: "icon" | "icon-sm"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [release, setRelease] = React.useState<string | null>(null)
  // Worked out from the user's data on the server: loaded as the page shows
  // the bell (shared and kept a minute, see fetchNotices), and afresh each
  // time the sheet opens or the app comes back to the front.
  const load = React.useCallback((fresh = false) => {
    void fetchNotices(fresh).then(setNotices, () => undefined)
  }, [])
  React.useEffect(() => load(), [load, pathname])
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [load])
  const unread = notices.filter((notice) => !notice.read).length
  const markRead = (keys: string[]) => {
    if (keys.length === 0) return
    setNotices((current) => current.map((notice) => (keys.includes(notice.key) ? { ...notice, read: true } : notice)))
    forgetNotices()
    void markNoticesReadAction(keys)
  }
  const openNotice = (notice: Notice) => {
    markRead([notice.key])
    if (!notice.opens) return
    if ("release" in notice.opens) {
      setRelease(notice.opens.release)
      return
    }
    setOpen(false)
    if ("href" in notice.opens) router.push(notice.opens.href)
    else sendAppEvent(notice.opens.event, pathname, (href) => router.push(href))
  }

  const group = (title: string, items: Notice[]) =>
    items.length > 0 ? (
      <SettingsGroup title={title}>
        {items.map((notice) => (
          <SettingsRow
            key={notice.key}
            icon={notice.kind === "broadcast" ? undefined : looks[notice.kind].icon}
            tone={looks[notice.kind].tone}
            media={notice.kind === "broadcast" ? <TimiIcon size={36} className="size-9" /> : undefined}
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
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          // Here, not on closing: a version's screen stays as the sheet goes down.
          setRelease(null)
          load(true)
          void loadReleaseScreen()
        }
      }}
      trigger={
        <Button
          type="button"
          size={size}
          variant={variant}
          aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
          className="relative shrink-0"
        >
          <BellIcon />
          {unread > 0 ? (
            // On the bell's shoulder, from just right of its centre, so a wider "9+" grows outwards.
            // On the grey disc (the desktop bar) at the disc's corner instead, ringed in the bar's
            // white: inside it, ringed in the page's grey, it bit into the disc, which then looked
            // smaller than the avatar beside it (2026-10-25).
            <Badge
              variant="count"
              aria-hidden="true"
              className={variant === "secondary" ? "absolute -top-1 left-[calc(100%-12px)] ring-card" : "absolute top-0.5 left-[calc(50%+4px)]"}
            >
              {unread > 9 ? "9+" : unread}
            </Badge>
          ) : null}
        </Button>
      }
      action={
        unread > 0 ? (
          // A round button like ✕, its double tick saying "all read".
          <Button
            type="button"
            variant="elevated"
            size="icon"
            aria-label="Đánh dấu tất cả đã đọc"
            onClick={() => markRead(notices.filter((notice) => !notice.read).map((notice) => notice.key))}
          >
            <CheckCheckIcon />
          </Button>
        ) : null
      }
    >
      <ReleaseScreen version={release} onBack={() => setRelease(null)} />
      {notices.length > 0 ? (
        <>
          {group("Mới", notices.filter((notice) => !notice.read))}
          {group("Đã xem", notices.filter((notice) => notice.read))}
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có thông báo</EmptyTitle>
            <EmptyDescription>Khoản nợ sắp đến hạn, lượt AI, nhắc ghi chi tiêu… sẽ hiện ở đây.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageSheet>
  )
}
