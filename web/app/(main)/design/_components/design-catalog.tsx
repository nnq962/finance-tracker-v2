"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  CopyIcon,
  InboxIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
} from "lucide-react"
import { toast } from "sonner"

import { DeltaBadge } from "@/components/app/delta-badge"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { ProgressRing } from "@/components/app/progress-ring"
import { PromoBanner } from "@/components/app/promo-banner"
import { SectionHeader } from "@/components/app/section-header"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/** One part of the catalogue: a big title, a line on when to use it, and the samples. */
function Section({
  id,
  title,
  note,
  children,
}: {
  id: string
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-3">
      <div className="px-1">
        <SectionHeader title={<span id={id}>{title}</span>} />
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}

/** A small grey caption above a group of samples inside a card. */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-xs text-muted-foreground">{children}</p>
}

const principles = [
  ["Thẻ mềm trên nền xám", "Thẻ trắng bo tròn, không viền, không bóng; tách khỏi nền nhờ chênh màu."],
  ["Một màu nhấn", "Gần đen (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc bật."],
  ["Chữ nhẹ", "Chỉ dùng độ đậm thường và vừa; tiêu đề lớn của trang là ngoại lệ duy nhất."],
  ["Màu mang ý nghĩa", "Xanh là tiền vào, đỏ là tiền ra, xanh dương là chuyển khoản, tím là AI."],
  ["Vừa ngón tay", "Mọi thứ bấm được cao từ 44px; mọi nút là viên thuốc; chạm thì hơi lún."],
] as const

const colors = [
  ["background", "Nền trang", "bg-background ring-1 ring-border"],
  ["card", "Thẻ", "bg-card ring-1 ring-border"],
  ["muted", "Nền phụ, ô nhập", "bg-muted"],
  ["primary", "Màu nhấn", "bg-primary"],
  ["muted-foreground", "Chữ phụ", "bg-muted-foreground"],
  ["border", "Đường kẻ", "bg-border"],
  ["income", "Tiền vào", "bg-income"],
  ["expense", "Tiền ra", "bg-expense"],
  ["transfer", "Chuyển khoản", "bg-transfer"],
  ["ai", "AI và Pro", "bg-ai"],
  ["warning", "Nhắc nhở", "bg-warning"],
  ["destructive", "Xoá, lỗi", "bg-destructive"],
] as const

const typeScale = [
  ["Số tổng · 36", "text-4xl font-medium tracking-tight tabular-nums", "55.103.000"],
  ["Tiêu đề trang · 30", "text-3xl font-semibold tracking-tight", "Giao dịch"],
  ["Tiêu đề section · 20", "text-xl font-medium", "Chi theo nhóm"],
  ["Tiêu đề thẻ · 18", "text-lg font-medium", "Nhận thêm lượt AI"],
  ["Nội dung · 16", "text-base", "Ăn trưa với đồng nghiệp"],
  ["Phụ · 14", "text-sm text-muted-foreground", "Ví MoMo · 12:04"],
  ["Chú thích · 12", "text-xs text-muted-foreground", "65% tổng chi"],
] as const

const radii = [
  ["28", "Thẻ lớn, sheet, hộp thoại", "rounded-[28px]"],
  ["24", "Thẻ, nhóm danh sách", "rounded-3xl"],
  ["20", "Thẻ nhỏ, menu", "rounded-[20px]"],
  ["16", "Ô nhập, ô icon", "rounded-2xl"],
  ["Tròn", "Nút, chip, badge", "rounded-full"],
] as const

export function DesignCatalog() {
  const [segment, setSegment] = React.useState("expense")
  const [chip, setChip] = React.useState("month")
  const [reminder, setReminder] = React.useState(true)

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 space-y-8">
        <Section id="ds-principles" title="Nguyên tắc" note="Năm điều mọi màn hình đều giữ.">
          <SettingsGroup size="lg">
            {principles.map(([title, description], index) => (
              <SettingsRow
                key={title}
                media={
                  <span className="grid size-10 place-items-center rounded-full bg-muted text-sm font-medium tabular-nums">
                    {index + 1}
                  </span>
                }
                title={title}
                description={description}
              />
            ))}
          </SettingsGroup>
        </Section>

        <Section id="ds-colors" title="Màu" note="Luôn lấy từ token trong globals.css; đổi theme là đổi theo.">
          <Card size="lg">
            <CardContent className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
              {colors.map(([token, usage, swatch]) => (
                <div key={token} className="min-w-0">
                  <div className={`h-14 rounded-2xl ${swatch}`} />
                  <p className="mt-2 truncate text-xs font-medium">{token}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{usage}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section id="ds-type" title="Chữ" note="Be Vietnam Pro; số tiền luôn dùng chữ số đều (tabular).">
          <Card size="lg">
            <CardContent className="space-y-4">
              {typeScale.map(([name, className, sample]) => (
                <div key={name} className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{name}</p>
                  <p className={`truncate ${className}`}>{sample}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section id="ds-shape" title="Bo góc và khoảng cách" note="Lề trang 16px (24px từ md), giữa các thẻ 16px, trong thẻ 20–24px.">
          <Card size="lg">
            <CardContent className="grid grid-cols-5 gap-3">
              {radii.map(([value, usage, className]) => (
                <div key={value} className="min-w-0 text-center">
                  <div className={`mx-auto aspect-square w-full border-2 border-foreground/70 bg-muted ${className}`} />
                  <p className="mt-2 text-xs font-medium">{value}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{usage}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section id="ds-buttons" title="Nút" note="Viên thuốc. Mặc định cao 44px; 36 và 32 cho chỗ chật; 48 cho nút cuối form.">
          <Card size="lg">
            <CardContent className="space-y-5">
              <div>
                <Label>Kiểu</Label>
                <div className="flex flex-wrap gap-2">
                  <Button>Lưu</Button>
                  <Button variant="secondary">Huỷ</Button>
                  <Button variant="outline">Lọc</Button>
                  <Button variant="ghost">Bỏ qua</Button>
                  <Button variant="destructive">Xoá</Button>
                  <Button variant="link">Xem thêm</Button>
                </div>
              </div>
              <div>
                <Label>Cỡ: xs · sm · mặc định · lg</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="xs">Nhận +5</Button>
                  <Button size="sm">Xem gói</Button>
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Thêm
                  </Button>
                  <Button size="lg">Tiếp tục</Button>
                </div>
              </div>
              <div>
                <Label>Nút icon và trạng thái</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="icon" aria-label="Thêm">
                    <PlusIcon />
                  </Button>
                  <Button size="icon" variant="secondary" aria-label="Tìm">
                    <SearchIcon />
                  </Button>
                  <Button size="icon-sm" variant="secondary" aria-label="Sửa">
                    <PencilIcon />
                  </Button>
                  <Button disabled>
                    <Spinner />
                    Đang lưu
                  </Button>
                  <Button variant="secondary" disabled>
                    Đã tắt
                  </Button>
                </div>
              </div>
              <Button size="lg" className="w-full">
                Lưu giao dịch
              </Button>
            </CardContent>
          </Card>
        </Section>

        <Section id="ds-choices" title="Chọn và lọc" note="Segmented cho 2–3 chế độ cùng loại; chip cho bộ lọc và gợi ý.">
          <Card size="lg">
            <CardContent className="space-y-5">
              <div>
                <Label>Segmented control (Tabs)</Label>
                <Tabs value={segment} onValueChange={setSegment}>
                  <TabsList className="w-full">
                    <TabsTrigger value="expense">Chi tiền</TabsTrigger>
                    <TabsTrigger value="income">Thu tiền</TabsTrigger>
                    <TabsTrigger value="transfer">Chuyển khoản</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <Label>Chip (ToggleGroup)</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={chip}
                  onValueChange={(value) => value && setChip(value)}
                  className="flex-wrap"
                >
                  <ToggleGroupItem value="week">Tuần này</ToggleGroupItem>
                  <ToggleGroupItem value="month">Tháng này</ToggleGroupItem>
                  <ToggleGroupItem value="year">Năm nay</ToggleGroupItem>
                  <ToggleGroupItem value="all">Tất cả</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label>Chip viền, cho gợi ý số tiền</Label>
                <ToggleGroup type="single" size="sm" variant="outline" className="flex-wrap">
                  <ToggleGroupItem value="25">25.000đ</ToggleGroupItem>
                  <ToggleGroupItem value="50">50.000đ</ToggleGroupItem>
                  <ToggleGroupItem value="100">100.000đ</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label>Badge</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge>Pro</Badge>
                  <Badge variant="secondary">+5</Badge>
                  <Badge variant="outline">Free</Badge>
                  <Badge variant="income">Đã thu</Badge>
                  <Badge variant="expense">Quá hạn</Badge>
                  <Badge variant="transfer">Chuyển</Badge>
                  <Badge variant="ai">
                    <SparklesIcon data-icon="inline-start" />
                    AI
                  </Badge>
                  <Badge variant="warning">Sắp đến hạn</Badge>
                  <DeltaBadge current={80} previous={100} goodWhen="down" comparedTo="tháng trước" />
                  <DeltaBadge current={130} previous={100} goodWhen="down" comparedTo="tháng trước" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section id="ds-forms" title="Ô nhập" note="Nền xám, bo 16px, cao 44px; nhãn ở trên, lỗi ở dưới.">
          <Card size="lg">
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ds-title">Tên giao dịch</FieldLabel>
                  <Input id="ds-title" placeholder="Ví dụ: Ăn trưa" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ds-search">Tìm kiếm</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupInput id="ds-search" placeholder="Tìm giao dịch…" />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ds-account">Tài khoản</FieldLabel>
                  <Select defaultValue="momo">
                    <SelectTrigger id="ds-account" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="momo">Ví MoMo</SelectItem>
                      <SelectItem value="vcb">Vietcombank</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ds-note">Ghi chú</FieldLabel>
                  <Textarea id="ds-note" placeholder="Thêm ghi chú" />
                  <FieldDescription>Không bắt buộc.</FieldDescription>
                </Field>
                <Field data-invalid="true">
                  <FieldLabel htmlFor="ds-amount">Số tiền</FieldLabel>
                  <Input id="ds-amount" aria-invalid="true" defaultValue="0" inputMode="numeric" />
                  <FieldError>Số tiền phải lớn hơn 0.</FieldError>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="ds-reminder">Nhắc ghi chi tiêu mỗi tối</FieldLabel>
                  <Switch id="ds-reminder" checked={reminder} onCheckedChange={setReminder} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </Section>
      </div>

      <div className="min-w-0 space-y-8">
        <Section id="ds-cards" title="Thẻ" note="Ba cỡ: sm 20px, mặc định 24px, lg 28px cho thẻ chính của trang.">
          <Card size="lg">
            <CardContent>
              <p className="text-sm text-muted-foreground">Tài sản ròng · Card lg</p>
              <Money amount={55_103_000} size="xl" className="mt-1" />
              <p className="mt-0.5 text-sm">
                <span className="font-medium text-income">+17,6tr</span>
                <span className="ml-1.5 text-muted-foreground">thu chi tháng này</span>
              </p>
              <StatGroup className="mt-5">
                <Stat value="55,1tr" label="Tài khoản" onClick={() => toast("Mở Ngân sách")} />
                <Stat value="2,5tr" label="Cho vay" onClick={() => toast("Mở Vay nợ")} />
                <Stat value="1,2tr" label="Đang nợ" onClick={() => toast("Mở Vay nợ")} />
              </StatGroup>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card mặc định</p>
                <Money amount={1_250_000} size="lg" tone="income" className="mt-1" />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Card sm</p>
                <Money amount={-395_000} size="lg" tone="expense" className="mt-1" />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="ds-lists" title="Danh sách" note="Nhóm dòng trong một thẻ, ngăn bằng đường kẻ; ô icon màu ở đầu dòng.">
          <SettingsGroup title="Hôm nay" size="lg">
            <SettingsRow
              media={<IconTile icon={UtensilsCrossedIcon} tone="orange" />}
              title="Ăn trưa"
              description="Ví MoMo"
              chevron={false}
              onClick={() => toast("Mở giao dịch")}
              action={
                <span className="flex flex-col items-end">
                  <Money amount={-45_000} sign="always" size="sm" tone="expense" />
                  <span className="text-xs text-muted-foreground">12:04</span>
                </span>
              }
            />
            <SettingsRow
              media={<IconTile icon={WalletCardsIcon} tone="income" />}
              title="Lương hàng tháng"
              description="Vietcombank"
              chevron={false}
              onClick={() => toast("Mở giao dịch")}
              action={
                <span className="flex flex-col items-end">
                  <Money amount={18_000_000} sign="always" size="sm" tone="income" />
                  <span className="text-xs text-muted-foreground">09:31</span>
                </span>
              }
            />
            <SettingsRow
              media={<IconTile icon={ArrowLeftRightIcon} tone="transfer" />}
              title="Rút tiền ra ví"
              description="Vietcombank → Tiền mặt"
              chevron={false}
              onClick={() => toast("Mở giao dịch")}
              action={<Money amount={500_000} sign="never" size="sm" tone="transfer" />}
            />
          </SettingsGroup>
          <SettingsGroup title="Cài đặt" footer="Dòng mở màn hình khác có mũi tên; dòng bật tắt có công tắc." size="lg">
            <SettingsRow icon={MoonIcon} title="Giao diện" value="Tự động" onClick={() => toast("Mở Giao diện")} />
            <SettingsRow
              icon={BellRingIcon}
              title="Nhắc ghi chi tiêu"
              description="Mỗi tối lúc 21:00"
              action={<Switch checked={reminder} onCheckedChange={setReminder} aria-label="Nhắc ghi chi tiêu" />}
            />
            <SettingsRow title="Đăng xuất" destructive onClick={() => toast("Đăng xuất")} />
          </SettingsGroup>
        </Section>

        <Section id="ds-blocks" title="Khối kiểu app" note="Trong components/app; dùng lại, không chép.">
          <PromoBanner
            icon={SparklesIcon}
            title="Nâng cấp lên Pro"
            description="300 lượt trợ lý AI mỗi tháng"
            onClick={() => toast("Mở gói Pro")}
          />
          <Card size="lg">
            <CardContent className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Nhiệm vụ · ProgressRing</p>
                <p className="mt-0.5 text-lg font-medium">Nhận thêm lượt AI</p>
                <Progress value={37.5} className="mt-3" aria-label="Tiến độ" />
                <p className="mt-2 text-xs text-muted-foreground">Progress: thanh mảnh cho tiến độ trong dòng.</p>
              </div>
              <ProgressRing value={3} max={8} label="đã xong" />
            </CardContent>
          </Card>
          <Card size="lg">
            <CardContent className="space-y-5">
              <div>
                <Label>Ô icon (IconTile): màu ý nghĩa và màu hạng mục; cỡ sm · md · lg</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <IconTile icon={WalletCardsIcon} tone="neutral" />
                  <IconTile icon={WalletCardsIcon} tone="income" />
                  <IconTile icon={WalletCardsIcon} tone="expense" />
                  <IconTile icon={ArrowLeftRightIcon} tone="transfer" />
                  <IconTile icon={SparklesIcon} tone="ai" />
                  <IconTile icon={BellRingIcon} tone="warning" />
                  <IconTile icon={UtensilsCrossedIcon} tone="orange" size="sm" />
                  <IconTile icon={UtensilsCrossedIcon} tone="orange" size="lg" shape="rounded" />
                </div>
              </div>
              <div>
                <Label>Số tiền (Money): cỡ sm · md · lg · xl, dấu và màu</Label>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <Money amount={45_000} size="sm" />
                  <Money amount={-45_000} size="md" tone="expense" />
                  <Money amount={18_000_000} sign="always" size="lg" tone="income" />
                  <Money amount={1_250_000} size="xl" />
                </div>
              </div>
              <div>
                <Label>Avatar, đang tải, khung chờ</Label>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>MA</AvatarFallback>
                  </Avatar>
                  <Avatar size="xl">
                    <AvatarFallback>DD</AvatarFallback>
                  </Avatar>
                  <Spinner className="size-5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card size="lg">
            <CardContent>
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>Chưa có giao dịch</EmptyTitle>
                  <EmptyDescription>Giao dịch bạn ghi sẽ hiện ở đây.</EmptyDescription>
                </EmptyHeader>
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Thêm giao dịch
                </Button>
              </Empty>
            </CardContent>
          </Card>
        </Section>

        <Section
          id="ds-overlays"
          title="Lớp phủ"
          note="Màn hình đẩy từ phải cho form và chi tiết; sheet đáy cho lựa chọn ngắn; hộp thoại chỉ để xác nhận."
        >
          <Card size="lg">
            <CardContent className="grid grid-cols-2 gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary">Màn hình</Button>
                </SheetTrigger>
                <SheetContent
                  variant="screen"
                  showCloseButton={false}
                  aria-describedby={undefined}
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  <SheetNavHeader title="Giao dịch mới" />
                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                    <Tabs defaultValue="expense">
                      <TabsList className="w-full">
                        <TabsTrigger value="expense">Chi tiền</TabsTrigger>
                        <TabsTrigger value="income">Thu tiền</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="ds-sheet-amount">Số tiền</FieldLabel>
                        <Input id="ds-sheet-amount" inputMode="numeric" placeholder="0" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="ds-sheet-note">Ghi chú</FieldLabel>
                        <Textarea id="ds-sheet-note" />
                      </Field>
                    </FieldGroup>
                  </div>
                  <div className="p-4">
                    <Button size="lg" className="w-full">
                      Lưu giao dịch
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary">Sheet đáy</Button>
                </SheetTrigger>
                <SheetContent variant="bottom" showCloseButton={false} aria-describedby={undefined}>
                  <SheetNavHeader title="Ăn trưa" backLabel="Đóng" />
                  <div className="space-y-2 px-4 pb-4">
                    <SettingsGroup>
                      <SettingsRow icon={PencilIcon} title="Sửa" chevron={false} onClick={() => toast("Sửa")} />
                      <SettingsRow icon={CopyIcon} title="Nhân bản" chevron={false} onClick={() => toast("Nhân bản")} />
                    </SettingsGroup>
                    <SettingsGroup>
                      <SettingsRow title="Xoá giao dịch" destructive onClick={() => toast("Xoá")} />
                    </SettingsGroup>
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Hộp thoại</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đổi tên tài khoản</DialogTitle>
                    <DialogDescription>Tên hiện ở danh sách tài khoản và giao dịch.</DialogDescription>
                  </DialogHeader>
                  <Input defaultValue="Ví MoMo" aria-label="Tên tài khoản" />
                  <DialogFooter>
                    <Button>Lưu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Xác nhận xoá</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá giao dịch này?</AlertDialogTitle>
                    <AlertDialogDescription>Số dư tài khoản sẽ được hoàn lại. Không thể hoàn tác.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Huỷ</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">Xoá</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>
                    <PencilIcon />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CopyIcon />
                    Nhân bản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <Trash2Icon />
                    Xoá
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="secondary"
                onClick={() => toast.success("Đã lưu giao dịch", { description: "Ăn trưa · 45.000đ" })}
              >
                Thông báo nổi
              </Button>
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  )
}
