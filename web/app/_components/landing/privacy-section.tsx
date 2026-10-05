"use client"

import {
  CookieIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Reveal } from "./motion-primitives"

const POINTS = [
  {
    icon: UserRoundCheckIcon,
    title: "Đăng nhập bằng Google",
    description: "Không cần tạo hay ghi nhớ thêm mật khẩu nào khác.",
  },
  {
    icon: CookieIcon,
    title: "Phiên đăng nhập an toàn",
    description: "Phiên được lưu bằng cookie HTTP-only, mã JavaScript trên trang không đọc được.",
  },
  {
    icon: ServerIcon,
    title: "Xử lý phía máy chủ",
    description: "Dữ liệu chỉ được đọc, ghi sau khi máy chủ xác minh phiên của bạn.",
  },
  {
    icon: EyeOffIcon,
    title: "Tách biệt từng người",
    description: "Mỗi thao tác chỉ chạm tới dữ liệu thuộc tài khoản của chính bạn.",
  },
] as const

export function PrivacySection() {
  return (
    <section
      id="bao-mat"
      aria-labelledby="privacy-title"
      className="pt-8 pb-20 sm:pt-12 sm:pb-28"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal className="flex flex-col items-start">
          <Badge variant="secondary">
            <LockKeyholeIcon />
            Khu vực cá nhân
          </Badge>
          <h2 id="privacy-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Dữ liệu của bạn, chỉ bạn xem được
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground sm:text-lg">
            Trang giới thiệu này là công khai, còn mọi số liệu tài chính nằm
            phía sau đăng nhập. Không có tài khoản, giao dịch hay khoản vay nào
            được hiển thị ở đây.
          </p>
          <ShieldPulse />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((point, index) => {
            const Icon = point.icon

            return (
              <Reveal key={point.title} delay={index * 0.08}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle>{point.title}</CardTitle>
                    <CardDescription className="leading-6">
                      {point.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ShieldPulse() {
  return (
    <div className="relative mt-10 hidden size-28 items-center justify-center lg:flex" aria-hidden="true">
      {/* One CSS keyframe drives scale and opacity together, so a ring never
          reappears at full size for a frame when its loop restarts. */}
      {[0, 1, 2].map((ring) => (
        <span
          key={ring}
          className="absolute size-20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-foreground/20 motion-reduce:animate-none"
          style={{ animationDelay: `${ring}s` }}
        />
      ))}
      <span className="relative flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
        <ShieldCheckIcon className="size-10" />
      </span>
    </div>
  )
}
