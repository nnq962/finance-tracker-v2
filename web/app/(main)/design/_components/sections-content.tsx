"use client"

import * as React from "react"
import { RiBardFill } from "@remixicon/react"
import {
  FilmIcon,
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BellRingIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
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
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  TrendingUpIcon,
  TriangleAlertIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { ContactAvatar } from "@/app/(main)/debts/_components/contact-avatar"
import { ShelfLink } from "@/components/app/shelf-link"
import { AppHeader, AppHeaderTitle } from "@/components/app/app-header"
import { CardLabel } from "@/components/app/card-label"
import { Carousel } from "@/components/app/carousel"
import { ChoiceTiles } from "@/components/app/choice-tiles"
import { DeltaBadge } from "@/components/app/delta-badge"
import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { MonthSelect } from "@/components/app/month-select"
import { SoftSwap } from "@/components/app/soft-swap"
import { PickGrid } from "@/components/app/pick-grid"
import { FlowTiles } from "@/components/app/flow-tiles"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet } from "@/components/app/page-sheet"
import { PageDots } from "@/components/app/page-dots"
import { PromoBanner } from "@/components/app/promo-banner"
import { PushBanner } from "@/components/app/push-banner"
import { Section } from "@/components/app/section-header"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { ErrorCard } from "@/components/app/status-screen"
import { StepFlow } from "@/components/app/step-flow"
import { Stepper } from "@/components/app/stepper"
import { Steps } from "@/components/app/steps"
import { CurrencyInput } from "@/components/forms/currency-input"
import { InlineInput } from "@/components/forms/inline-input"
import { ScreenHeader } from "@/components/app/screen-header"
import { PageHeader } from "@/components/page"
import { SettingsFieldRow, SettingsGroup, SettingsGroupSkeleton, SettingsRow } from "@/components/settings-list"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { appNavigationItems } from "@/lib/app-navigation"
import { cn } from "@/lib/utils"
import { debtsUrl } from "@/lib/debts/debts-url"

import { Block, BlockLabel, CatalogSection, Wide } from "./catalog-kit"
import { PageSheetPlayground } from "./sheet-playground"

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
  const [flow, setFlow] = React.useState<"in" | "out" | null>(null)
  const [longFlow, setLongFlow] = React.useState<"in" | "out" | null>(null)
  const [hugeFlow, setHugeFlow] = React.useState<"in" | "out" | null>(null)
  const [period, setPeriod] = React.useState<"month" | "year">("year")
  const [reminder, setReminder] = React.useState<"morning" | "noon" | "evening">("evening")
  const [gridPick, setGridPick] = React.useState("food")

  return (
    <CatalogSection id="card">
      <Wide>
        <BlockLabel className="px-1">Hai chiều tiền, chỉ hiển thị số (FlowTiles không có onValueChange), như sheet một ngày</BlockLabel>
        <FlowTiles
          tiles={[
            { value: "in", label: "Thu", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
            { value: "out", label: "Chi", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
          ]}
        />
      </Wide>
      <Wide>
        <BlockLabel className="px-1">Hai chiều tiền, chạm để lọc danh sách (FlowTiles có onValueChange)</BlockLabel>
        <FlowTiles
          value={flow}
          onValueChange={setFlow}
          tiles={[
            { value: "in", label: "Thu", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
            { value: "out", label: "Chi", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
          ]}
        />
      </Wide>
      <Wide>
        <BlockLabel className="px-1">FlowTiles · số tiền dài, rộng như màn 360px: nhỏ lại cho vừa một dòng</BlockLabel>
        {/* As wide as the card on a 360px phone, so the sample shows the same at every viewport. */}
        <div className="max-w-[328px]">
          <FlowTiles
            value={longFlow}
            onValueChange={setLongFlow}
            tiles={[
              { value: "in", label: "Cần thu", amount: 125_000_000, caption: "3 khoản", icon: ArrowDownLeftIcon, tone: "income" },
              { value: "out", label: "Cần trả", amount: 1_250_000_000, caption: "1 khoản", icon: ArrowUpRightIcon, tone: "expense" },
            ]}
          />
        </div>
      </Wide>
      <Wide>
        <BlockLabel className="px-1">FlowTiles · rộng như màn 360px, nhỏ hết cỡ vẫn không vừa: rút gọn (125tỷ), số đầy đủ cho trình đọc màn hình</BlockLabel>
        <div className="max-w-[328px]">
          <FlowTiles
            value={hugeFlow}
            onValueChange={setHugeFlow}
            tiles={[
              { value: "in", label: "Thu", amount: 48_500_000, caption: "12 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
              { value: "out", label: "Chi", amount: 125_000_000_000, caption: "1 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
            ]}
          />
        </div>
      </Wide>
      <Block label="Chọn một trong vài ô (ChoiceTiles) · tone ai, như kỳ thanh toán Pro">
        <ChoiceTiles
          tone="ai"
          aria-label="Kỳ thanh toán"
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: "month", title: "29.000đ", description: "Trả theo tháng" },
            { value: "year", title: "249.000đ", description: "Trả theo năm", badge: "Giảm 28%" },
          ]}
        />
      </Block>
      <Block label="ChoiceTiles · tone mặc định, ba ô">
        <ChoiceTiles
          aria-label="Giờ nhắc"
          value={reminder}
          onValueChange={setReminder}
          options={[
            { value: "morning", title: "8:00", description: "Sáng" },
            { value: "noon", title: "12:00", description: "Trưa" },
            { value: "evening", title: "21:00", description: "Tối" },
          ]}
        />
      </Block>
      <Block label="Lưới chọn (PickGrid) · hạng mục, ngân hàng; ô cuối mở danh sách đủ; ô đầu: hạng mục sẽ tạo (IconTile badge Mới)">
        <PickGrid
          id="ds-pick-grid"
          caption="Hạng mục"
          items={[
            { id: "new", label: "Xem phim", media: <IconTile icon={FilmIcon} tone="card" badge="Mới" /> },
            { id: "food", label: "Ăn uống", media: <IconTile icon={UtensilsCrossedIcon} tone="orange" /> },
            { id: "save", label: "Tiết kiệm", media: <IconTile icon={PiggyBankIcon} tone="pink" /> },
            { id: "bills", label: "Hoá đơn", media: <IconTile icon={FileTextIcon} tone="blue" /> },
            { id: "invest", label: "Đầu tư", media: <IconTile icon={TrendingUpIcon} tone="emerald" /> },
            { id: "gift", label: "Quà tặng", media: <IconTile icon={SparklesIcon} tone="violet" /> },
            { id: "transfer", label: "Chuyển tiền", media: <IconTile icon={ArrowLeftRightIcon} /> },
          ]}
          value={gridPick}
          onValueChange={setGridPick}
          onShowAll={() => toast("Mở danh sách đủ")}
        />
      </Block>
      <Card size="lg" variant="inverse" discs={false}>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <CardLabel as="p">Số dư khả dụng · Card inverse discs=&#123;false&#125;</CardLabel>
            <Badge variant="inverse">Badge inverse</Badge>
          </div>
          <Money amount={12_480_000} size="xl" className="mt-1.5" />
          <div className="mt-8 flex items-end justify-between">
            <p className="text-sm tracking-[0.2em] opacity-70">•••• 4821</p>
            <p className="text-sm font-medium">Techcombank</p>
          </div>
        </CardContent>
      </Card>
      <Card size="lg" variant="pastel" blend="balance" discs={false}>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <CardLabel as="p">Tổng số dư · Card pastel blend=&quot;balance&quot; (net · balance · flow · debts · profile)</CardLabel>
            <Badge variant="soft">Badge soft</Badge>
          </div>
          <Money amount={56_453_000} size="xl" className="mt-1.5" />
          <ul className="mt-5 flex flex-col rounded-2xl bg-pastel-tile px-4 shadow-[inset_0_0_0_1px_var(--pastel-tile-edge)]">
            <li className="flex min-h-12 items-center justify-between text-sm">
              Ngân hàng <Money amount={56_480_000} size="sm" />
            </li>
            <li className="flex min-h-12 items-center justify-between border-t border-foreground/8 text-sm">
              Tiền mặt <Money amount={-620_000} size="sm" tone="expense" />
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card size="lg">
        <CardContent>
          <CardLabel as="p">Tài sản ròng · Card lg, thẻ dẫn đầu (StatGroup tiles)</CardLabel>
          <Money amount={55_103_000} size="xl" className="mt-1.5" />
          <p className="mt-0.5 text-sm">
            <span className="font-medium text-income">+17,6tr</span>
            <span className="ml-1.5 text-muted-foreground">thu chi tháng này</span>
          </p>
          <StatGroup tiles className="mt-5">
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
  const [moreShown, setMoreShown] = React.useState(false)
  const [picked, setPicked] = React.useState(["Ví MoMo"])
  const [reminder, setReminder] = React.useState(true)
  const [rowAmount, setRowAmount] = React.useState<number | null>(730_000)
  const [rowHours, setRowHours] = React.useState("6")
  const [rowCount, setRowCount] = React.useState(1)
  const [rowRegion, setRowRegion] = React.useState("I")

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
      <Section title="Sắp đến hạn" href={debtsUrl()}>
        <SettingsGroup size="lg">
          {dueSamples.map(([name, direction, amount, due]) => (
            <SettingsRow
              key={name}
              media={<ContactAvatar contactId={name} initials={name.split(" ").map((word) => word[0]).join("")} />}
              title={name}
              description={direction}
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
      <SettingsGroup title="Tiêu đề bám khi cuộn (stickyCaption)" size="lg" stickyCaption action="−4.637.000đ">
        {dueSamples.map(([name, kind, amount]) => (
          <SettingsRow key={name} title={name} description={kind} value={<Money amount={amount} size="sm" />} />
        ))}
      </SettingsGroup>
      {/* A day of Giao dịch (2026-10-24): the caption drawn by its title, not in small capitals. */}
      <SettingsGroup
        plainCaption
        title={
          <span className="flex items-center gap-2.5">
            <span className="flex size-[34px] items-center justify-center rounded-[11px] bg-ai text-[15px] font-bold text-ai-foreground tabular-nums">24</span>
            <span className="flex flex-col">
              <span className="text-sm leading-tight font-semibold">Hôm nay (plainCaption)</span>
              <span className="text-xs leading-tight text-muted-foreground">Thứ Bảy, 24/10</span>
            </span>
          </span>
        }
        action={<span className="text-sm font-semibold text-muted-foreground tabular-nums">−450.000đ</span>}
      >
        {dueSamples.slice(0, 2).map(([name, kind, amount]) => (
          <SettingsRow key={name} title={name} description={kind} value={<Money amount={amount} size="sm" />} />
        ))}
      </SettingsGroup>
      <SettingsGroup title="Đã tất toán (collapsible)" size="lg" collapsible={{ showLabel: "Hiện 2 khoản" }}>
        {dueSamples.map(([name, kind, amount]) => (
          <SettingsRow key={name} title={name} description={kind} value={<Money amount={amount} size="sm" />} />
        ))}
      </SettingsGroup>
      {/* What is put away opens in a sheet (2026-10-21): the accounts' Lưu trữ, the settled debts. */}
      <ShelfLink align="center" icon={CircleCheckIcon} onClick={() => toast("Mở sheet Đã tất toán")}>
        2 khoản đã tất toán
      </ShelfLink>
      {/* The accounts page's Lưu trữ on phones (2026-10-23): a full-width row. */}
      <ShelfLink align="fill" onClick={() => toast("Mở sheet Lưu trữ")}>
        Lưu trữ · 2 tài khoản, 1 hũ
      </ShelfLink>
      <SettingsGroup title="Mô tả một dòng, hoặc đầy đủ (fullDescription)" size="lg">
        <SettingsRow
          icon={WalletCardsIcon}
          title="Tài khoản tiết kiệm có kỳ hạn 12 tháng ở Vietcombank"
          description="Mở ngày 08/10/2025 · lãi 5,5%/năm · tự tái tục gốc và lãi"
          onClick={() => toast("Mở tài khoản")}
        />
        <SettingsRow
          title="Ghi chú"
          description="Tiền đặt cọc thuê nhà, trả lại khi hết hợp đồng vào tháng 6 năm sau; hợp đồng ở https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKlMnOp/view"
          fullDescription
        />
      </SettingsGroup>
      <div className="grid grid-cols-1 gap-3">
        <BlockLabel className="px-1">Khung chờ của nhóm (SettingsGroupSkeleton), cùng kích thước nhóm thật</BlockLabel>
        <SettingsGroupSkeleton rows={2} description trailing="amount" />
        <SettingsGroupSkeleton caption={false} rows={1} media="avatar-lg" description trailing="value" chevron />
      </div>
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
      {/* As the transactions' filter screens: a pick list, the chosen rows ticked. */}
      <SettingsGroup title="List chọn (checked)" size="lg">
        {["Vietcombank", "Ví MoMo", "Tiền mặt"].map((name) => (
          <SettingsRow
            key={name}
            icon={WalletCardsIcon}
            tone="blue"
            title={name}
            checked={picked.includes(name)}
            onClick={() => setPicked(picked.includes(name) ? picked.filter((item) => item !== name) : [...picked, name])}
          />
        ))}
      </SettingsGroup>
      {/* As the notifications: unread rows have a blue dot on their icon and a semibold title. */}
      <SettingsGroup title="Chưa đọc (unread)" size="lg">
        <SettingsRow icon={BellRingIcon} tone="amber" title="Chưa đọc" description="Chấm xanh, tiêu đề đậm" value="08:00" unread onClick={() => toast("Mở")} />
        <SettingsRow icon={BellRingIcon} tone="amber" title="Đã đọc" description="Như mọi dòng khác" value="Hôm qua" onClick={() => toast("Mở")} />
      </SettingsGroup>
      {/* As the overview's missions: rows shown on request slide open and shut, the dividers follow. */}
      <SettingsGroup
        title="Dòng gập (collapsed)"
        size="lg"
        action={
          <Button size="sm" variant="ghost" onClick={() => setMoreShown((shown) => !shown)}>
            {moreShown ? "Ẩn bớt" : "Hiện thêm"}
          </Button>
        }
      >
        <SettingsRow icon={WalletCardsIcon} tone="blue" title="Luôn hiện" />
        <SettingsRow icon={TagIcon} tone="orange" title="Hiện khi mở" collapsed={!moreShown} />
        <SettingsRow icon={BellRingIcon} tone="amber" title="Hiện khi mở" collapsed={!moreShown} />
        <SettingsRow icon={SparklesIcon} tone="ai" title="Luôn hiện" />
      </SettingsGroup>
      {/* As the salary calculator and the contact form: fields set in place on rows. */}
      <SettingsGroup title="Dòng nhập tại chỗ (SettingsFieldRow)" size="lg" footer="Ô gõ lấp đầy dòng tới nhãn; đơn vị luôn hiện, kể cả khi ô trống.">
        <SettingsFieldRow htmlFor="ds-field-row-amount" title="Phụ cấp">
          <CurrencyInput variant="inline" id="ds-field-row-amount" name="allowance" value={rowAmount} onValueChange={setRowAmount} />
        </SettingsFieldRow>
        <SettingsFieldRow htmlFor="ds-field-row-hours" icon={BriefcaseIcon} title="Ngày thường" description="150% lương giờ">
          <InlineInput id="ds-field-row-hours" inputMode="decimal" unit="giờ" placeholder="0" value={rowHours} onChange={(event) => setRowHours(event.target.value)} />
        </SettingsFieldRow>
        <SettingsFieldRow title="Người phụ thuộc">
          <Stepper label="Người phụ thuộc" value={rowCount} onValueChange={setRowCount} className="w-32" />
        </SettingsFieldRow>
        <SettingsFieldRow title="Vùng" description="Tối thiểu 5.310.000đ">
          <ToggleGroup type="single" size="sm" value={rowRegion} onValueChange={(value) => value && setRowRegion(value)} aria-label="Vùng">
            {["I", "II", "III", "IV"].map((region) => (
              <ToggleGroupItem key={region} value={region}>
                {region}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingsFieldRow>
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
      <Block label="Màu theo người (AvatarFallback colorKey), như Tổng quan; accent (xanh chanh) cho thẻ hồ sơ ở Cài đặt">
        <div className="flex items-end gap-3">
          {["user-1", "user-2", "user-3", "user-4"].map((id, index) => (
            <Avatar key={id} size="xl">
              <AvatarFallback colorKey={id}>{["MA", "HL", "TT", "QN"][index]}</AvatarFallback>
            </Avatar>
          ))}
          <Avatar size="xl">
            <AvatarFallback accent>DD</AvatarFallback>
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

/** Made-up figures that differ from month to month, for the SoftSwap sample. */
function MonthFiguresSample({ month }: { month: string }) {
  const [, monthNumber] = month.split("-").map(Number)
  const spent = 3_200_000 + ((monthNumber * 7_340_000) % 4_100_000)
  const count = 30 + ((monthNumber * 17) % 25)
  const earned = 14_000_000 + ((monthNumber * 3_910_000) % 5_000_000)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-3">
      <span className="@container flex min-w-0 flex-col">
        <CardLabel as="span">
          Đã chi · <SoftSwap value={count} inline />
        </CardLabel>
        <span className="mt-1 flex min-w-0">
          <SoftSwap value={spent}>{(amount) => <Money amount={amount} sign="never" size="lg" fit />}</SoftSwap>
        </span>
      </span>
      <span aria-hidden="true" className="bg-separator" />
      <span className="@container flex min-w-0 flex-col">
        <CardLabel as="span">Đã thu</CardLabel>
        <span className="mt-1 flex min-w-0 text-income">
          <SoftSwap value={earned}>{(amount) => <Money amount={amount} sign="never" size="lg" fit />}</SoftSwap>
        </span>
      </span>
    </div>
  )
}

function NavSection() {
  const [page, setPage] = React.useState(1)
  const [step, setStep] = React.useState(1)
  const [flowStep, setFlowStep] = React.useState(0)
  const [month, setMonth] = React.useState("2026-10")

  return (
    <CatalogSection id="nav">
      <Block label="Chọn tháng · nút mở sheet chọn tháng (MonthSelect, size card trong thẻ)">
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelect value={month} max="2026-10" onValueChange={setMonth} />
          <MonthSelect size="card" value={month} max="2026-10" onValueChange={setMonth} />
        </div>
      </Block>
      <Block label="Số đổi tại chỗ (SoftSwap) · đổi tháng ở trên: số cũ mờ đi, số mới hiện ra ngay chỗ đó, 200ms, không trượt">
        <MonthFiguresSample month={month} />
      </Block>
      <Block label="Chỉ báo trang · chạm để chuyển">
        <div className="flex items-center justify-between">
          <PageDots count={4} value={page} onValueChange={setPage} />
          <span className="text-sm text-muted-foreground tabular-nums">{page + 1} / 4</span>
        </div>
      </Block>
      <Block label="Đi từng bước (StepFlow) · vuốt, chấm, ‹ co giãn, nhãn chuyển mờ">
        <StepFlow
          label="Mẫu các bước"
          step={flowStep}
          onStepChange={setFlowStep}
          doneLabel="Xong"
          onDone={() => {
            setFlowStep(0)
            toast("Xong")
          }}
          steps={["Mở", "Chọn", "Lưu"].map((title, index) => ({
            key: title,
            label: title,
            content: (
              <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-transfer/10 text-center">
                <span className="text-xs text-muted-foreground">Bước {index + 1}/3</span>
                <span className="text-base font-semibold">{title}</span>
              </div>
            ),
          }))}
        />
      </Block>
      <Block label="Các bước · đổi bước bằng hai nút">
        <Steps steps={["Thông tin", "Xác minh", "Hoàn tất"]} current={step} />
        {/* Separate buttons rather than a list inside a button (2026-10-21). */}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Lùi
          </Button>
          <Button type="button" size="sm" disabled={step === 3} onClick={() => setStep(step + 1)}>
            Tiếp
          </Button>
        </div>
      </Block>
      <Block label="Thanh đầu trang trên điện thoại (AppHeader) · avatar mở Cài đặt (nhãn PRO trên gói Pro), giữa là tên hay viên ngày, nút tròn bên phải; Giao dịch: segmented lớn (size lg) dưới thanh" wide>
        {/* Shown on every size here; on pages only below md. Without the bar's own space below it. */}
        <div className="mx-auto flex max-w-[390px] flex-col gap-4 *:mb-0! *:md:grid!">
          <AppHeader
            center={<AppHeaderTitle as="p">Tài khoản</AppHeaderTitle>}
            actions={
              <Button type="button" variant="elevated" size="icon" aria-label="Thêm tài khoản" onClick={() => toast("Thêm tài khoản")}>
                <PlusIcon />
              </Button>
            }
          />
          <AppHeader
            center={
              <Button type="button" variant="elevated" className="max-w-full min-w-0 gap-2 px-4 text-[15px]">
                <CalendarDaysIcon className="text-muted-foreground" />
                <span className="truncate">Thứ Bảy, 24 tháng 10</span>
              </Button>
            }
            actions={
              <Button type="button" variant="elevated" size="icon" aria-label="Thông báo">
                <BellIcon />
              </Button>
            }
          />
          {/* Giao dịch (PageHeader leadBelow): the name in the bar, the large switch under it. */}
          <div className="space-y-4 *:mb-0! *:md:grid!">
            <AppHeader
              center={<AppHeaderTitle as="p">Giao dịch</AppHeaderTitle>}
              actions={
                <Button type="button" variant="elevated" size="icon" aria-label="Tìm giao dịch">
                  <SearchIcon />
                </Button>
              }
            />
            <Tabs defaultValue="spend" className="block!">
              <TabsList variant="segmented" size="lg" className="w-full">
                <TabsTrigger value="spend">Chi tiêu</TabsTrigger>
                <TabsTrigger value="debts">Vay nợ</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Block>
      <Block label="Đầu trang (PageHeader) · trên điện thoại là thanh ở trên, từ md tên trang bên trái, công cụ bên phải" wide>
        {/* Without the header's own space below it, which only pages need. */}
        <div className="*:mb-0!">
          <PageHeader
            title={<span>Giao dịch</span>}
            tools={<MonthSelect size="bar" value={month} max="2026-10" onValueChange={setMonth} />}
            accessory={
              <Button type="button" variant="elevated" size="icon" className="text-ai-strong" aria-label="Nhập bằng AI" onClick={() => toast("Nhập bằng AI")}>
                <SparklesIcon />
              </Button>
            }
          />
        </div>
      </Block>
      <Block label="Đầu màn đẩy vào (ScreenHeader) · nút back tròn có bóng, tên ở giữa, như thanh của sheet (Cài đặt từ Tổng quan)" wide>
        <ScreenHeader title="Cài đặt" />
      </Block>
      <Block label="Thanh tab" wide>
        <TabBarSample />
        <p className="mt-4 text-sm text-muted-foreground">
          Thanh tab nổi ở đáy màn hình (MobileBottomNav, kiểu iOS 26): một viên kính trong 35% có mờ nền, năm ô (Tổng quan,
          Tài khoản, Giao dịch, Vay nợ, Timi), icon Phosphor đặc, nhãn 10/700; tab đang mở xanh #0088ff trên viên kính nhỏ;
          trượt khuất khi mở Cài đặt. Là khung của app; xem trực tiếp ở các trang chính trên điện thoại. Đầu trang cuộn cùng trang; Tổng quan đặt avatar,
          lời chào và tên vào chỗ tên trang. Tabs dạng gạch chân ở mục Toggle group.
        </p>
      </Block>
    </CatalogSection>
  )
}

function FeedbackSection() {
  const [banner, setBanner] = React.useState(true)
  const [monthOpen, setMonthOpen] = React.useState(false)
  const [month, setMonth] = React.useState("2026-10")

  return (
    <CatalogSection id="feedback">
      <Wide>
        <BlockLabel className="px-1">
          Sheet dùng chung (PageSheet) · mẫu tổng hợp: tiêu đề, nút, nền, form, dòng, danh sách dài; đổi kiểu ngay trong sheet
        </BlockLabel>
        <PageSheetPlayground />
      </Wide>
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
        <NoticeBanner
          tone="expense"
          surface="card"
          icon={TriangleAlertIcon}
          title="1 khoản quá hạn"
          onClick={() => toast("Mở khoản quá hạn")}
        >
          Minh Tuấn
        </NoticeBanner>
      </Wide>
      <Wide>
        <NoticeBanner tone="warning" icon={BellRingIcon} title="Sắp đến hạn">
          Hoá đơn điện 520.000đ đến hạn ngày 10/10.
        </NoticeBanner>
      </Wide>
      <Wide>
        <BlockLabel className="px-1">PushBanner · thông báo đẩy như trên màn khoá, để xem trước khi gửi</BlockLabel>
        <PushBanner
          title="Hạn mức chi tiêu đã có"
          body="Đặt hạn mức cho cả tháng hoặc từng nhóm, Timi báo khi sắp vượt."
        />
      </Wide>
      <Wide>
        <NoticeBanner
          tone="income"
          icon={CircleCheckIcon}
          title="Đã nâng cấp Pro"
          action={
            <Button size="sm" variant="secondary" onClick={() => toast("Ghi khoản chi")}>
              Ghi khoản chi
            </Button>
          }
        >
          Kèm một nút ở cuối (action)
        </NoticeBanner>
      </Wide>
      <Wide>
        <NoticeBanner
          tone="warning"
          icon={LightbulbIcon}
          title="Hạn mức có thể quá thấp"
          footer={
            <>
              <Button size="sm" onClick={() => toast("Đặt 3tr")}>
                Đặt 3tr
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toast("Ẩn tới hết tháng")}>
                Để sau
              </Button>
            </>
          }
        >
          Các nút ở một hàng riêng dưới chữ (footer), để chữ dài giữ đủ bề ngang: gợi ý chỉnh hạn mức.
        </NoticeBanner>
      </Wide>
      <Wide>
        <NoticeBanner tone="warning" title="1 khoản quá hạn" onClick={() => toast("Mở khoản quá hạn")}>
          Minh Tuấn · bấm được cả khối (onClick)
        </NoticeBanner>
      </Wide>
      {/* The card itself, not inside a block's card (2026-10-21). */}
      <Wide>
        <BlockLabel className="px-1">ErrorCard · trang không tải được (error.tsx); StatusScreen là màn riêng: trang 404 và app gặp sự cố</BlockLabel>
        <div className="flex flex-col gap-3">
          <ErrorCard title="Không tải được Tổng quan" onRetry={() => toast("Thử lại")} />
          <Button variant="secondary" asChild>
            <Link href="/khong-co-trang-nay">Mở trang 404 (StatusScreen)</Link>
          </Button>
        </div>
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
          <Button
            variant="secondary"
            onClick={() => toast.error("Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.")}
          >
            Toast lỗi dài
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning("Ăn uống đã dùng 90% hạn mức", { description: "Còn 120.000đ đến hết tháng" })}
          >
            Toast cảnh báo
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const id = toast.loading("Đang kết nối thiết bị…")
              window.setTimeout(() => toast.success("Đã bật thông báo.", { id }), 1500)
            }}
          >
            Toast đang tải
          </Button>
          <Button variant="secondary" onClick={() => setMonthOpen(true)}>
            Chọn tháng
          </Button>
          <MonthPickerSheet
            open={monthOpen}
            onOpenChange={setMonthOpen}
            value={month}
            max="2026-10"
            onValueChange={(next) => {
              setMonth(next)
              toast(`Tháng ${Number(next.slice(5, 7))}/${next.slice(0, 4)}`)
            }}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Alert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive-text dark:bg-destructive/20">
                  <Trash2Icon />
                </AlertDialogMedia>
                <AlertDialogTitle>Xoá giao dịch?</AlertDialogTitle>
                <AlertDialogDescription>Số dư tài khoản sẽ được hoàn lại. Không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction variant="destructive-solid" onClick={() => toast.success("Đã xoá")}>
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
                <DrawerTitle>Chia sẻ báo cáo</DrawerTitle>
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

          {/* A short bottom sheet that drags (Drawer, vaul), not the old Sheet variant="bottom" whose grabber could not be dragged (2026-10-21). */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Sheet đáy</Button>
            </DrawerTrigger>
            <DrawerContent surface="grouped">
              <DrawerHeader>
                <DrawerTitle>Ăn trưa</DrawerTitle>
                <DrawerDescription className="sr-only">Việc với giao dịch này</DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 pb-4">
                <SettingsGroup>
                  <SettingsRow icon={PencilIcon} title="Sửa" chevron={false} onClick={() => toast("Sửa")} />
                  <SettingsRow icon={CopyIcon} title="Nhân bản" chevron={false} onClick={() => toast("Nhân bản")} />
                </SettingsGroup>
                <SettingsGroup>
                  <SettingsRow title="Xoá giao dịch" destructive onClick={() => toast("Xoá")} />
                </SettingsGroup>
              </div>
            </DrawerContent>
          </Drawer>

          {/* A short form is a page sheet too, not a centred dialog: the keyboard stays down until the field is tapped (2026-10-21). */}
          <PageSheet
            title="Đổi tên tài khoản"
            surface="plain"
            className="space-y-2"
            trigger={<Button variant="secondary">Đổi tên (sheet)</Button>}
            footer={<Button className="w-full">Lưu</Button>}
          >
            <Input defaultValue="Ví MoMo" aria-label="Tên tài khoản" />
            <p className="px-1 text-xs text-muted-foreground">Tên hiện ở danh sách tài khoản và giao dịch.</p>
          </PageSheet>

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
        <Button variant="secondary">Màn chào mừng</Button>
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
    <PageSheet
      title="Giao dịch mới"
      surface="plain"
      className="space-y-6"
      trigger={<Button variant="secondary">PageSheet · form</Button>}
      footer={
        <Button className="w-full">
          Lưu giao dịch
        </Button>
      }
    >
      <KindTabs />
      <TransactionFields idPrefix="ds-page" />
    </PageSheet>
  )
}

// Long enough to scroll, so the rows show how they fade into the bar.
const recentLunches = ["05/10", "04/10", "03/10", "02/10", "01/10", "30/09"]

/** The pencil opens a PageSheet inside this one: it is pushed in from the right, ‹ back (2026-10-18). */
function PageSheetDetailSample() {
  const [editing, setEditing] = React.useState(false)
  return (
    <PageSheet
      title="Chi tiết giao dịch"
      surface="grouped"
      className="space-y-6"
      trigger={<Button variant="secondary">PageSheet · chi tiết</Button>}
      action={
        <Button type="button" variant="elevated" size="icon" aria-label="Sửa" onClick={() => setEditing(true)}>
          <PencilIcon />
        </Button>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        <IconTile icon={UtensilsCrossedIcon} tone="orange" size="lg" shape="rounded" />
        <p className="mt-3 text-muted-foreground">Ăn trưa</p>
        <Money amount={-45_000} sign="always" size="xl" tone="expense" />
      </div>
      <SettingsGroup>
        <SettingsRow icon={WalletCardsIcon} title="Tài khoản" value="Ví MoMo" chevron={false} />
        <SettingsRow icon={CalendarDaysIcon} title="Thời gian" value="06/10 · 12:04" chevron={false} />
      </SettingsGroup>
      <SettingsGroup title="Cùng hạng mục gần đây">
        {recentLunches.map((day) => (
          <SettingsRow
            key={day}
            icon={UtensilsCrossedIcon}
            tone="orange"
            title="Ăn trưa"
            description={day}
            value={<Money amount={-45_000} sign="always" size="sm" tone="expense" />}
            chevron={false}
          />
        ))}
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={CopyIcon} title="Nhân bản" onClick={() => toast("Nhân bản")} />
        <SettingsRow title="Xoá giao dịch" destructive onClick={() => toast("Xoá")} />
      </SettingsGroup>
      <PageSheet
        title="Chỉnh sửa giao dịch"
        surface="plain"
        className="space-y-6"
        open={editing}
        onOpenChange={setEditing}
        footer={
          <Button className="w-full" onClick={() => setEditing(false)}>
            Lưu thay đổi
          </Button>
        }
      >
        <KindTabs />
        <TransactionFields idPrefix="ds-push" />
      </PageSheet>
    </PageSheet>
  )
}

/**
 * A still copy of the phone tab bar (MobileBottomNav) for the catalog: the
 * glass capsule, the open tab's glass pill in #0088ff, Phosphor fill glyphs,
 * 10/700 labels, Timi last. The real bar is fixed to the screen and routes.
 */
function TabBarSample() {
  return (
    // Bled to the block card's edges, so the bar gets its real width (350) on a phone.
    <div aria-hidden="true" className="-mx-6 bg-muted px-1 py-4 md:mx-auto md:max-w-[382px] md:rounded-[24px] md:px-4">
      <div className="relative isolate flex h-[62px] items-center rounded-full p-1 shadow-[0_8px_40px_rgb(0_0_0/0.12),0_8px_15px_rgb(0_0_0/0.02)]">
        <span className="absolute inset-0 -z-10 rounded-full bg-tab-bar backdrop-blur-[6px] backdrop-saturate-160" />
        {appNavigationItems.map(({ mobileTitle, tabIcon: Icon }, index) => (
          <span
            key={mobileTitle}
            className={cn(
              "flex h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-full",
              index === 0 ? "bg-tab-pill text-tab-active" : "text-foreground",
            )}
          >
            <Icon size={26} weight="fill" />
            <span className="text-[10px] leading-3 font-bold tracking-[-0.1px] whitespace-nowrap">{mobileTitle}</span>
          </span>
        ))}
        <span className="flex h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-px text-foreground">
          <RiBardFill size={26} />
          <span className="text-[10px] leading-3 font-bold tracking-[-0.1px]">Timi</span>
        </span>
      </div>
    </div>
  )
}
