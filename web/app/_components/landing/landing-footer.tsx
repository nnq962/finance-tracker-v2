import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

const FOOTER_LINKS = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#bao-mat", label: "Bảo mật" },
] as const

export function LandingFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION

  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href="/" className="flex w-fit items-center gap-2 rounded-lg">
            <Image src="/icon.svg" alt="" width={28} height={28} className="size-7" />
            <span className="font-semibold">Finance Tracker</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Quản lý tài chính cá nhân rõ ràng và đơn giản.
          </p>
        </div>

        <nav aria-label="Liên kết cuối trang" className="flex flex-wrap items-center gap-1 md:justify-end">
          {FOOTER_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </nav>
      </div>
      {version ? (
        <p className="mx-auto w-full max-w-7xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
          Phiên bản {version}
        </p>
      ) : null}
    </footer>
  )
}
