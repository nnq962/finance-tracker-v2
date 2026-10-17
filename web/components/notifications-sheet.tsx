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
import { usePathname, useRouter } from "next/navigation"

import type { IconTileTone } from "@/components/app/icon-tile"
import { PageSheet, usePageSheetScreen } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { TimiIcon } from "@/components/timi-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { sendAppEvent } from "@/lib/app-events"
import { formatMomentLabel } from "@/lib/format-date"
import { getNoticesAction, markNoticesReadAction } from "@/lib/notices/actions"
import type { Notice, NoticeKind } from "@/lib/notices/types"
import { changeKindLabels, releases, type ChangeKind } from "@/lib/releases"

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

/** What a version brought, on a screen of the sheet: new, improved, fixed. */
function ReleaseScreen({ version, onBack }: { version: string; onBack: () => void }) {
  const release = releases.find((item) => item.version === version)
  usePageSheetScreen({ title: `Bản ${version}`, onBack })
  if (!release) return null
  return (
    <div className="space-y-6">
      <p className="px-4 text-sm text-muted-foreground">{release.title}</p>
      {(["new", "improved", "fixed"] as ChangeKind[]).map((kind) => {
        const changes = release.changes.filter((change) => change.kind === kind)
        return changes.length > 0 ? (
          <SettingsGroup key={kind} title={changeKindLabels[kind]}>
            {changes.map((change) => (
              <li key={change.text} className={`${settingsSeparatorClassName()} px-4 py-3.5 text-sm`}>
                {change.text}
              </li>
            ))}
          </SettingsGroup>
        ) : null
      })}
    </div>
  )
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
 * On phones it sits at the top of the overview, a grey round button; on
 * wider screens in the top bar beside the theme switch, bare like it
 * (`variant="ghost"`).
 */
export function NotificationsButton({ variant = "secondary" }: { variant?: "secondary" | "ghost" }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [release, setRelease] = React.useState<string | null>(null)
  // Worked out from the user's data on the server: loaded as the page shows
  // the bell, and again each time the sheet opens.
  const load = React.useCallback(() => {
    void getNoticesAction().then(setNotices)
  }, [])
  React.useEffect(load, [load, pathname])
  const unread = notices.filter((notice) => !notice.read).length
  const markRead = (keys: string[]) => {
    if (keys.length === 0) return
    setNotices((current) => current.map((notice) => (keys.includes(notice.key) ? { ...notice, read: true } : notice)))
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
        setRelease(null)
        if (next) load()
      }}
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
          // A round button like ✕, its double tick saying "all read".
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Đánh dấu tất cả đã đọc"
            onClick={() => markRead(notices.filter((notice) => !notice.read).map((notice) => notice.key))}
          >
            <CheckCheckIcon />
          </Button>
        ) : null
      }
    >
      {release ? (
        <ReleaseScreen version={release} onBack={() => setRelease(null)} />
      ) : notices.length > 0 ? (
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
