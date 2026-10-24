"use client"

import * as React from "react"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BellIcon,
  BellRingIcon,
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeOffIcon,
  ChevronRightIcon,
  FingerprintIcon,
  HeartIcon,
  ItalicIcon,
  ListFilterIcon,
  LockIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Share2Icon,
  SparklesIcon,
  Trash2Icon,
  UnderlineIcon,
  WalletIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Chip } from "@/components/app/chip"
import { ChipButton, ChipRow, ChipRowDivider } from "@/components/app/chip-row"
import { DeltaBadge } from "@/components/app/delta-badge"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { Block, CatalogSection, Wide } from "./catalog-kit"

const principles = [
  ["Thẻ trắng trên nền xám", "Trang và sheet xám trung tính #f0f0f0, thẻ gần trắng bo tròn, không viền, nổi nhờ bóng ngắn và nhẹ; theme tối nền #0b0b0b, thẻ #171717."],
  ["Một khuôn trang", "Tên trang gọn bên trái, công cụ bên phải; rồi một thẻ dẫn đầu và các nhóm."],
  ["Xám là lớp mực mỏng", "Nền phụ, ô nhập, nút xám là mực 4–10% trong suốt, hợp trang, thẻ lẫn sheet; nút trên header là nút trắng nổi (elevated)."],
  ["Một mảng đen", "Màu mực cho nút chính, chip và segment đang chọn, công tắc bật; thẻ dẫn đầu là thẻ trắng như mọi thẻ, dẫn bằng cỡ số."],
  ["Chữ rõ thứ bậc", "Số tiền dẫn đầu lớn nhất, tên trang 24; chữ thường 14px, phụ 12px."],
  ["Màu dịu, có ý nghĩa", "Ô icon là màu của nó phủ mỏng trên nền trong suốt; xanh lá là tiền vào; đỏ chỉ để cảnh báo (quá hạn, số âm)."],
  ["Vừa ngón tay", "Mọi thứ bấm được cao từ 44px; mọi nút là viên thuốc; chạm thì hơi lún."],
  ["Ít chữ", "Nhãn và mô tả ngắn, dễ hiểu; một thứ gọi một tên trong cả app."],
] as const

const colors = [
  ["primary", "Màu nhấn", "bg-primary"],
  ["background", "Nền trang", "bg-background ring-1 ring-border ring-inset"],
  ["sheet", "Nền sheet", "bg-sheet"],
  ["card", "Thẻ", "bg-card ring-1 ring-border ring-inset"],
  ["muted-foreground", "Chữ phụ", "bg-muted-foreground"],
  ["income", "Tiền vào", "bg-income"],
  ["expense", "Tiền ra", "bg-expense"],
  ["transfer", "Chuyển khoản", "bg-transfer"],
  ["ai", "AI, Pro, điểm nhấn", "bg-ai"],
  ["ai-strong", "Chữ, icon AI", "bg-ai-strong"],
  ["ai-on-primary", "Icon AI trên nút chính", "bg-ai-on-primary"],
  ["warning", "Nhắc nhở", "bg-warning"],
  ["warning-text", "Chữ cam", "bg-warning-text"],
  ["destructive-text", "Chữ đỏ, lỗi", "bg-destructive-text"],
  ["fill-1", "Ô nhập, chip, ô icon (field, segment)", "bg-fill-1"],
  ["fill-2", "Nút xám, rãnh, nền phụ (muted, track)", "bg-fill-2"],
  ["fill-3", "Công tắc tắt, nút xám khi nhấn", "bg-fill-3"],
  ["control", "Viên segmented (kèm shadow-control)", "bg-control shadow-control"],
  ["row-press", "Dòng list khi chạm", "bg-row-press ring-1 ring-border ring-inset"],
  ["inverse", "Avatar chính mình", "bg-inverse"],
  ["destructive", "Xoá, lỗi", "bg-destructive"],
  ["destructive-fill", "Nền nút Xoá", "bg-destructive-fill"],
  ["border", "Viền", "bg-border"],
  ["separator", "Kẻ giữa dòng list", "bg-separator"],
] as const

// Page name 24 · Title 20 · Headline 16 · Body 14 · Caption 12, plus the large amount (34), the
// input text (16, so iOS does not zoom in) and the group captions (12, small capitals).
// Figures and headings 600, text 400; list titles 500.
const typeScale = [
  ["Số tiền lớn", "text-[34px] font-semibold tracking-tight", "34"],
  ["Tên trang", "text-2xl font-semibold tracking-tight", "24"],
  ["Title · nhóm, thẻ", "text-base font-semibold", "16"],
  ["Body · nội dung", "text-sm", "14"],
  ["Caption · mô tả, lỗi", "text-xs text-muted-foreground", "12"],
  ["Nhãn đầu nhóm", "text-xs font-semibold tracking-wider text-muted-foreground uppercase", "12"],
] as const

// Every gap is a multiple of 4, chosen by what it separates.
const spacing = [
  [8, "Tiêu đề → nội dung"],
  [12, "Trong một phần: thẻ cạnh thẻ"],
  [16, "Lề trang · đệm thẻ sm"],
  [20, "Đệm thẻ"],
  [24, "Giữa các phần · đệm thẻ lg"],
  [32, "Giữa các phần, từ md"],
] as const

// Exact pixels: the theme's rounded-2xl and rounded-3xl are 18 and 22, off this scale.
const radii = [
  ["24", "rounded-[24px]", "Thẻ trang tổng hợp, sheet trên desktop"],
  ["20", "rounded-[20px]", "Thẻ, banner"],
  ["16", "rounded-[16px]", "Ô con trong thẻ, thẻ nhỏ"],
  ["12", "rounded-[12px]", "Ô nhập, ô lưới chọn"],
  ["∞", "rounded-full", "Nút, chip, segmented"],
] as const

const filters = ["Ăn uống", "Cà phê", "Di chuyển", "Mua sắm", "Hoá đơn", "Giải trí"]

export function BasicsSections() {
  return (
    <>
      <FoundationSection />
      <ButtonSection />
      <ChipSection />
      <SegmentedSection />
      <SwitchSection />
    </>
  )
}

function FoundationSection() {
  return (
    <CatalogSection id="foundation">
      <Block label="Nguyên tắc" wide>
        <ol className="grid gap-4 md:grid-cols-2">
          {principles.map(([title, description], index) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Block>
      <Block label="Màu · chạm để sao chép token" wide>
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 md:grid-cols-6">
          {colors.map(([token, usage, swatch]) => (
            <button
              key={token}
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(`var(--${token})`)
                toast.success(`Đã sao chép var(--${token})`)
              }}
              className="min-w-0 text-left"
            >
              <span className={`pressable block aspect-square rounded-2xl ${swatch}`} />
              <span className="mt-1.5 block text-xs font-medium break-words">{token}</span>
              <span className="block text-[11px] text-muted-foreground">{usage}</span>
            </button>
          ))}
        </div>
      </Block>
      <Block label="Thang chữ · Manrope" wide>
        <div className="space-y-2.5">
          {typeScale.map(([name, className, size]) => (
            <div key={name} className="flex items-baseline justify-between gap-3">
              <span className={`truncate leading-tight ${className}`}>{name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{size}px</span>
            </div>
          ))}
        </div>
      </Block>
      <Block label="Bo góc">
        {/* Wide bars, so the corners can be told apart at a glance. */}
        <div className="space-y-2">
          {radii.map(([value, className, usage]) => (
            <div key={value} className="flex items-center gap-3">
              <div className={`h-12 w-24 shrink-0 bg-muted ${className}`} />
              <span className="w-5 shrink-0 text-xs font-medium tabular-nums">{value}</span>
              <span className="min-w-0 text-xs text-muted-foreground">{usage}</span>
            </div>
          ))}
        </div>
      </Block>
      <Block label="Khoảng cách">
        <div className="space-y-2">
          {spacing.map(([space, usage]) => (
            <div key={space} className="flex items-center gap-3">
              {/* At true size. */}
              <span className="w-8 shrink-0">
                <span className="block h-2 rounded-full bg-primary" style={{ width: space }} />
              </span>
              <span className="w-5 shrink-0 text-xs font-medium tabular-nums">{space}</span>
              <span className="min-w-0 truncate text-xs text-muted-foreground">{usage}</span>
            </div>
          ))}
        </div>
      </Block>
    </CatalogSection>
  )
}

function ButtonSection() {
  const [loading, setLoading] = React.useState(false)

  return (
    <CatalogSection id="button">
      <Block label="Biến thể">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          {/* Elevated is the card's own colour, so it shows on the grey page only: set on a patch of it (2026-10-24). */}
          <span className="inline-flex rounded-full bg-background p-1">
            <Button variant="elevated">Elevated</Button>
          </span>
          <Button variant="ghost">Ghost</Button>
          <Button variant="ai">
            <SparklesIcon data-icon="inline-start" />
            Nâng cấp Pro
          </Button>
          <Button variant="link">Xem thêm</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="destructive">
            <Trash2Icon data-icon="inline-start" />
            Xoá
          </Button>
          <Button variant="destructive-solid">Xoá tài khoản</Button>
        </div>
      </Block>
      <Block label="Trên header · elevated">
        {/* On a patch of the page's grey, where header buttons stand. */}
        <div className="flex items-center justify-between gap-3 rounded-[20px] bg-background p-3">
          <Button variant="elevated" size="icon" aria-label="Đóng">
            <XIcon />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="elevated">
              Tháng 10
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
            <Button variant="elevated" size="icon" aria-label="Sửa">
              <PencilIcon />
            </Button>
          </div>
        </div>
      </Block>
      <Block label="Chân sheet · Xoá cạnh Lưu">
        <div className="flex items-center gap-2">
          <Button variant="destructive" className="w-30 px-0" aria-label="Xoá">
            <Trash2Icon />
          </Button>
          <Button className="flex-1">Lưu</Button>
        </div>
      </Block>
      <Block label="Kích thước · 32 / 36 / 44 / 56">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Nhận +5</Button>
          <Button size="sm">Small</Button>
          <Button>Mặc định</Button>
          <Button size="lg">Large</Button>
        </div>
      </Block>
      <Block label="Icon · trạng thái">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary">
            <Share2Icon data-icon="inline-start" />
            Chia sẻ
          </Button>
          <Button>
            Tiếp tục
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1600)
            }}
          >
            Bấm để tải
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="fab" aria-label="Thêm giao dịch">
            <PlusIcon />
          </Button>
          <Button size="icon-lg" aria-label="Yêu thích">
            <HeartIcon />
          </Button>
          <Button size="icon-lg" variant="secondary" aria-label="Chia sẻ">
            <Share2Icon />
          </Button>
          <Button size="icon" variant="elevated" aria-label="Thông báo">
            <BellIcon />
          </Button>
          <Button size="icon-sm" variant="secondary" aria-label="Làm mới">
            <RefreshCwIcon />
          </Button>
        </div>
      </Block>
      <Block label="Full-width · nhóm">
        <div className="space-y-2">
          <Button size="lg" className="w-full">
            Tạo tài khoản
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" variant="secondary">
              Huỷ
            </Button>
            <Button size="lg">Xác nhận</Button>
          </div>
        </div>
      </Block>
    </CatalogSection>
  )
}

function ChipSection() {
  const [chosen, setChosen] = React.useState(["Ăn uống", "Cà phê"])
  const [tags, setTags] = React.useState(["Công tác", "Gia đình", "Du lịch"])
  const [kind, setKind] = React.useState("all")
  const [filterCount, setFilterCount] = React.useState(0)

  return (
    <CatalogSection id="chip">
      <Block label="Hàng chip cuộn ngang (ChipRow) · nút lọc (ChipButton, đậm khi đang lọc), vạch chia, loại chọn một" wide>
        <ChipRow>
          <ChipButton
            active={filterCount > 0}
            className="shrink-0"
            onClick={() => setFilterCount((count) => (count + 1) % 3)}
          >
            <ListFilterIcon data-icon="inline-start" />
            {filterCount > 0 ? `Lọc · ${filterCount}` : "Lọc"}
          </ChipButton>
          <ChipRowDivider />
          <ToggleGroup
            type="single"
            size="sm"
            value={kind}
            onValueChange={(value) => value && setKind(value)}
            aria-label="Loại giao dịch"
            className="shrink-0"
          >
            {["Tất cả", "Thu", "Chi", "Chuyển khoản", "Vay nợ"].map((label, index) => (
              <ToggleGroupItem key={label} value={index === 0 ? "all" : label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ChipRow>
      </Block>
      <Block label="ChipButton elevated · chip trên nền xám (thẻ ghi nhiều khoản của trợ lý)" wide>
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-field p-3">
          <ChipButton variant="elevated" active>
            <PlusIcon /> Kem
          </ChipButton>
          <ChipButton variant="elevated">Ăn sáng</ChipButton>
          <ChipButton variant="elevated">Khác…</ChipButton>
        </div>
      </Block>
      <Block label="Filter chip · chọn nhiều (ToggleGroup)" wide>
        <ToggleGroup type="multiple" size="sm" value={chosen} onValueChange={setChosen} className="flex-wrap">
          {filters.map((filter) => (
            <ToggleGroupItem key={filter} value={filter}>
              {chosen.includes(filter) ? <CheckIcon data-icon="inline-start" strokeWidth={2.5} /> : null}
              {filter}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-4 mb-2 text-xs text-muted-foreground">Chip viền, cho gợi ý số tiền</p>
        <ToggleGroup type="single" size="sm" variant="elevated" className="flex-wrap">
          <ToggleGroupItem value="25">25.000đ</ToggleGroupItem>
          <ToggleGroupItem value="50">50.000đ</ToggleGroupItem>
          <ToggleGroupItem value="100">100.000đ</ToggleGroupItem>
        </ToggleGroup>
      </Block>
      <Block label="Chip avatar · chip xoá được (Chip)">
        <div className="flex flex-wrap gap-2">
          {["Lan", "Huy"].map((name) => (
            <Chip
              key={name}
              media={
                <Avatar size="default" className="size-7">
                  <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
                </Avatar>
              }
            >
              {name}
            </Chip>
          ))}
          {tags.map((tag) => (
            <Chip key={tag} onRemove={() => setTags(tags.filter((item) => item !== tag))}>
              #{tag}
            </Chip>
          ))}
          {tags.length === 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setTags(["Công tác", "Gia đình", "Du lịch"])}>
              Khôi phục
            </Button>
          ) : null}
        </div>
      </Block>
      {/* The accounts page's lead on phones (2026-10-23): what the total holds aside as small chips. */}
      <Block label="Chip ghi chú (Chip size sm) · số dòng list (Money row)">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip size="sm" media={<LockIcon aria-hidden="true" />}>56,5tr đang khoá</Chip>
            <Chip size="sm" media={<EyeOffIcon aria-hidden="true" />}>850k ngoài báo cáo</Chip>
          </div>
          <Money amount={18_450_000} size="row" />
        </div>
      </Block>
      <Block label="Ô chanh đặc (IconTile accent, cỡ sm và xl)">
        <div className="flex items-center gap-4">
          <IconTile icon={PlusIcon} tone="accent" size="sm" />
          <IconTile icon={WalletIcon} tone="accent" size="xl" />
        </div>
      </Block>
      <Block label="Badge">
        <div className="flex flex-wrap items-center gap-5">
          {/* As on the notifications bell: on the icon's shoulder, cut out of it and of its button. */}
          {["3", "9+"].map((count) => (
            <Button key={count} size="icon" variant="elevated" aria-label={`Thông báo, ${count} chưa đọc`} className="relative">
              <BellIcon />
              <Badge variant="count" aria-hidden="true" className="absolute top-1 left-[calc(50%+4px)]">
                {count}
              </Badge>
            </Button>
          ))}
          <Button size="icon" variant="ghost" aria-label="Hộp thư, 1 chưa đọc" className="relative">
            <MailIcon />
            <Badge variant="count" aria-hidden="true" className="absolute top-1 left-[calc(50%+4px)]">
              1
            </Badge>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(
            [
              ["income", "Thành công"],
              ["warning", "Đang chờ"],
              ["expense", "Thất bại"],
              ["transfer", "Chuyển"],
              ["default", "Mới"],
            ] as const
          ).map(([variant, text]) => (
            <Badge key={variant} variant={variant}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {text}
            </Badge>
          ))}
          <Badge variant="ai">
            <SparklesIcon data-icon="inline-start" />
            AI
          </Badge>
          <Badge variant="secondary">+5</Badge>
          <Badge variant="soft">Free</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <DeltaBadge current={80} previous={100} goodWhen="down" comparedTo="tháng trước" />
          <DeltaBadge current={130} previous={100} goodWhen="down" comparedTo="tháng trước" />
        </div>
      </Block>
    </CatalogSection>
  )
}

function SegmentedSection() {
  const [kind, setKind] = React.useState("expense")
  const [period, setPeriod] = React.useState("week")
  const [align, setAlign] = React.useState("left")
  const [format, setFormat] = React.useState(["bold"])
  const [tab, setTab] = React.useState("all")

  return (
    <CatalogSection id="segmented">
      <Block label="Segmented (Tabs) · 2–4 lựa chọn" wide>
        <div className="space-y-3">
          <Tabs value={kind} onValueChange={setKind}>
            <TabsList className="w-full">
              <TabsTrigger value="expense">Chi tiền</TabsTrigger>
              <TabsTrigger value="income">Thu tiền</TabsTrigger>
              <TabsTrigger value="transfer">Chuyển khoản</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="w-full">
              <TabsTrigger value="day">Ngày</TabsTrigger>
              <TabsTrigger value="week">Tuần</TabsTrigger>
              <TabsTrigger value="month">Tháng</TabsTrigger>
              <TabsTrigger value="year">Năm</TabsTrigger>
            </TabsList>
          </Tabs>
          {/* variant="segmented": iOS's light control, inside a card over data (Tổng quan's categories); the block is that card. */}
          <div>
            <Tabs value={kind} onValueChange={setKind}>
              <TabsList variant="segmented" className="w-full">
                <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
                <TabsTrigger value="income">Thu nhập</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Block>
      <Block label="Chọn một · icon">
        <ToggleGroup
          type="single"
          variant="segmented"
          value={align}
          onValueChange={(value) => value && setAlign(value)}
          className="w-full"
          aria-label="Căn lề"
        >
          <ToggleGroupItem value="left" aria-label="Căn trái">
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Căn giữa">
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Căn phải">
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Block>
      <Block label="Chọn nhiều">
        <ToggleGroup type="multiple" value={format} onValueChange={setFormat} className="w-full" aria-label="Kiểu chữ">
          <ToggleGroupItem value="bold" aria-label="Đậm" className="flex-1">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Nghiêng" className="flex-1">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Gạch chân" className="flex-1">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Block>
      <Block label="Gạch chân (Tabs line)" wide>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
            <TabsTrigger value="income">Thu nhập</TabsTrigger>
          </TabsList>
        </Tabs>
      </Block>
    </CatalogSection>
  )
}

function SwitchSection() {
  const [settings, setSettings] = React.useState({ push: true, faceId: false, sync: true })
  const [checks, setChecks] = React.useState({ bills: true, salary: false, invest: true })
  const [currency, setCurrency] = React.useState("vnd")

  return (
    <CatalogSection id="switch">
      <Wide>
        <SettingsGroup title="Hàng cài đặt có switch" size="lg">
          <SettingsRow
            icon={BellRingIcon}
            tone="orange"
            title="Thông báo đẩy"
            description="Nhắc khi vượt ngân sách"
            action={
              <Switch
                aria-label="Thông báo đẩy"
                checked={settings.push}
                onCheckedChange={(push) => setSettings({ ...settings, push })}
              />
            }
          />
          <SettingsRow
            icon={FingerprintIcon}
            tone="lime"
            title="Face ID"
            description="Mở khoá nhanh"
            action={
              <Switch
                aria-label="Face ID"
                checked={settings.faceId}
                onCheckedChange={(faceId) => setSettings({ ...settings, faceId })}
              />
            }
          />
          <SettingsRow
            icon={RefreshCwIcon}
            tone="blue"
            title="Đồng bộ"
            description="Sao lưu tự động"
            action={
              <Switch
                aria-label="Đồng bộ"
                checked={settings.sync}
                onCheckedChange={(sync) => setSettings({ ...settings, sync })}
              />
            }
          />
        </SettingsGroup>
      </Wide>
      <Block label="Checkbox · vuông và tròn">
        <div className="space-y-3">
          {(
            [
              ["bills", "Hoá đơn", "square"],
              ["salary", "Lương", "circle"],
              ["invest", "Đầu tư", "square"],
            ] as const
          ).map(([key, text, shape]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <Checkbox
                shape={shape}
                checked={checks[key]}
                onCheckedChange={(checked) => setChecks({ ...checks, [key]: checked === true })}
              />
              {text}
            </label>
          ))}
        </div>
      </Block>
      <Block label="Radio">
        <RadioGroup value={currency} onValueChange={setCurrency} aria-label="Tiền tệ">
          {(
            [
              ["vnd", "VND"],
              ["usd", "USD"],
              ["eur", "EUR"],
            ] as const
          ).map(([value, text]) => (
            <label key={value} className="flex items-center gap-3 text-sm">
              <RadioGroupItem value={value} />
              {text}
            </label>
          ))}
        </RadioGroup>
      </Block>
    </CatalogSection>
  )
}
