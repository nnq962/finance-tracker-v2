"use client"

/**
 * The desktop top bar (2026-10-25, replacing the sidebar; the user's pick A
 * of three, refined twice): the logo and the name on the left, the pages in
 * the middle on the app's segmented control (the chosen one on the raised
 * thumb, its glyph filled as on the phone's tab bar), Hỏi Timi, the bell and
 * the avatar on the right. 60 tall, its controls 36. Hỏi Timi is a small lime
 * circle that opens to its name on hover or focus; ⌘K (Ctrl K) opens it too.
 * The avatar opens the person's menu: who and the plan, Settings, the theme
 * (the theme switch left the bar). A page's own tools (the month, its
 * actions) are not here but in the page's first row (PageHeader `bare`).
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { appNavigationItems, menuUrlFor } from "@/lib/app-navigation"
import { getInitials } from "@/lib/debts/initials"
import { desktopColumnClassName } from "@/lib/desktop-column"
import { cn } from "@/lib/utils"
import { themeOptions, useThemeChoice } from "@/app/(main)/settings/_components/theme-options"

// The thumb's slide (2026-10-25: kept over a quicker spring with a highlight following the pointer, which read as busy).
const thumbSpring = { type: "spring", duration: 0.35, bounce: 0.12 } as const

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

/** The pages on the segmented control: the chosen one on the raised thumb. */
function PageTabs() {
  const active = useActiveUrl()
  const reduced = useReducedMotion()

  return (
    <LayoutGroup id="top-bar-tabs">
      <nav
        aria-label="Trang"
        className="flex h-10 items-center rounded-full bg-fill-3 p-[3px] dark:bg-fill-2"
      >
        {appNavigationItems.map((item) => {
          const on = item.url === active
          const Glyph = item.tabIcon
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={on ? "page" : undefined}
              className={cn(
                "group/tab relative flex h-[34px] items-center justify-center gap-1.5 rounded-full pr-4 pl-3.5 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/30",
                on ? "text-foreground" : "text-foreground/55 hover:text-foreground/85",
              )}
            >
              {on ? (
                <motion.span
                  layoutId="thumb"
                  transition={reduced ? { duration: 0 } : thumbSpring}
                  className="absolute inset-0 rounded-full bg-segment-thumb shadow-segment-thumb"
                />
              ) : null}
              {/* Pressed, the label and glyph give a little, as a key does. */}
              <span className="relative flex items-center gap-1.5 transition-transform duration-150 ease-out group-active/tab:scale-[0.96] motion-reduce:transition-none">
                <Glyph aria-hidden="true" weight={on ? "fill" : "regular"} className="size-[17px]" />
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </LayoutGroup>
  )
}

/**
 * Hỏi Timi: a 36 lime circle with the sparkle; on hover or focus its name
 * slides out of it and the sparkle turns. ⌘K (Ctrl K) opens it too.
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={open}
          aria-label="Hỏi Timi"
          aria-keyshortcuts="Meta+K Control+K"
          className="group/ai flex h-9 items-center rounded-full bg-ai px-2.5 text-ai-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--ai)_70%,transparent)] outline-none transition-[padding,box-shadow,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:pr-3.5 hover:shadow-[0_4px_14px_-3px_color-mix(in_oklab,var(--ai)_85%,transparent)] focus-visible:pr-3.5 focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.96] motion-reduce:transition-none"
        >
          <SparklesIcon
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/ai:rotate-[18deg] group-hover/ai:scale-110 motion-reduce:transition-none"
          />
          {/* The name in a column that grows from nothing, so the circle widens into a pill. */}
          <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/ai:grid-cols-[1fr] group-focus-visible/ai:grid-cols-[1fr] motion-reduce:transition-none">
            <span className="overflow-hidden">
              <span className="block pl-1.5 text-[13px] font-semibold whitespace-nowrap opacity-0 blur-[2px] transition-[opacity,filter] duration-200 group-hover/ai:opacity-100 group-hover/ai:blur-none group-hover/ai:delay-75 group-focus-visible/ai:opacity-100 group-focus-visible/ai:blur-none">
                Hỏi Timi
              </span>
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <span className="flex items-center gap-2">
          Mở trợ lý
          <kbd className="rounded-[5px] bg-background/15 px-1.5 font-sans text-[11px] font-semibold">⌘K</kbd>
        </span>
      </TooltipContent>
    </Tooltip>
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
 * The bar, from md up (phones keep their own headers and the tab bar): 60
 * tall on the page's colour at rest; once the page scrolls under it, frosted
 * (the page's colour at 80%, blurred) with a hairline and a soft fall. Its
 * column is the content's (desktopColumnClassName), so the logo and the
 * avatar line up with the cards' edges. `inline`: in place, never frosted
 * (the design catalogue's sample).
 */
export function DesktopTopBar({ inline = false }: { inline?: boolean }) {
  const scrolled = useScrolled() && !inline

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "top-0 z-30 hidden bg-background transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out data-scrolled:bg-background/80 data-scrolled:shadow-[0_1px_0_var(--border),0_8px_24px_-12px_rgb(0_0_0/0.12)] data-scrolled:backdrop-blur-xl data-scrolled:backdrop-saturate-150 md:block dark:data-scrolled:shadow-[0_1px_0_var(--border),0_8px_24px_-12px_rgb(0_0_0/0.7)]",
        inline ? "relative" : "sticky",
      )}
    >
      <div className={cn("grid h-[60px] grid-cols-[1fr_auto_1fr] items-center", desktopColumnClassName)}>
        <Brand />
        <PageTabs />
        <div className="flex items-center justify-end gap-2">
          <AskTimi />
          <NotificationsButton variant="elevated" size="icon-sm" />
          <span className="ml-1.5 flex">
            <AccountMenu />
          </span>
        </div>
      </div>
    </header>
  )
}
