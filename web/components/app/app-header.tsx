"use client"

import * as React from "react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/debts/initials"
import { cn } from "@/lib/utils"

type HeaderAccount = { name: string; avatar: string; pro: boolean }

const HeaderAccountContext = React.createContext<HeaderAccount | null>(null)

/** Who is signed in and whether on Pro, for the avatar of every page's header; set once by the main layout. */
export function HeaderAccountProvider({ account, children }: { account: HeaderAccount; children: React.ReactNode }) {
  return <HeaderAccountContext.Provider value={account}>{children}</HeaderAccountContext.Provider>
}

/** The signed-in person, from the main layout. */
export function useHeaderAccount() {
  return React.useContext(HeaderAccountContext)
}

/**
 * The person on the left of every page's bar on phones (2026-10-24), opening
 * Settings: the avatar at the 44 of the round buttons beside it, initials in
 * ink (white in the dark theme) when there is no picture. On Pro a small PRO
 * label lies across its foot, as Instagram's LIVE does, cut out of the avatar
 * by a rim of the page's colour; the avatar itself stays as it is.
 */
export function HeaderAvatar({ className }: { className?: string }) {
  const account = useHeaderAccount()
  if (!account) return <span aria-hidden="true" className={cn("size-11", className)} />

  return (
    <Link
      href="/settings"
      aria-label={account.pro ? "Cài đặt, gói Pro" : "Cài đặt"}
      className={cn(
        "pressable relative grid size-11 shrink-0 place-items-center rounded-full outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Avatar size="lg" className="size-11">
        <AvatarImage src={account.avatar} alt="" />
        <AvatarFallback inverse>{getInitials(account.name)}</AvatarFallback>
      </Avatar>
      {account.pro ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ai px-[5px] text-[9px] leading-[14px] font-extrabold tracking-[0.06em] text-ai-foreground ring-2 ring-background"
        >
          PRO
        </span>
      ) : null}
    </Link>
  )
}

/**
 * A page's bar on phones (2026-10-24, after the user's pictures): the person
 * on the left, the page's name or one control (Tổng quan's date, Giao dịch's
 * Chi tiêu | Vay nợ) in the middle of the screen whatever sits beside it, the
 * page's round buttons on the right. 44 high, 16 above the content. The sides
 * never shrink below their buttons; a middle too wide for what is left shrinks
 * (and truncates) instead.
 */
export function AppHeader({
  center,
  actions,
  fromMd = "hidden",
  className,
}: {
  center: React.ReactNode
  actions?: React.ReactNode
  /**
   * From md up, where the sidebar and the top bar hold the person and the
   * tools: no bar (`hidden`), or only the middle, on the left (`lead`, as
   * Giao dịch's Chi tiêu | Vay nợ).
   */
  fromMd?: "hidden" | "lead"
  className?: string
}) {
  const lead = fromMd === "lead"
  return (
    <div
      data-slot="app-header"
      className={cn(
        "mb-4 grid min-h-11 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3",
        lead ? "md:flex" : "md:hidden",
        className,
      )}
    >
      <span className={cn("flex justify-self-start", lead && "md:hidden")}>
        <HeaderAvatar />
      </span>
      <span className={cn("flex min-w-0 justify-center", lead && "md:justify-start")}>{center}</span>
      <span className={cn("flex items-center gap-2 justify-self-end", lead && "md:hidden")}>{actions}</span>
    </div>
  )
}

/** The page's name in the middle of the bar: iOS's 17, semibold. */
export function AppHeaderTitle({ children, as: Tag = "h1" }: { children: React.ReactNode; as?: "h1" | "p" }) {
  return <Tag className="truncate text-center text-[17px] font-semibold tracking-tight">{children}</Tag>
}
