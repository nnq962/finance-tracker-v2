"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { useMotionValueEvent, useScroll } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#bao-mat", label: "Bảo mật" },
] as const

export function LandingHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12)
  })

  return (
    // Keep the sticky header free of transforms and toggled filters so it never
    // re-layers mid-scroll; only the border color reacts to scrolling.
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-[#fbfaf7]/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl transition-colors duration-300 dark:bg-background/85",
        scrolled
          ? "border-[#e7e4dd] dark:border-[#35323e]"
          : "border-transparent",
      )}
    >
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Finance Tracker – Trang chủ"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 transition-transform duration-500 ease-out group-hover:rotate-[20deg]"
          />
          <span className="hidden whitespace-nowrap font-heading text-base font-extrabold min-[360px]:inline sm:text-lg">
            Finance Tracker
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Button variant="ghost" size="sm" asChild>
                <a href={link.href}>{link.label}</a>
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/overview">
              Mở ứng dụng
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
