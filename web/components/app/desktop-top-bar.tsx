"use client"

/**
 * The desktop top bar (2026-10-25, replacing the sidebar), full width after
 * Stripe and Vercel (the user's second pick, over the segmented control in
 * a centred column): the logo and the name, then the pages as words; on the
 * right Hỏi Timi (⌘K), the bell and the avatar.
 * The avatar opens the person's menu: who and the plan, Settings, the theme.
 * A page's own tools (the month, its actions) are not here but in the
 * page's first row (PageHeader `bare`).
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckIcon, SettingsIcon, SparklesIcon } from "lucide-react"

import { useOpenAssistant } from "@/components/ai-assistant/assistant"
import { useHeaderAccount } from "@/components/app/app-header"
import { NotificationsButton } from "@/components/notifications-sheet"
import { TimiIcon } from "@/components/timi-icon"
import { TimiWordmark } from "@/components/timi-wordmark"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { appNavigationItems, menuUrlFor } from "@/lib/app-navigation"
import { getInitials } from "@/lib/debts/initials"
import { cn } from "@/lib/utils"
import { themeOptions, useThemeChoice } from "@/app/(main)/settings/_components/theme-options"


function useActiveUrl() {
  const pathname = usePathname()
  const url = menuUrlFor(pathname)
  return appNavigationItems.find((item) => url === item.url || url.startsWith(`${item.url}/`))?.url ?? null
}

/** The logo and the name: the icon, Timi, a quiet BETA. */
function Brand() {
  return (
    <Link
      href="/overview"
      aria-label="Timi, về Tổng quan"
      className="group/brand flex items-center gap-2 justify-self-start rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <TimiIcon size={30} className="size-[30px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/brand:-rotate-6 group-active/brand:scale-95 motion-reduce:transition-none" />
      <TimiWordmark className="text-[21px]" />
      <span className="ml-0.5 rounded-full bg-fill-2 px-1.5 text-[10px] leading-4 font-bold tracking-[0.06em] text-muted-foreground">
        BETA
      </span>
    </Link>
  )
}

/**
 * The pages as words beside the logo (2026-10-25, the full-width bar): the
 * one shown in ink on a soft grey pill that slides from page to page, the
 * others grey, darkening under a pointer. The pill is one element measured
 * against the row and moved with a transition: a layout animation measured
 * it against the page, so after a scroll it flew in from below the bar.
 */
function PageTabs() {
  const current = useActiveUrl()
  // The page tapped, until it is the one shown: the pill leaves at the tap, not once the page has loaded.
  const [tapped, setTapped] = React.useState<{ url: string; from: string | null } | null>(null)
  const active = tapped && tapped.from === current ? tapped.url : current
  const navRef = React.useRef<HTMLElement>(null)
  const [pill, setPill] = React.useState<{ left: number; width: number; ready: boolean } | null>(null)

  React.useLayoutEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector<HTMLElement>("[aria-current=page]")
    if (!nav || !link) {
      setPill(null)
      return
    }
    const place = () => setPill((current) => ({ left: link.offsetLeft, width: link.offsetWidth, ready: current !== null }))
    place()
    // The words can change width as the font loads.
    const observer = new ResizeObserver(place)
    observer.observe(link)
    return () => observer.disconnect()
  }, [active])

  return (
    <nav ref={navRef} aria-label="Trang" className="relative flex items-center gap-1">
      {pill ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0 left-0 h-9 rounded-[10px] bg-fill-2",
            pill.ready && "transition-[translate,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          )}
          style={{ translate: `${pill.left}px 0`, width: pill.width }}
        />
      ) : null}
      {appNavigationItems.map((item) => {
        const on = item.url === active
        return (
          <Link
            key={item.url}
            href={item.url}
            aria-current={on ? "page" : undefined}
            onClick={(event) => {
              // Opened in another tab or window, this page stays: so does the pill.
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
              setTapped({ url: item.url, from: current })
            }}
            className={cn(
              "group/tab relative flex h-9 items-center rounded-[10px] px-3.5 text-[15px] font-medium outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/30",
              on ? "text-foreground" : "text-muted-foreground hover:bg-fill-1 hover:text-foreground",
            )}
          >
            <span className="relative transition-transform duration-150 ease-out group-active/tab:scale-[0.96] motion-reduce:transition-none">
              {item.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Hỏi Timi: a pill button, the sparkle on its lime dot, the name and ⌘K
 * (Ctrl K), which opens the assistant from anywhere. A button, not a field
 * (2026-10-25: drawn as a search field it read as somewhere to type).
 */
function AskTimi() {
  const open = useOpenAssistant()
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <button
      type="button"
      onClick={open}
      aria-keyshortcuts="Meta+K Control+K"
      className="group/ask pressable flex h-9 items-center gap-2 rounded-full bg-secondary pr-2 pl-1.5 text-sm font-semibold outline-none transition-colors duration-150 hover:bg-fill-3 focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-ai text-ai-foreground">
        <SparklesIcon className="size-3.5 transition-transform duration-300 ease-out group-hover/ask:rotate-12" />
      </span>
      Hỏi Timi
      <kbd className="rounded-[6px] bg-raised px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground shadow-[0_0_0_1px_var(--border)]">⌘K</kbd>
    </button>
  )
}

/** The avatar, opening the person's menu: who, the plan, Settings, the theme. */
function AccountMenu() {
  const account = useHeaderAccount()
  const { choice, choose } = useThemeChoice()
  if (!account) return null
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={account.pro ? "Tài khoản, gói Pro" : "Tài khoản"}
        className="relative grid size-9 shrink-0 place-items-center rounded-full outline-none transition-[scale,box-shadow] duration-200 ease-out hover:shadow-[0_0_0_3px_var(--fill-3)] focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.96] data-[state=open]:shadow-[0_0_0_3px_var(--fill-3)] motion-reduce:transition-none"
      >
        <Avatar className="size-full">
          <AvatarImage src={account.avatar} alt="" />
          <AvatarFallback inverse className="text-xs font-bold">
            {getInitials(account.name)}
          </AvatarFallback>
        </Avatar>
        {account.pro ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ai px-[4px] text-[8px] leading-3 font-extrabold tracking-[0.06em] text-ai-foreground ring-2 ring-background"
          >
            PRO
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar className="size-10">
            <AvatarImage src={account.avatar} alt="" />
            <AvatarFallback inverse className="text-sm font-semibold">
              {getInitials(account.name)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{account.name}</span>
            <span className="block text-xs font-medium text-muted-foreground">{account.pro ? "Gói Pro" : "Gói Miễn phí"}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <SettingsIcon /> Cài đặt
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Giao diện</DropdownMenuLabel>
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onSelect={(event) => {
                event.preventDefault()
                choose(value)
              }}
            >
              <Icon /> {label}
              <CheckIcon className={cn("ml-auto transition-opacity", choice === value ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Whether the page has scrolled under the bar. */
function useScrolled() {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return scrolled
}

/**
 * The bar, from md up (phones keep their own headers and the tab bar), in
 * the full-width style the user picked (2026-10-25, after Stripe and Vercel):
 * across the whole window on the card's white with a hairline under it; the
 * logo and the pages on the left, Hỏi Timi, the bell and the avatar on the
 * right (Ghi giao dịch left the bar, the user's call).
 * 64 tall, its controls 36. Once the page scrolls under it, a soft fall.
 * `inline`: in place (the design catalogue's sample).
 */
export function DesktopTopBar({ inline = false }: { inline?: boolean }) {
  const scrolled = useScrolled() && !inline

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "top-0 z-30 hidden bg-card shadow-[0_1px_0_var(--border)] transition-shadow duration-300 ease-out data-scrolled:shadow-[0_1px_0_var(--border),0_8px_24px_-14px_rgb(0_0_0/0.14)] md:block dark:data-scrolled:shadow-[0_1px_0_var(--border),0_8px_24px_-12px_rgb(0_0_0/0.7)]",
        inline ? "relative rounded-2xl" : "sticky",
      )}
    >
      <div className="flex h-16 items-center gap-8 px-6 xl:px-8">
        <Brand />
        <PageTabs />
        <div className="ml-auto flex items-center gap-2.5">
          <AskTimi />
          {/* A grey disc as the avatar's beside it and Hỏi Timi's, so the three read one size (2026-10-25: bare, the bell looked smaller). */}
          <NotificationsButton variant="secondary" size="icon-sm" />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
