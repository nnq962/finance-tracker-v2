"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { appNavigationItems } from "@/lib/app-navigation"

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#e7e4dd] bg-white/95 px-3 pt-1.5 [padding-bottom:env(safe-area-inset-bottom,0px)] backdrop-blur-xl dark:border-[#35323e] dark:bg-[#201e26]/95 md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-0.5">
        {appNavigationItems.map((item) => {
          const isActive = pathname === item.url
          const Icon = item.icon

          return (
            <li key={item.url} className="min-w-0">
              <Link
                href={item.url}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-muted-foreground transition-[background-color,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-[#38b8f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-[#e9f8ff] dark:focus-visible:ring-offset-[#201e26] dark:active:bg-[#113950]",
                  isActive &&
                    "bg-[#d6f4ff] text-[#0083c4] dark:bg-[#113950] dark:text-[#78d0ff]",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="max-w-full truncate font-heading text-[0.65rem] leading-none font-extrabold">
                  {item.mobileTitle}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
