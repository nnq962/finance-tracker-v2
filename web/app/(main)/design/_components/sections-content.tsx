"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  CalendarDaysIcon,
  CopyIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  InboxIcon,
  LightbulbIcon,
  MailIcon,
  MessageCircleIcon,
  MoonIcon,
  PencilIcon,
  PiggyBankIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  TrendingUpIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
} from "lucide-react"
import { toast } from "sonner"

import { CardLabel } from "@/components/app/card-label"
import { Carousel } from "@/components/app/carousel"
import { DeltaBadge } from "@/components/app/delta-badge"
import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageDots } from "@/components/app/page-dots"
import { PromoBanner } from "@/components/app/promo-banner"
import { Section } from "@/components/app/section-header"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { Steps } from "@/components/app/steps"
import { DrawerNavHeader } from "@/components/drawer-nav-header"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { Block, BlockLabel, CatalogSection, Wide } from "./catalog-kit"

const swipeRows = [
  ["Highlands Coffee", "08:42", -59_000],
  ["Grab", "18:10", -84_000],
  ["Circle K", "21:03", -32_000],
] as const

const faq = [
  ["Gói Pro có gì?", "Pro mở thêm lượt trợ lý AI, báo cáo nâng cao và nhắc việc không giới hạn."],
  ["Dữ liệu có an toàn?", "Dữ liệu nằm trên máy chủ riêng, được sao lưu mỗi ngày."],
  ["Ghi giao dịch bằng giọng nói?", "Bấm nút AI, nói như nhắn tin: \"ăn trưa 45k ví MoMo\"."],
] as const

const tips = [
  [LightbulbIcon, "orange", "Mẹo tiết kiệm", "Quy tắc 50/30/20"],
  [TrendingUpIcon, "income", "Đầu tư", "Bắt đầu với 1 triệu"],
  [ShieldCheckIcon, "transfer", "Bảo mật", "Bật khoá ứng dụng"],
] as const

export function ContentSections() {
  return (
    <>
      <CardSection />
      <ListSection />
      <AvatarSection />
      <NavSection />
      <FeedbackSection />
    </>
  )
}

function CardSection() {
  return (
    <CatalogSection id="card">
      <Card size="lg" variant="inverse">
        <CardContent>
          <CardLabel as="p">Số dư khả dụng · Card inverse</CardLabel>
          <Money amount={12_480_000} size="xl" className="mt-1.5" />
          <div className="mt-8 flex items-end justify-between">
            <p className="text-sm tracking-[0.2em] opacity-70">•••• 4821</p>
            <p className="text-sm font-medium">Techcombank</p>
          </div>
        </CardContent>
      </Card>
      <Card size="lg">
        <CardContent>
          <CardLabel as="p">Tài sản ròng · Card lg</CardLabel>
          <Money amount={55_103_000} size="xl" className="mt-1.5" />
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
      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-4">
        <Card>
          <CardContent>
            <IconTile icon={PiggyBankIcon} tone="income" />
            <CardLabel as="p" className="mt-4">Tiết kiệm · Card</CardLabel>
            <Money amount={8_400_000} size="md" />
            <DeltaBadge current={112} previous={100} goodWhen="up" comparedTo="tháng trước" className="mt-1" />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <IconTile icon={UtensilsCrossedIcon} tone="orange" />
            <CardLabel as="p" className="mt-4">Ăn uống · Card sm</CardLabel>
            <Money amount={-2_100_000} size="md" tone="expense" />
            <DeltaBadge current={130} previous={100} goodWhen="down" comparedTo="tháng trước" className="mt-1" />
          </CardContent>
        </Card>
      </div>
      <Wide>
        <PromoBanner
          icon={SparklesIcon}
          title="Nâng cấp lên Pro"
          description="300 lượt trợ lý AI mỗi tháng"
          onClick={() => toast("Mở gói Pro")}
        />
      </Wide>
      <Wide>
        <BlockLabel className="px-1">Carousel · vuốt ngang</BlockLabel>
        <Carousel label="Mẹo">
          {tips.map(([icon, tone, kicker, title]) => (
            <Card key={title} size="lg" className="h-full">
              <CardContent>
                <IconTile icon={icon} tone={tone} size="lg" shape="rounded" />
                <p className="mt-8 text-xs text-muted-foreground">{kicker}</p>
                <p className="text-base font-medium">{title}</p>
              </CardContent>
            </Card>
          ))}
        </Carousel>
      </Wide>
    </CatalogSection>
  )
}

// A Section's sample: the title outside, the content 8px below it.
const dueSamples = [
  ["Minh Anh", "Cho vay", 2_000_000, "Còn 3 ngày"],
  ["Hoàng Nam", "Đi vay", 500_000, "Đến hạn hôm nay"],
] as const

function ListSection() {
  const [rows, setRows] = React.useState<readonly (typeof swipeRows)[number][]>(swipeRows)
  const [reminder, setReminder] = React.useState(true)

  return (
    <CatalogSection id="list">
      <SettingsGroup title="Giao dịch · hôm nay" size="lg">
        <SettingsRow
          icon={UtensilsCrossedIcon}
          tone="orange"
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
          icon={WalletCardsIcon}
          tone="income"
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
          icon={ArrowLeftRightIcon}
          tone="transfer"
          title="Rút tiền ra ví"
          description="Vietcombank → Tiền mặt"
          chevron={false}
          onClick={() => toast("Mở giao dịch")}
          action={<Money amount={500_000} sign="never" size="sm" tone="transfer" />}
        />
      </SettingsGroup>
      <Section title="Sắp đến hạn" href="/debts">
        <SettingsGroup size="lg">
          {dueSamples.map(([name, direction, amount, due]) => (
            <SettingsRow
              key={name}
              media={
                <Avatar size="lg">
                  <AvatarFallback>{name.split(" ").map((word) => word[0]).join("")}</AvatarFallback>
                </Avatar>
              }
              title={name}
              description={direction}
              chevron={false}
              onClick={() => toast(`Mở khoản của ${name}`)}
              action={
                <span className="flex flex-col items-end">
                  <Money amount={amount} size="sm" />
                  <span className="text-xs text-muted-foreground">{due}</span>
                </span>
              }
            />
          ))}
        </SettingsGroup>
      </Section>
      <SettingsGroup
        title="Cài đặt"
        footer="Icon nằm trên ô vuông bo góc nền nhạt (tone). Dòng mở màn hình khác có mũi tên; dòng bật tắt có công tắc."
        size="lg"
      >
        <SettingsRow icon={MoonIcon} tone="blue" title="Giao diện" value="Tự động" onClick={() => toast("Mở Giao diện")} />
        <SettingsRow
          icon={ShieldCheckIcon}
          tone="lime"
          title="Bảo mật"
          value="Face ID"
          onClick={() => toast("Mở Bảo mật")}
        />
        <SettingsRow
          icon={BellRingIcon}
          tone="orange"
          title="Nhắc ghi chi tiêu"
          description="Mỗi tối lúc 21:00"
          action={<Switch checked={reminder} onCheckedChange={setReminder} aria-label="Nhắc ghi chi tiêu" />}
        />
        <SettingsRow title="Đăng xuất" destructive onClick={() => toast("Đăng xuất")} />
      </SettingsGroup>
      <SettingsGroup title="Vuốt trái để xoá (swipeAction)" size="lg">
        {rows.map(([name, time, amount]) => (
          <SettingsRow
            key={name}
            icon={UtensilsCrossedIcon}
            tone="orange"
            title={name}
            description="Ví MoMo"
            chevron={false}
            onClick={() => toast(`Mở ${name}`)}
            swipeAction={{
              onAction: () => {
                setRows(rows.filter((row) => row[0] !== name))
                toast.success(`Đã xoá ${name}`)
              },
            }}
            action={
              <span className="flex flex-col items-end">
                <Money amount={amount} sign="always" size="sm" tone="expense" />
                <span className="text-xs text-muted-foreground">{time}</span>
              </span>
            }
          />
        ))}
        {rows.length === 0 ? (
          <li>
            <Button variant="ghost" className="w-full" onClick={() => setRows(swipeRows)}>
              Khôi phục danh sách
            </Button>
          </li>
        ) : null}
      </SettingsGroup>
      <Block label="Accordion">
        <Accordion type="single" collapsible defaultValue={faq[0][0]}>
          {faq.map(([question, answer]) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Block>
    </CatalogSection>
  )
}

function AvatarSection() {
  return (
    <CatalogSection id="avatar">
      <Block label="Kích thước · chữ cái · đang hoạt động">
        <div className="flex items-end gap-3">
          {(["xl", "lg", "default", "sm"] as const).map((size) => (
            <Avatar key={size} size={size}>
              <AvatarFallback>MA</AvatarFallback>
            </Avatar>
          ))}
          <Avatar size="xl">
            <AvatarFallback>HL</AvatarFallback>
            <AvatarBadge className="bg-income" />
          </Avatar>
        </div>
      </Block>
      <Block label="Nhóm">
        <div className="flex items-center justify-between gap-3">
          <AvatarGroup>
            {["MA", "HL", "TT", "QN"].map((initials) => (
              <Avatar key={initials} size="lg">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
          <Button size="sm" variant="secondary">
            <PlusIcon data-icon="inline-start" />
            Mời
          </Button>
        </div>
      </Block>
    </CatalogSection>
  )
}

function NavSection() {
  const [page, setPage] = React.useState(1)
  const [step, setStep] = React.useState(1)

  return (
    <CatalogSection id="nav">
      <Block label="Chỉ báo trang · chạm để chuyển">
        <div className="flex items-center justify-between">
          <PageDots count={4} value={page} onValueChange={setPage} />
          <span className="text-sm text-muted-foreground tabular-nums">{page + 1} / 4</span>
        </div>
      </Block>
      <Block label="Các bước · chạm để đổi bước">
        <button type="button" className="w-full" onClick={() => setStep((step + 1) % 4)}>
          <Steps steps={["Thông tin", "Xác minh", "Hoàn tất"]} current={step} />
        </button>
      </Block>
      <Block label="Thanh tab và tiêu đề thu gọn" wide>
        <p className="text-sm text-muted-foreground">
          Thanh tab nổi ở đáy màn hình (MobileBottomNav) và tiêu đề nhỏ hiện khi tiêu đề lớn cuộn đi
          (CompactTitleBar) là khung của app; xem trực tiếp ở các trang chính. Tabs dạng gạch chân ở mục Toggle group.
        </p>
      </Block>
    </CatalogSection>
  )
}

function FeedbackSection() {
  const [banner, setBanner] = React.useState(true)

  return (
    <CatalogSection id="feedback">
      <Wide>
        {banner ? (
          <NoticeBanner title="Cập nhật mới" onDismiss={() => setBanner(false)}>
            Đã có báo cáo chi tiêu cuối năm.
          </NoticeBanner>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => setBanner(true)}>
            Hiện lại banner
          </Button>
        )}
      </Wide>
      <Wide>
        <NoticeBanner tone="warning" icon={BellRingIcon} title="Sắp đến hạn">
          Hoá đơn điện 520.000đ đến hạn ngày 10/10.
        </NoticeBanner>
      </Wide>
      <Block label="Mở thử" wide>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Button
            variant="secondary"
            onClick={() => toast.success("Đã lưu giao dịch", { description: "Ăn trưa · 45.000đ" })}
          >
            Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast("Đã xoá giao dịch", {
                action: { label: "Hoàn tác", onClick: () => toast.success("Đã khôi phục") },
              })
            }
          >
            Toast hoàn tác
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Alert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                  <Trash2Icon />
                </AlertDialogMedia>
                <AlertDialogTitle>Xoá giao dịch?</AlertDialogTitle>
                <AlertDialogDescription>Số dư tài khoản sẽ được hoàn lại. Không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => toast.success("Đã xoá")}>
                  Xoá
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Half sheet</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="text-xl">Chia sẻ báo cáo</DrawerTitle>
                <DrawerDescription>Tháng 10 · 24 giao dịch</DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-4 gap-3 px-4">
                {(
                  [
                    [FileTextIcon, "PDF"],
                    [FileSpreadsheetIcon, "Excel"],
                    [MessageCircleIcon, "Zalo"],
                    [MailIcon, "Email"],
                  ] as const
                ).map(([icon, label]) => (
                  <DrawerClose key={label} asChild>
                    <button
                      type="button"
                      onClick={() => toast.success(`Đã gửi qua ${label}`)}
                      className="pressable flex flex-col items-center gap-1.5 text-xs"
                    >
                      <IconTile icon={icon} size="lg" shape="rounded" className="size-14" />
                      {label}
                    </button>
                  </DrawerClose>
                ))}
              </div>
              <div className="p-4 pt-6">
                <DrawerClose asChild>
                  <Button size="lg" variant="secondary" className="w-full">
                    Đóng
                  </Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Số dư cập nhật mỗi 5 phút</TooltipContent>
          </Tooltip>

          <ScreenSheetSample />
          <PageSheetFormSample />
          <PageSheetDetailSample />

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
        </div>
      </Block>
      <Card size="lg" className="md:col-span-2">
        <CardContent>
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>Chưa có giao dịch</EmptyTitle>
              <EmptyDescription>Thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu.</EmptyDescription>
            </EmptyHeader>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Thêm giao dịch
            </Button>
          </Empty>
        </CardContent>
      </Card>
    </CatalogSection>
  )
}

/** The form fields shared by the sheet samples. */
function TransactionFields({ idPrefix }: { idPrefix: string }) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-amount`}>Số tiền</FieldLabel>
        <InputGroup>
          <InputGroupInput id={`${idPrefix}-amount`} inputMode="numeric" placeholder="0" />
          <InputGroupAddon align="inline-end">đ</InputGroupAddon>
        </InputGroup>
        <ToggleGroup type="single" size="sm" className="flex-wrap">
          <ToggleGroupItem value="25">25.000đ</ToggleGroupItem>
          <ToggleGroupItem value="45">45.000đ</ToggleGroupItem>
          <ToggleGroupItem value="100">100.000đ</ToggleGroupItem>
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-account`}>Tài khoản</FieldLabel>
        <Select defaultValue="momo">
          <SelectTrigger id={`${idPrefix}-account`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="cash">Tiền mặt</SelectItem>
              <SelectItem value="momo">Ví MoMo</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-date`}>Ngày</FieldLabel>
        <InputGroup>
          <InputGroupInput id={`${idPrefix}-date`} defaultValue="06/10/2026" />
          <InputGroupAddon align="inline-end">
            <CalendarDaysIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-note`}>Ghi chú</FieldLabel>
        <Textarea id={`${idPrefix}-note`} placeholder="Thêm ghi chú" />
        <FieldDescription>Không bắt buộc.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}

function KindTabs() {
  return (
    <Tabs defaultValue="expense">
      <TabsList className="w-full">
        <TabsTrigger value="expense">Chi tiền</TabsTrigger>
        <TabsTrigger value="income">Thu tiền</TabsTrigger>
        <TabsTrigger value="transfer">Chuyển khoản</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function ScreenSheetSample() {
  return (
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
          <KindTabs />
          <FormSection>
            <TransactionFields idPrefix="ds-screen" />
          </FormSection>
          <SettingsGroup title="Chi tiết">
            <SettingsRow
              icon={UtensilsCrossedIcon}
              tone="orange"
              title="Hạng mục"
              value="Ăn trưa"
              onClick={() => toast("Chọn hạng mục")}
            />
            <SettingsRow icon={BellRingIcon} title="Nhắc lại hằng tháng" action={<Switch aria-label="Nhắc lại hằng tháng" />} />
          </SettingsGroup>
        </div>
        <div className="p-4">
          <Button size="lg" className="w-full">
            Lưu giao dịch
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PageSheetFormSample() {
  return (
    <Drawer variant="page">
      <DrawerTrigger asChild>
        <Button variant="secondary">Sheet iOS · form</Button>
      </DrawerTrigger>
      <DrawerContent variant="page" aria-describedby={undefined}>
        <DrawerNavHeader title="Giao dịch mới" />
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <KindTabs />
          <TransactionFields idPrefix="ds-page" />
        </div>
        <div className="p-4">
          <Button size="lg" className="w-full">
            Lưu giao dịch
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function PageSheetDetailSample() {
  return (
    <Drawer variant="page">
      <DrawerTrigger asChild>
        <Button variant="secondary">Sheet iOS · chi tiết</Button>
      </DrawerTrigger>
      <DrawerContent variant="page" surface="grouped" aria-describedby={undefined}>
        <DrawerNavHeader
          title="Chi tiết giao dịch"
          action={
            <Button type="button" variant="secondary" size="icon" aria-label="Sửa">
              <PencilIcon />
            </Button>
          }
        />
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col items-center py-2 text-center">
            <IconTile icon={UtensilsCrossedIcon} tone="orange" size="lg" shape="rounded" />
            <p className="mt-3 text-muted-foreground">Ăn trưa</p>
            <Money amount={-45_000} sign="always" size="xl" tone="expense" />
          </div>
          <SettingsGroup>
            <SettingsRow icon={WalletCardsIcon} title="Tài khoản" value="Ví MoMo" chevron={false} />
            <SettingsRow icon={CalendarDaysIcon} title="Thời gian" value="06/10 · 12:04" chevron={false} />
          </SettingsGroup>
          <SettingsGroup>
            <SettingsRow icon={CopyIcon} title="Nhân bản" onClick={() => toast("Nhân bản")} />
            <SettingsRow title="Xoá giao dịch" destructive onClick={() => toast("Xoá")} />
          </SettingsGroup>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
