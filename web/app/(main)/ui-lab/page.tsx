import type * as React from "react"
import { notFound } from "next/navigation"
import {
  ArrowRightIcon,
  BellIcon,
  ChevronRightIcon,
  PaletteIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"

import { Page, PageHeader } from "@/components/page"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import {
  Tabs as AnimatedTabs,
  TabsList as AnimatedTabsList,
  TabsTrigger as AnimatedTabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { CurrencyInputExample } from "./_components/currency-input-example"
import { SonnerExamples } from "./_components/sonner-examples"
import { SwitchExamples } from "./_components/switch-examples"

const surfaces = [
  { name: "Nền trang", token: "background", className: "bg-background" },
  { name: "Thẻ", token: "card", className: "bg-card" },
  { name: "Xám phụ", token: "secondary", className: "bg-secondary" },
  { name: "Ô nhập", token: "surface-2", className: "bg-surface-2" },
  { name: "Chính", token: "primary", className: "bg-primary" },
] as const

const semantics = [
  { name: "Thu", className: "bg-income", soft: "bg-income-soft text-income" },
  { name: "Chi", className: "bg-expense", soft: "bg-expense-soft text-expense" },
  { name: "Chuyển", className: "bg-transfer", soft: "bg-transfer-soft text-transfer" },
] as const

const typeScale = [
  { name: "Tiêu đề lớn · 30/600", className: "text-3xl font-semibold tracking-tight", sample: "Giao dịch" },
  { name: "Tiêu đề · 20/600", className: "text-xl font-semibold tracking-tight", sample: "Tài sản ròng" },
  { name: "Tiêu đề dòng · 15/500", className: "text-[15px] font-medium", sample: "Ăn trưa văn phòng" },
  { name: "Nội dung · 15/400", className: "text-[15px]", sample: "Ghi lại khoản chi đầu tiên để bắt đầu." },
  { name: "Phụ · 13/400", className: "text-[13px] text-muted-foreground", sample: "Ví MoMo · 12:30" },
  { name: "Chú thích · 12/500", className: "text-xs font-medium text-muted-foreground", sample: "Cập nhật lúc 09:41" },
] as const

const buttonVariants = [
  { variant: "default", label: "Tiếp tục" },
  { variant: "secondary", label: "Để sau" },
  { variant: "outline", label: "Xem chi tiết" },
  { variant: "ghost", label: "Bỏ qua" },
  { variant: "grape", label: "Nâng cấp" },
  { variant: "destructive", label: "Xoá" },
  { variant: "link", label: "Mở liên kết" },
] as const

const badgeSamples = [
  { variant: "default", label: "+5,2%" },
  { variant: "destructive", label: "−3,8%" },
  { variant: "secondary", label: "Mới" },
  { variant: "outline", label: "Tuỳ chọn" },
  { variant: "sun", label: "7 ngày liên tiếp" },
  { variant: "grape", label: "Pro" },
  { variant: "solid", label: "3" },
] as const

const progressSamples = [
  { label: "Quỹ du lịch", detail: "1,8 / 3 triệu", value: 60, tone: "leaf" },
  { label: "Ăn uống", detail: "82% hạn mức", value: 82, tone: "sun" },
  { label: "Mua sắm", detail: "Vượt 12%", value: 100, tone: "coral" },
] as const

/** One block of the reference: a caption, then its samples in a card. */
function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="px-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">{title}</h2>
      </div>
      <Card>
        <CardContent className="space-y-5">
          {note ? <p className="text-[13px] text-muted-foreground">{note}</p> : null}
          {children}
        </CardContent>
      </Card>
    </section>
  )
}

export default function UiLabPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  return (
    <Page>
      <PageHeader title="Thử giao diện" />
      <p className="-mt-2 max-w-2xl px-1 text-[15px] text-muted-foreground">
        Bảng tham chiếu của giao diện tối giản: nền xám nhạt, thẻ trắng không viền, bo góc lớn, màu
        đen làm điểm nhấn duy nhất. Đổi giao diện sáng/tối trong Cài đặt để so sánh.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Section title="Màu nền" note="Thẻ tách khỏi nền nhờ độ chênh màu, không dùng viền hay bóng.">
            <div className="grid grid-cols-5 gap-3">
              {surfaces.map((surface) => (
                <div key={surface.token} className="space-y-2">
                  <div className={`aspect-square rounded-2xl ring-1 ring-black/5 dark:ring-white/10 ${surface.className}`} />
                  <p className="text-xs font-medium">{surface.name}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Màu theo ý nghĩa" note="Chỉ dùng cho số tiền, ô icon và badge, không tô cả khối.">
            <div className="grid grid-cols-3 gap-3">
              {semantics.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className={`h-12 rounded-2xl ${item.className}`} />
                  <div className={`flex h-9 items-center justify-center rounded-full text-sm font-medium ${item.soft}`}>
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Chữ · Be Vietnam Pro">
            <div className="space-y-4">
              {typeScale.map((item) => (
                <div key={item.name} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className={item.className}>{item.sample}</p>
                </div>
              ))}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Số tiền lớn · 36/600, đơn vị nhạt</p>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  124.680.000<span className="text-muted-foreground/60">đ</span>
                </p>
              </div>
            </div>
          </Section>

          <Section title="Nút" note="Dạng viên thuốc, phẳng; nhấn thì co nhẹ. Nút chính màu đen.">
            <div className="flex flex-wrap gap-2">
              {buttonVariants.map((item) => (
                <Button key={item.variant} variant={item.variant}>
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">Rất nhỏ</Button>
              <Button size="sm">Nhỏ</Button>
              <Button>Mặc định</Button>
              <Button size="lg">Lớn</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon-xs" variant="secondary" aria-label="Thêm"><PlusIcon /></Button>
              <Button size="icon-sm" variant="secondary" aria-label="Thêm"><PlusIcon /></Button>
              <Button size="icon" variant="secondary" aria-label="Thêm"><PlusIcon /></Button>
              <Button size="icon-lg" aria-label="Thêm"><PlusIcon /></Button>
              <Button variant="outline">
                <SparklesIcon data-icon="inline-start" />
                Có icon
              </Button>
              <Button variant="destructive" size="icon" aria-label="Xoá"><Trash2Icon /></Button>
              <Button disabled>Đang khoá</Button>
            </div>
            <Button size="lg" className="w-full">
              Thêm giao dịch
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </Section>

          <Section title="Segmented control">
            <Tabs defaultValue="month">
              <TabsList className="w-full">
                <TabsTrigger value="week">Tuần</TabsTrigger>
                <TabsTrigger value="month">Tháng</TabsTrigger>
                <TabsTrigger value="year">Năm</TabsTrigger>
              </TabsList>
            </Tabs>
            <AnimatedTabs defaultValue="expense">
              <AnimatedTabsList className="w-full">
                <AnimatedTabsTrigger value="expense">Chi tiền</AnimatedTabsTrigger>
                <AnimatedTabsTrigger value="income">Thu tiền</AnimatedTabsTrigger>
              </AnimatedTabsList>
            </AnimatedTabs>
            <Tabs defaultValue="overview">
              <TabsList variant="line" className="w-full justify-start">
                <TabsTrigger value="overview" className="flex-none">Tổng quan</TabsTrigger>
                <TabsTrigger value="history" className="flex-none">Lịch sử</TabsTrigger>
                <TabsTrigger value="notes" className="flex-none">Ghi chú</TabsTrigger>
              </TabsList>
            </Tabs>
          </Section>

          <Section title="Chip" note="Lọc nhanh: xám khi chưa chọn, màu chính (đen, hoặc trắng ở giao diện tối) khi đã chọn.">
            <ToggleGroup type="single" defaultValue="all" className="flex-wrap" aria-label="Loại giao dịch">
              <ToggleGroupItem value="all">Tất cả</ToggleGroupItem>
              <ToggleGroupItem value="expense">Chi tiền</ToggleGroupItem>
              <ToggleGroupItem value="income">Thu tiền</ToggleGroupItem>
              <ToggleGroupItem value="transfer">Chuyển khoản</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" size="sm" defaultValue={["momo"]} className="flex-wrap" aria-label="Tài khoản">
              <ToggleGroupItem value="vcb">Vietcombank</ToggleGroupItem>
              <ToggleGroupItem value="momo">Ví MoMo</ToggleGroupItem>
              <ToggleGroupItem value="cash">Tiền mặt</ToggleGroupItem>
            </ToggleGroup>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Ô nhập" note="Nền xám, không viền; sáng lên khi đang nhập.">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Tìm giao dịch..." aria-label="Tìm giao dịch" />
            </InputGroup>
            <Input placeholder="Tên khoản chi" aria-label="Tên khoản chi" />
            <Input placeholder="Sai định dạng" aria-label="Ví dụ lỗi" aria-invalid="true" defaultValue="abc" />
            <CurrencyInputExample />
            <Select defaultValue="momo">
              <SelectTrigger className="w-full" aria-label="Tài khoản">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tài khoản</SelectLabel>
                  <SelectItem value="vcb">Vietcombank</SelectItem>
                  <SelectItem value="momo">Ví MoMo</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Textarea placeholder="Ghi chú" aria-label="Ghi chú" />
          </Section>

          <Section title="Badge và tiến độ">
            <div className="flex flex-wrap gap-2">
              {badgeSamples.map((badge) => (
                <Badge key={badge.label} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
            <div className="space-y-4">
              {progressSamples.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </div>
                  <Progress value={item.value} tone={item.tone} aria-label={item.label} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Công tắc">
            <SwitchExamples />
          </Section>

          <SettingsGroup title="Danh sách" footer="Đường kẻ mảnh bắt đầu từ chỗ chữ, như danh sách trên iOS.">
            <SettingsRow icon={WalletIcon} color="blue" title="Tài khoản" description="3 tài khoản" value="55,1 tr" chevron />
            <SettingsRow icon={PaletteIcon} color="violet" title="Giao diện" value="Hệ thống" chevron />
            <SettingsRow icon={BellIcon} color="amber" title="Nhắc ghi chi tiêu" description="Mỗi ngày lúc 21:00" chevron />
          </SettingsGroup>

          <section className="space-y-2">
            <div className="px-3">
              <h2 className="text-[13px] font-medium text-muted-foreground">Thẻ</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Đã thu</CardDescription>
                  <CardTitle className="text-xl text-income tabular-nums">18,0 tr</CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Đã chi</CardDescription>
                  <CardTitle className="text-xl text-expense tabular-nums">3,2 tr</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <Card pressable role="button" tabIndex={0}>
              <CardContent className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-300">
                  <SparklesIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Nhận xét từ AI</span>
                  <span className="block text-[13px] text-muted-foreground">
                    Tháng này bạn chi cho ăn uống ít hơn 12%.
                  </span>
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              </CardContent>
            </Card>
          </section>

          <Section title="Thông báo">
            <SonnerExamples />
          </Section>
        </div>
      </div>
    </Page>
  )
}
