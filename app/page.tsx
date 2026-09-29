import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CircleDollarSignIcon,
  HandCoinsIcon,
  LandmarkIcon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletCardsIcon,
} from "lucide-react"

import { PwaInstallButton } from "@/components/pwa-install-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site"

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
}

const features = [
  {
    title: "Quản lý tài khoản",
    description:
      "Theo dõi tiền mặt, tài khoản ngân hàng và ví điện tử cùng số dư hiện tại.",
    icon: WalletCardsIcon,
    iconClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    title: "Ghi chép thu chi",
    description:
      "Lưu khoản thu, khoản chi và chuyển tiền theo thời gian, tài khoản và hạng mục.",
    icon: ReceiptTextIcon,
    iconClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    title: "Theo dõi vay nợ",
    description:
      "Quản lý khoản cho vay, đi vay, lịch thanh toán và số tiền còn lại cần xử lý.",
    icon: HandCoinsIcon,
    iconClassName:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    title: "Tổng quan tài chính",
    description:
      "Nhìn nhanh tài sản ròng, dòng tiền và các khoản cần chú ý trên một màn hình.",
    icon: BarChart3Icon,
    iconClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
] as const

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "vi-VN",
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-svh overflow-hidden bg-[#fbfaf7] dark:bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="relative z-20 border-b border-[#e7e4dd] bg-[#fbfaf7]/90 backdrop-blur dark:border-[#35323e] dark:bg-background/90">
        <nav
          aria-label="Điều hướng chính"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Finance Tracker – Trang chủ"
          >
            <Image src="/icon.svg" alt="" width={36} height={36} className="size-9" />
            <span className="hidden whitespace-nowrap font-heading text-base font-extrabold min-[360px]:inline sm:text-lg">
              Finance Tracker
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
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

      <main>
        <section className="relative isolate">
          <div
            className="pointer-events-none absolute -left-32 top-20 -z-10 size-80 rounded-full bg-[#6ecc49]/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-32 top-0 -z-10 size-96 rounded-full bg-[#38b8f6]/12 blur-3xl"
            aria-hidden="true"
          />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)] lg:gap-16 lg:py-28">
            <div className="flex flex-col items-start">
              <Badge variant="default">
                <SparklesIcon />
                Tài chính rõ ràng hơn
              </Badge>
              <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Hiểu dòng tiền của bạn,
                <span className="block text-[#0083c4] dark:text-[#38b8f6]">
                  không cần bảng tính rối rắm.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Finance Tracker giúp bạn quản lý thu chi, số dư tài khoản, các
                khoản vay nợ và tài sản ròng trong cùng một nơi dễ theo dõi.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/overview">
                    Bắt đầu quản lý
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="#tinh-nang">Xem tính năng</Link>
                </Button>
                <PwaInstallButton />
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheckIcon className="size-4 text-[#3e9727]" aria-hidden="true" />
                Đăng nhập nhanh và an toàn bằng tài khoản Google.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div
                className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-[#d6f4ff] dark:bg-[#113950]"
                aria-hidden="true"
              />
              <Card className="relative gap-5 shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Tổng quan tài chính</CardTitle>
                      <CardDescription>Mọi con số quan trọng trong tầm mắt</CardDescription>
                    </div>
                    <Badge variant="secondary">Tháng này</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-br from-slate-900 via-teal-800 to-emerald-700 p-6 text-white">
                    <p className="flex items-center gap-2 text-sm text-white/75">
                      <CircleDollarSignIcon className="size-4" aria-hidden="true" />
                      Tài sản ròng
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums">
                      24.680.000đ
                    </p>
                    <p className="mt-4 text-sm text-white/70">
                      Số dư tài khoản + được trả − phải trả
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                      <p className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                        <ArrowDownLeftIcon className="size-4" aria-hidden="true" />
                        Đã thu
                      </p>
                      <p className="mt-2 text-xl text-emerald-700 tabular-nums dark:text-emerald-300">
                        +8.400.000đ
                      </p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/40">
                      <p className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-200">
                        <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                        Đã chi
                      </p>
                      <p className="mt-2 text-xl text-rose-700 tabular-nums dark:text-rose-300">
                        −3.200.000đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#d4d1ca] p-4 dark:border-[#4a4652]">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <LandmarkIcon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Tổng số dư tài khoản</p>
                      <p className="text-lg tabular-nums">20.480.000đ</p>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section
          id="tinh-nang"
          aria-labelledby="features-title"
          className="scroll-mt-20 border-y border-[#e7e4dd] bg-white py-16 dark:border-[#35323e] dark:bg-card/30 sm:py-20"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <Badge variant="secondary">Một nơi để theo dõi</Badge>
              <h2 id="features-title" className="mt-4 text-3xl tracking-tight sm:text-4xl">
                Từ từng giao dịch đến bức tranh tài chính tổng thể
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Các phần trong Finance Tracker kết nối với nhau để số dư và
                tổng quan luôn phản ánh những gì bạn đã ghi lại.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <Card key={feature.title} className="h-full">
                    <CardHeader>
                      <div
                        className={`mb-3 flex size-11 items-center justify-center rounded-xl ${feature.iconClassName}`}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription className="leading-6">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16">
          <div>
            <Badge variant="grape">
              <LockKeyholeIcon />
              Khu vực cá nhân
            </Badge>
            <h2 className="mt-4 text-3xl tracking-tight sm:text-4xl">
              Trang giới thiệu công khai, dữ liệu tài chính ở phía sau đăng nhập
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Công cụ quản lý tài chính chỉ mở sau khi bạn đăng nhập. Trang công
              khai này chỉ giới thiệu tính năng và không hiển thị dữ liệu tài
              khoản, giao dịch hay vay nợ của người dùng.
            </p>
          </div>

          <Card>
            <CardContent className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Badge variant="outline">01</Badge>
                <h3 className="text-lg">Đăng nhập</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Truy cập bằng tài khoản Google của bạn.
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">02</Badge>
                <h3 className="text-lg">Ghi lại</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Thêm tài khoản, giao dịch và khoản vay nợ.
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">03</Badge>
                <h3 className="text-lg">Theo dõi</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Xem dòng tiền và tài sản ròng theo thời gian.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center rounded-3xl border-2 border-[#35323e] bg-[#242333] px-6 py-12 text-center text-white shadow-[0_8px_0_#15141d] dark:border-[#4a4652] sm:px-10">
            <Badge variant="sun">Sẵn sàng bắt đầu?</Badge>
            <h2 className="mt-5 max-w-2xl text-3xl tracking-tight sm:text-4xl">
              Đưa các con số về cùng một nơi dễ hiểu.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-white/70">
              Bắt đầu ghi chép và theo dõi bức tranh tài chính cá nhân của bạn.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/overview">
                Mở Finance Tracker
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e7e4dd] dark:border-[#35323e]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <Image src="/icon.svg" alt="" width={28} height={28} className="size-7" />
            <span className="font-heading font-extrabold">Finance Tracker</span>
          </div>
          <p>Quản lý tài chính cá nhân rõ ràng và đơn giản.</p>
        </div>
      </footer>
    </div>
  )
}
