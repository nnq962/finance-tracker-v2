"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
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
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  TrendingUpIcon,
  TriangleAlertIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ContactAvatar } from "@/app/(main)/debts/_components/contact-avatar"
import { CardLabel } from "@/components/app/card-label"
import { Carousel } from "@/components/app/carousel"
import { ChoiceTiles } from "@/components/app/choice-tiles"
import { DeltaBadge } from "@/components/app/delta-badge"
import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { MonthSelect } from "@/components/app/month-select"
import { PickGrid } from "@/components/app/pick-grid"
import { FlowTiles } from "@/components/app/flow-tiles"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet } from "@/components/app/page-sheet"
import { PageDots } from "@/components/app/page-dots"
import { PromoBanner } from "@/components/app/promo-banner"
import { Section } from "@/components/app/section-header"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { StepFlow } from "@/components/app/step-flow"
import { Stepper } from "@/components/app/stepper"
import { Steps } from "@/components/app/steps"
import { CurrencyInput } from "@/components/forms/currency-input"
import { InlineInput } from "@/components/forms/inline-input"
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
        <BlockLabel className="px-1">Thẻ dẫn đầu hai chiều tiền (FlowTiles variant=&quot;lead&quot;): vào trên xanh chanh, ra trên đen, như đầu trang Giao dịch</BlockLabel>
        <FlowTiles
          variant="lead"
          tiles={[
            { value: "in", label: "Tiền vào", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
            { value: "out", label: "Tiền ra", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
          ]}
        />
      </Wide>
      <Wide>
        <BlockLabel className="px-1">Hai chiều tiền, chỉ hiển thị số (FlowTiles không có onValueChange), như sheet một ngày và sheet tài khoản</BlockLabel>
        <FlowTiles
          tiles={[
            { value: "in", label: "Tiền vào", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
            { value: "out", label: "Tiền ra", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
          ]}
        />
      </Wide>
      <Wide>
        <BlockLabel className="px-1">Hai chiều tiền, chạm để lọc danh sách (FlowTiles có onValueChange)</BlockLabel>
        <FlowTiles
          value={flow}
          onValueChange={setFlow}
          tiles={[
            { value: "in", label: "Tiền vào", amount: 18_000_000, caption: "1 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
            { value: "out", label: "Tiền ra", amount: 5_152_000, caption: "16 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
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
              { value: "in", label: "Tiền vào", amount: 48_500_000, caption: "12 giao dịch", icon: ArrowDownLeftIcon, tone: "income" },
              { value: "out", label: "Tiền ra", amount: 125_000_000_000, caption: "1 giao dịch", icon: ArrowUpRightIcon, tone: "expense" },
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
      <Block label="Lưới chọn (PickGrid) · hạng mục, ngân hàng; ô cuối mở danh sách đủ">
        <PickGrid
          id="ds-pick-grid"
          caption="Hạng mục"
          items={[
            { id: "food", label: "Ăn uống", media: <IconTile icon={UtensilsCrossedIcon} tone="orange" /> },
            { id: "save", label: "Tiết kiệm", media: <IconTile icon={PiggyBankIcon} tone="pink" /> },
            { id: "bills", label: "Hoá đơn", media: <IconTile icon={FileTextIcon} tone="blue" /> },
            { id: "invest", label: "Đầu tư", media: <IconTile icon={TrendingUpIcon} tone="emerald" /> },
            { id: "gift", label: "Quà tặng", media: <IconTile icon={SparklesIcon} tone="violet" /> },
            { id: "tag", label: "Mua sắm trực tuyến", media: <IconTile icon={TagIcon} tone="amber" /> },
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
      <Section title="Sắp đến hạn" href="/debts">
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
      <SettingsGroup title="Đã tất toán (collapsible)" size="lg" collapsible={{ showLabel: "Hiện 2 khoản" }}>
        {dueSamples.map(([name, kind, amount]) => (
          <SettingsRow key={name} title={name} description={kind} value={<Money amount={amount} size="sm" />} />
        ))}
      </SettingsGroup>
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

function NavSection() {
  const [page, setPage] = React.useState(1)
  const [step, setStep] = React.useState(1)
  const [flowStep, setFlowStep] = React.useState(0)
  const [month, setMonth] = React.useState("2026-10")

  return (
    <CatalogSection id="nav">
      <Block label="Chọn tháng · nút mở sheet chọn tháng (MonthSelect)">
        <MonthSelect value={month} max="2026-10" onValueChange={setMonth} />
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
      <Block label="Các bước · chạm để đổi bước">
        <button type="button" className="w-full" onClick={() => setStep((step + 1) % 4)}>
          <Steps steps={["Thông tin", "Xác minh", "Hoàn tất"]} current={step} />
        </button>
      </Block>
      <Block label="Đầu trang (PageHeader) · tên trang, công cụ bên phải" wide>
        <PageHeader
          title={<span>Giao dịch</span>}
          tools={<MonthSelect size="bar" value={month} max="2026-10" onValueChange={setMonth} />}
          accessory={
            <Button type="button" variant="secondary" size="icon" className="text-ai-strong" aria-label="Nhập bằng AI" onClick={() => toast("Nhập bằng AI")}>
              <SparklesIcon />
            </Button>
          }
        />
      </Block>
      <Block label="Thanh tab" wide>
        <p className="text-sm text-muted-foreground">
          Thanh tab nổi ở đáy màn hình (MobileBottomNav: icon và tên, tab đang mở trên viên xám nhạt) là
          khung của app; xem trực tiếp ở các trang chính. Đầu trang cuộn cùng trang; Tổng quan đặt avatar,
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
        <NoticeBanner tone="warning" title="1 khoản quá hạn" onClick={() => toast("Mở khoản quá hạn")}>
          Minh Tuấn · bấm được cả khối (onClick)
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
          <Button
            variant="secondary"
            onClick={() => toast.error("Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.")}
          >
            Toast lỗi dài
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
        <Button variant="secondary">Màn hình (chỉ màn chào mừng)</Button>
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

function PageSheetDetailSample() {
  return (
    <PageSheet
      title="Chi tiết giao dịch"
      surface="grouped"
      className="space-y-6"
      trigger={<Button variant="secondary">PageSheet · chi tiết</Button>}
      action={
        <Button type="button" variant="secondary" size="icon" aria-label="Sửa">
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
    </PageSheet>
  )
}
