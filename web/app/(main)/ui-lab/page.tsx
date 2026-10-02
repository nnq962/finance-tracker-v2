import { CurrencyInputExample } from "./_components/currency-input-example"
import { SonnerExamples } from "./_components/sonner-examples"
import { SwitchExamples } from "./_components/switch-examples"
import GradientWaves from "@/components/gradient-waves"
import { Page } from "@/components/page"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Tabs as AnimatedTabs,
  TabsContent as AnimatedTabsContent,
  TabsList as AnimatedTabsList,
  TabsTrigger as AnimatedTabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const variants = [
  { name: "Default · Leaf", variant: "default", label: "Tiếp tục" },
  { name: "Secondary · Sky", variant: "secondary", label: "Xem chi tiết" },
  { name: "Outline", variant: "outline", label: "Để sau" },
  { name: "Destructive · Coral", variant: "destructive", label: "Xóa mục" },
  { name: "Ghost", variant: "ghost", label: "Xem thêm" },
  { name: "Link", variant: "link", label: "Mở liên kết" },
] as const

const sizes = [
  { name: "xs", size: "xs" },
  { name: "sm", size: "sm" },
  { name: "default", size: "default" },
  { name: "lg", size: "lg" },
] as const

const iconSizes = [
  { name: "icon-xs", size: "icon-xs" },
  { name: "icon-sm", size: "icon-sm" },
  { name: "icon", size: "icon" },
  { name: "icon-lg", size: "icon-lg" },
] as const

const badgeSamples = [
  { variant: "default", label: "Đã thu", dot: true },
  { variant: "destructive", label: "Đã chi", dot: true },
  { variant: "secondary", label: "Mới", dot: false },
  { variant: "sun", label: "7 ngày liên tiếp", dot: false },
  { variant: "grape", label: "Pro", dot: false },
  { variant: "solid", label: "3", dot: false },
  { variant: "outline", label: "Tùy chọn", dot: false },
] as const

const progressSamples = [
  { label: "Quỹ du lịch", detail: "1,8 / 3 triệu", value: 60, tone: "leaf" },
  { label: "Ăn uống", detail: "82% hạn mức", value: 82, tone: "sun" },
  { label: "Mua sắm", detail: "Vượt 12%", value: 100, tone: "coral" },
  { label: "Mục tiêu đặc biệt", detail: "45%", value: 45, tone: "grape" },
] as const

const colors = [
  { name: "Leaf", face: "#6ecc49", shade: "#3e9727" },
  { name: "Sky", face: "#38b8f6", shade: "#0083c4" },
  { name: "Coral", face: "#ff645f", shade: "#c8393a" },
] as const

export default function UiLabPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  return (
    <Page>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Thử giao diện</h1>
          <Badge variant="outline">UI Lab</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Khu vực xem các thành phần giao diện trong ứng dụng. Nhấn giữ nút để
          kiểm tra độ lún, dùng phím Tab để xem focus và chọn giao diện sáng,
          tối hoặc theo hệ thống trong header.
        </p>
      </div>

      <section aria-labelledby="typography-examples" className="space-y-4">
        <div>
          <h2 id="typography-examples" className="text-xl font-semibold">Chữ</h2>
          <p className="text-sm text-muted-foreground">
            Baloo 2 cho tiêu đề, số và nhãn nút; Nunito đậm cho nội dung.
          </p>
        </div>
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Display · Baloo 2</span>
              <p className="font-heading text-4xl leading-none font-extrabold tabular-nums">500.000đ</p>
              <h3 className="text-2xl font-semibold">Chi tiêu tháng này</h3>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Body · Nunito</span>
              <p>Theo dõi các khoản thu, chi và chuyển khoản của bạn.</p>
              <p className="text-sm text-muted-foreground">8 giao dịch · tháng này</p>
              <Button type="button">Tiếp tục</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="gradient-waves" className="space-y-4">
        <div>
          <h2 id="gradient-waves" className="text-xl font-semibold">Gradient Waves</h2>
          <p className="text-sm text-muted-foreground">
            Nền sóng chuyển động. Di chuyển chuột trên nền để thử hiệu ứng parallax.
          </p>
        </div>
        <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-black">
          <GradientWaves
            horizonColor="#000000"
            waveColor="#6366F1"
            crestColor="#ffffff"
            speed={0.4}
            amplitude={4}
            waveScale={0.6}
            waveRatio={0.9}
            swell={35}
            turbulence={20}
            tilt={1.11}
            zoom={1}
            height={5.5}
            fogDepth={15}
            detail="medium"
            brightness={1}
            opacity={1}
            mouseInteraction
            parallaxStrength={0.5}
            grain
            grainIntensity={0.05}
          />
        </div>
      </section>

      <section aria-labelledby="button-variants" className="space-y-4">
        <div>
          <h2 id="button-variants" className="text-xl font-semibold">Button variants</h2>
          <p className="text-sm text-muted-foreground">
            Các mẫu dưới đây dùng trực tiếp Button của ứng dụng.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {variants.map(({ name, variant, label }) => (
            <Card key={variant}>
              <CardHeader>
                <CardTitle>{name}</CardTitle>
                <CardDescription>variant=&quot;{variant}&quot;</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-16 items-start gap-3">
                <Button type="button" variant={variant}>{label}</Button>
                {variant === "outline" && (
                  <Button type="button" variant="default">{label}</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="button-sizes">
        <Card>
          <CardHeader>
            <CardTitle id="button-sizes">Kích thước</CardTitle>
            <CardDescription>
              Chiều cao, padding, kích thước icon và bo góc đang dùng trong dự án.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-7">
            <div className="flex flex-wrap items-start gap-x-5 gap-y-7">
              {sizes.map(({ name, size }) => (
                <div key={size} className="flex flex-col items-start gap-3">
                  <Button type="button" size={size}>Nút {name}</Button>
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-x-5 gap-y-7 border-t pt-6">
              {iconSizes.map(({ name, size }) => (
                <div key={size} className="flex flex-col items-start gap-3">
                  <Button type="button" size={size} aria-label={`Thêm · ${name}`}>
                    <PlusIcon />
                  </Button>
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="button-states" className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle id="button-states">Trạng thái và cách dùng</CardTitle>
            <CardDescription>Kiểm tra disabled, lỗi, icon và liên kết.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-4">
            <Button type="button" disabled>Đã vô hiệu</Button>
            <Button type="button" variant="outline" disabled>Không khả dụng</Button>
            <Button type="button" variant="destructive" aria-invalid="true">
              <Trash2Icon /> Xóa
            </Button>
            <Button variant="secondary" asChild>
              <Link href="#button-sizes">Xem kích thước <ArrowRightIcon /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trong ngữ cảnh</CardTitle>
            <CardDescription>Nút cạnh nội dung, badge và ô nhập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="font-medium">Khoản tiết kiệm</p>
                <p className="text-xs text-muted-foreground">Ví dụ hiển thị trong thẻ</p>
              </div>
              <Badge variant="secondary">Đang theo dõi</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input aria-label="Tên khoản tiết kiệm" placeholder="Tên khoản tiết kiệm" className="min-w-44 flex-1" />
              <Button type="button"><CheckIcon /> Lưu lại</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="switch-examples">
        <Card>
          <CardHeader>
            <CardTitle id="switch-examples">Switch</CardTitle>
            <CardDescription>
              Gạt để xem trạng thái bật, tắt và chuyển động ở hai kích thước.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SwitchExamples />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="sonner-examples">
        <Card>
          <CardHeader>
            <CardTitle id="sonner-examples">Sonner</CardTitle>
            <CardDescription>
              Thử các trạng thái toast, tiến trình và thao tác hoàn tác.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SonnerExamples />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="input-select-examples" className="space-y-4">
        <div>
          <h2 id="input-select-examples" className="text-xl font-semibold">Input &amp; Select</h2>
          <p className="text-sm text-muted-foreground">
            Bấm vào ô nhập và mở danh sách để xem trạng thái focus, lỗi và disabled.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Nền phẳng, viền xanh khi focus; thử nhập trực tiếp.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="lab-input-default" className="text-sm font-semibold">Mặc định</label>
                <Input id="lab-input-default" placeholder="Tên giao dịch" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-input-filled" className="text-sm font-semibold">Có dữ liệu</label>
                <Input id="lab-input-filled" defaultValue="Ăn trưa" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-input-error" className="text-sm font-semibold">Lỗi</label>
                <Input id="lab-input-error" type="email" defaultValue="tam@gmail" aria-invalid="true" aria-describedby="lab-input-error-help" />
                <p id="lab-input-error-help" className="text-xs text-[oklch(0.56_0.18_25)] dark:text-[oklch(0.80_0.13_25)]">Email chưa đúng định dạng.</p>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-input-disabled" className="text-sm font-semibold">Disabled</label>
                <Input id="lab-input-disabled" defaultValue="Không sửa được" disabled />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Select</CardTitle>
              <CardDescription>Mở menu để xem lựa chọn, focus và dấu chọn.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-11">
              <div className="grid gap-1.5">
                <label htmlFor="lab-select-default" className="text-sm font-semibold">Mặc định</label>
                <Select>
                  <SelectTrigger id="lab-select-default" className="w-full">
                    <SelectValue placeholder="Chọn tài khoản" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tài khoản</SelectLabel>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="momo">Ví MoMo</SelectItem>
                      <SelectItem value="bank">Ngân hàng</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-select-filled" className="text-sm font-semibold">Có dữ liệu</label>
                <Select defaultValue="momo">
                  <SelectTrigger id="lab-select-filled" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="momo">Ví MoMo</SelectItem>
                      <SelectItem value="bank">Ngân hàng</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-select-error" className="text-sm font-semibold">Lỗi</label>
                <Select>
                  <SelectTrigger id="lab-select-error" className="w-full" aria-invalid="true" aria-describedby="lab-select-error-help">
                    <SelectValue placeholder="Chọn hạng mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="food">Ăn uống</SelectItem>
                      <SelectItem value="travel">Đi lại</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p id="lab-select-error-help" className="text-xs text-[oklch(0.56_0.18_25)] dark:text-[oklch(0.80_0.13_25)]">Hãy chọn một hạng mục.</p>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-select-small" className="text-sm font-semibold">Kích thước nhỏ</label>
                <Select defaultValue="month">
                  <SelectTrigger id="lab-select-small" size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="week">Hằng tuần</SelectItem>
                      <SelectItem value="month">Hằng tháng</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="lab-select-disabled" className="text-sm font-semibold">Disabled</label>
                <Select defaultValue="locked" disabled>
                  <SelectTrigger id="lab-select-disabled" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="locked">Không thể chọn</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="textarea-examples">
        <Card>
          <CardHeader>
            <CardTitle id="textarea-examples">Textarea</CardTitle>
            <CardDescription>Thử nhập nhiều dòng, focus và kéo góc ô để thay đổi kích thước.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <label htmlFor="lab-textarea-default" className="text-sm font-semibold">Mặc định</label>
              <Textarea id="lab-textarea-default" placeholder="Nhập ghi chú giao dịch..." />
            </div>
            <div className="grid content-start gap-1.5">
              <label htmlFor="lab-textarea-filled" className="text-sm font-semibold">Có nội dung</label>
              <Textarea id="lab-textarea-filled" defaultValue={"Chi phí đi chợ cuối tuần.\nGồm rau củ, trái cây và đồ dùng gia đình."} />
            </div>
            <div className="grid content-start gap-1.5">
              <label htmlFor="lab-textarea-error" className="text-sm font-semibold">Lỗi</label>
              <Textarea id="lab-textarea-error" placeholder="Nhập nội dung ghi chú" aria-invalid="true" aria-describedby="lab-textarea-error-help" />
              <p id="lab-textarea-error-help" className="text-xs text-destructive">Vui lòng nhập nội dung ghi chú.</p>
            </div>
            <div className="grid content-start gap-1.5">
              <label htmlFor="lab-textarea-disabled" className="text-sm font-semibold">Disabled</label>
              <Textarea id="lab-textarea-disabled" defaultValue="Ghi chú này không thể chỉnh sửa." disabled />
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="currency-input-examples">
        <Card>
          <CardHeader>
            <CardTitle id="currency-input-examples">Nhập tiền</CardTitle>
            <CardDescription>Tự phân cách hàng nghìn, đơn vị đồng; dùng CurrencyInput của ứng dụng.</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyInputExample />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="card-examples" className="space-y-4">
        <div>
          <h2 id="card-examples" className="text-xl font-semibold">Card</h2>
          <p className="text-sm text-muted-foreground">
            Thẻ thông tin phẳng; thẻ có thể bấm mới có cạnh nổi và lún khi nhấn.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thẻ thông tin</CardTitle>
              <CardDescription>Viền đều bốn phía, không có cạnh 3D.</CardDescription>
            </CardHeader>
            <CardContent>Đây là nội dung chỉ để xem.</CardContent>
          </Card>
          <Card pressable asChild>
            <Link href="#button-sizes">
              <CardHeader>
                <CardTitle>Thẻ có thể bấm</CardTitle>
                <CardDescription>Có cạnh nổi và lún xuống khi nhấn.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                Xem kích thước button <ArrowRightIcon className="size-4" />
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>

      <section aria-labelledby="badge-examples" className="space-y-4">
        <div>
          <h2 id="badge-examples" className="text-xl font-semibold">Badge</h2>
          <p className="text-sm text-muted-foreground">
            Nền nhạt và chữ đậm cùng tông; badge chỉ hiển thị nên luôn phẳng.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3">
            {badgeSamples.map(({ variant, label, dot }) => (
              <Badge key={variant} variant={variant}>
                {dot ? <span aria-hidden="true" className="size-[7px] rounded-full bg-current" /> : null}
                {label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="progress-examples" className="space-y-4">
        <div>
          <h2 id="progress-examples" className="text-xl font-semibold">Progress</h2>
          <p className="text-sm text-muted-foreground">
            Rãnh dày, mặt màu bo tròn và vệt sáng theo Chunky UI Kit.
          </p>
        </div>
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {progressSamples.map(({ label, detail, value, tone }) => (
              <div key={tone} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="text-muted-foreground">{detail}</span>
                </div>
                <Progress value={value} tone={tone} aria-label={`${label}: ${value}%`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="tabs-examples" className="space-y-4">
        <div>
          <h2 id="tabs-examples" className="text-xl font-semibold">Segmented &amp; Tabs</h2>
          <p className="text-sm text-muted-foreground">
            Segmented chọn giữa các cách xem; Tabs chuyển giữa các nhóm nội dung.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Segmented</CardTitle>
              <CardDescription>Ô được chọn nổi nhẹ trên nền trung tính.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="week">
                <TabsList aria-label="Khoảng thời gian">
                  <TabsTrigger value="day">Ngày</TabsTrigger>
                  <TabsTrigger value="week">Tuần</TabsTrigger>
                  <TabsTrigger value="month">Tháng</TabsTrigger>
                  <TabsTrigger value="year">Năm</TabsTrigger>
                </TabsList>
                <TabsContent value="day">Giao dịch trong ngày.</TabsContent>
                <TabsContent value="week">Giao dịch trong tuần.</TabsContent>
                <TabsContent value="month">Giao dịch trong tháng.</TabsContent>
                <TabsContent value="year">Giao dịch trong năm.</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Segmented có chuyển động</CardTitle>
              <CardDescription>Kiểu đang dùng tại trang Hạng mục.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatedTabs defaultValue="expense">
                <AnimatedTabsList aria-label="Loại hạng mục">
                  <AnimatedTabsTrigger value="expense">Chi tiền</AnimatedTabsTrigger>
                  <AnimatedTabsTrigger value="income">Thu tiền</AnimatedTabsTrigger>
                  <AnimatedTabsTrigger value="transfer">Chuyển khoản</AnimatedTabsTrigger>
                </AnimatedTabsList>
                <AnimatedTabsContent value="expense">Hạng mục chi tiền.</AnimatedTabsContent>
                <AnimatedTabsContent value="income">Hạng mục thu tiền.</AnimatedTabsContent>
                <AnimatedTabsContent value="transfer">Hạng mục chuyển khoản.</AnimatedTabsContent>
              </AnimatedTabs>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tabs dạng đường kẻ</CardTitle>
              <CardDescription>Nhóm nội dung có gạch chân màu Sky khi được chọn.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList variant="line" aria-label="Nội dung">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
                  <TabsTrigger value="reports">Báo cáo</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">Tóm tắt các chỉ số.</TabsContent>
                <TabsContent value="transactions">Danh sách giao dịch.</TabsContent>
                <TabsContent value="reports">Các báo cáo của bạn.</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="design-colors">
        <Card>
          <CardHeader>
            <CardTitle id="design-colors">Màu tham chiếu</CardTitle>
            <CardDescription>
              Màu mặt và cạnh lấy từ Chunky UI Kit trong my-design.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {colors.map(({ name, face, shade }) => (
              <div key={name} className="overflow-hidden rounded-lg border">
                <div className="h-14" style={{ backgroundColor: face }} />
                <div className="h-2" style={{ backgroundColor: shade }} />
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-muted-foreground">{face}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </Page>
  )
}
