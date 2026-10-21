"use client"

import * as React from "react"
import { ArrowUpDownIcon, BanknoteIcon, CheckIcon, MicIcon, SquareIcon, CreditCardIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, SearchIcon, UserIcon, WalletIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { ActionSheet } from "@/components/app/action-sheet"
import { Collapse } from "@/components/app/collapse"
import { DateStrip } from "@/components/app/date-strip"
import { IconTile } from "@/components/app/icon-tile"
import { InlineSelect } from "@/components/app/inline-select"
import { FormSection } from "@/components/app/form-section"
import { OtpInput } from "@/components/app/otp-input"
import { LimitBar } from "@/components/app/limit-bar"
import { LimitRow } from "@/components/app/limit-row"
import { ProgressRing } from "@/components/app/progress-ring"
import { Rating } from "@/components/app/rating"
import { RulerSlider } from "@/components/app/ruler-slider"
import { SegmentedProgress } from "@/components/app/steps"
import { Stepper } from "@/components/app/stepper"
import { ReplyView } from "@/components/ai-assistant/answer-view"
import { BudgetDailyChart, BudgetMonthsChart } from "@/components/budgets/budget-charts"
import { KeptMonths } from "@/components/budgets/kept-months"
import { BudgetInvite } from "@/components/budgets/budget-suggest"
import { BudgetResult, BudgetTotal } from "@/components/budgets/budget-total"
import { DraftsView } from "@/components/ai-assistant/drafts-view"
import type { Account } from "@/lib/accounts/types"
import type { AssistantDraft } from "@/lib/ai/assistant/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { BotIcon } from "@/components/app/bot-icon"
import { VoiceWave } from "@/components/app/voice-wave"
import { WheelPicker, WheelPickerGroup } from "@/components/app/wheel-picker"
import { ColorPicker } from "@/components/forms/color-picker"
import { CurrencyInput } from "@/components/forms/currency-input"
import { IconPicker } from "@/components/forms/icon-picker"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { limitTone, remainingLabel } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { categoryIconRegistry, type CategoryIconName } from "@/lib/icons/category-icon-registry"
import { formatCompactCurrency } from "@/lib/format-currency"

import { Block, BlockLabel, CatalogSection, Wide } from "./catalog-kit"

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest", label: "Số tiền cao nhất" },
  { value: "lowest", label: "Số tiền thấp nhất" },
] as const

const accounts = [
  {
    value: "tcb",
    label: "Techcombank",
    description: "•• 4821",
    meta: "12.480.000đ",
    media: <IconTile icon={CreditCardIcon} tone="transfer" size="sm" />,
  },
  {
    value: "momo",
    label: "Ví MoMo",
    description: "0912 ••• 678",
    meta: "1.250.000đ",
    media: <IconTile icon={WalletIcon} tone="pink" size="sm" />,
  },
  {
    value: "cash",
    label: "Tiền mặt",
    meta: "860.000đ",
    media: <IconTile icon={BanknoteIcon} tone="income" size="sm" />,
  },
]

const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"))
const minutes = Array.from({ length: 12 }, (_, step) => String(step * 5).padStart(2, "0"))

// A fixed week, so the server and the browser render the same days.
const week = Array.from({ length: 7 }, (_, offset) => new Date(2026, 9, 5 + offset))

export function InputSections() {
  return (
    <>
      <InputSection />
      <SelectSection />
      <SliderSection />
      <ProgressSection />
    </>
  )
}

function InputSection() {
  const [name, setName] = React.useState("Minh Anh")
  const [email, setEmail] = React.useState("minhanh@")
  const [password, setPassword] = React.useState("fina2026")
  const [showPassword, setShowPassword] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searching, setSearching] = React.useState(false)
  const [note, setNote] = React.useState("Ăn trưa cùng team")
  const [amount, setAmount] = React.useState<number | null>(250_000)
  const [code, setCode] = React.useState("38")
  const [owing, setOwing] = React.useState(true)
  const [when, setWhen] = React.useState({ date: "2026-10-07", time: "08:30" })

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const strength = Math.min(4, Math.ceil(password.length / 3))

  return (
    <CatalogSection id="input">
      {/* How a sheet's form is built (AGENTS.md): the fields in one FormSection, grey on its white card, the card lifted on the white sheet. */}
      <Wide>
        <BlockLabel className="px-1">Form trong sheet · FormSection gom các trường, ô xám trên thẻ trắng có bóng</BlockLabel>
        <FormSection title="Tài khoản" description="Số dư ban đầu tính từ ngày mở.">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ds-form-name">Tên</FieldLabel>
              <Input id="ds-form-name" defaultValue="Ví MoMo" />
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="ds-form-note">Ghi chú</FieldLabel>
              <Input id="ds-form-note" aria-invalid="true" defaultValue="Tiền tiêu vặt tháng 10 và tiền đi chợ của cả nhà, ghi dài quá" />
              <FieldError>Ghi chú tối đa 40 ký tự</FieldError>
            </Field>
            <Field data-disabled="true">
              <FieldLabel htmlFor="ds-form-currency">Tiền tệ</FieldLabel>
              <Input id="ds-form-currency" defaultValue="VND" disabled />
            </Field>
          </FieldGroup>
        </FormSection>
      </Wide>
      <Block label="Text field · icon và nút xoá">
        <Field>
          <FieldLabel htmlFor="ds-name">Họ tên</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <UserIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="ds-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nhập họ tên"
            />
            {name ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Xoá" onClick={() => setName("")}>
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </Field>
      </Block>
      <Block label="Tìm kiếm · cao 44, tròn như nút">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Tìm kiếm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm giao dịch, danh mục…"
          />
          {query ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={() => setQuery("")}>Huỷ</InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </Block>
      <Block label="Màn tìm (Collapse): khối trên thu gọn, Huỷ trượt ra khi chạm ô tìm">
        <div className="flex flex-col">
          <Collapse open={!searching}>
            <div className="mb-3 rounded-[16px] bg-muted p-4 text-sm text-muted-foreground">Đầu trang và thẻ tổng</div>
          </Collapse>
          <div className="flex items-center">
            <InputGroup className="min-w-0 flex-1">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput aria-label="Tìm (mẫu)" placeholder="Tìm giao dịch" onFocus={() => setSearching(true)} />
            </InputGroup>
            <Collapse open={searching} axis="x" className="shrink-0">
              <Button type="button" variant="ghost" className="ml-1 px-3" onClick={() => setSearching(false)}>
                Huỷ
              </Button>
            </Collapse>
          </div>
        </div>
      </Block>
      <Block label="Lỗi · hợp lệ · mật khẩu" wide>
        <FieldGroup>
          <Field data-invalid={!emailValid || undefined}>
            <FieldLabel htmlFor="ds-email">Email</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="ds-email"
                type="email"
                value={email}
                aria-invalid={!emailValid || undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
              {emailValid ? (
                <InputGroupAddon align="inline-end" className="text-income">
                  <CheckIcon strokeWidth={2.5} />
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            {emailValid ? (
              <FieldDescription>Email hợp lệ.</FieldDescription>
            ) : (
              <FieldError>Email chưa đúng định dạng, thử thêm .com</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-password">Mật khẩu</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <LockIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="ds-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <SegmentedProgress
              count={4}
              value={strength}
              tone={password.length > 9 ? "income" : "warning"}
              label="Độ mạnh mật khẩu"
            />
          </Field>
        </FieldGroup>
      </Block>
      <Block label="Textarea · đếm ký tự">
        <Field>
          <FieldLabel htmlFor="ds-note">Ghi chú</FieldLabel>
          <Textarea id="ds-note" value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} />
          <FieldDescription className="text-right tabular-nums">{note.length}/80</FieldDescription>
        </Field>
      </Block>
      <Block label="Số tiền · CurrencyInput và gợi ý">
        <Field>
          <FieldLabel htmlFor="ds-amount">Số tiền</FieldLabel>
          {/* Gõ 3: gợi ý 3.000, 30.000, 300.000…; lịch sử đưa các số hay dùng lên trước. */}
          <CurrencyInput id="ds-amount" name="amount" value={amount} onValueChange={setAmount} history={[50_000, 100_000, 50_000, 500_000]} />
        </Field>
      </Block>
      <Block label="Số tiền lớn · CurrencyInput variant=hero">
        {/* The screen's one amount, as the add-transaction sheet opens on it. */}
        <div className="flex flex-col items-center gap-2">
          <CurrencyInput variant="hero" id="ds-hero-amount" name="heroAmount" sign="−" history={[45_000, 32_000, 45_000]} />
        </div>
      </Block>
      <Block label="Số dư âm · hero với onNegativeChange (dấu đặt bằng công tắc)">
        <div className="flex flex-col items-center gap-2">
          <CurrencyInput
            variant="hero"
            id="ds-hero-balance"
            name="heroBalance"
            defaultValue={750_000}
            negative={owing}
            onNegativeChange={setOwing}
            suggestions={false}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setOwing((current) => !current)}>
            Đổi dấu
          </Button>
        </div>
      </Block>
      <Wide>
        <BlockLabel className="px-1">Thời gian trong nhóm dòng · TimeRows (chip ngày; quickDays=false thì không)</BlockLabel>
        <SettingsGroup>
          <TimeRows
            idPrefix="ds-time"
            date={when.date}
            time={when.time}
            today="2026-10-08"
            onDateChange={(date) => setWhen((current) => ({ ...current, date }))}
            onTimeChange={(time) => setWhen((current) => ({ ...current, time }))}
            invalid={false}
          />
          <TimeRows
            idPrefix="ds-start"
            title="Bắt đầu từ"
            quickDays={false}
            date={when.date}
            time={when.time}
            today="2026-10-08"
            onDateChange={(date) => setWhen((current) => ({ ...current, date }))}
            onTimeChange={(time) => setWhen((current) => ({ ...current, time }))}
            invalid={false}
          />
        </SettingsGroup>
      </Wide>
      <Block label="Mã OTP" wide>
        <OtpInput value={code} onValueChange={setCode} />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Gửi lại mã sau <span className="font-medium text-foreground tabular-nums">00:42</span>
        </p>
      </Block>
    </CatalogSection>
  )
}

function SelectSection() {
  const [account, setAccount] = React.useState("tcb")
  const [sort, setSort] = React.useState<string>("newest")
  const [sortOpen, setSortOpen] = React.useState(false)
  const [day, setDay] = React.useState(week[1])
  const [hour, setHour] = React.useState(8)
  const [categoryColor, setCategoryColor] = React.useState<CategoryColorName>("orange")
  const [categoryIcon, setCategoryIcon] = React.useState<CategoryIconName>("coffee")
  const [minute, setMinute] = React.useState(6)

  return (
    <CatalogSection id="select">
      <Block label="Dropdown tại chỗ (InlineSelect)">
        <Field>
          <FieldLabel>Tài khoản</FieldLabel>
          <InlineSelect options={accounts} value={account} onValueChange={setAccount} label="Tài khoản" />
        </Field>
      </Block>
      <Block label="Select · danh sách nổi, cho danh sách dài">
        <Field>
          <FieldLabel htmlFor="ds-account">Tài khoản</FieldLabel>
          <Select defaultValue="momo">
            <SelectTrigger id="ds-account" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Ví</SelectLabel>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="momo">Ví MoMo</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Ngân hàng</SelectLabel>
                <SelectItem value="tcb">Techcombank</SelectItem>
                <SelectItem value="vcb">Vietcombank</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </Block>
      <Wide>
        <SettingsGroup title="Action sheet" size="lg">
          <SettingsRow
            icon={ArrowUpDownIcon}
            title="Sắp xếp"
            value={sortOptions.find((option) => option.value === sort)?.label}
            onClick={() => setSortOpen(true)}
          />
        </SettingsGroup>
        <ActionSheet
          open={sortOpen}
          onOpenChange={setSortOpen}
          title="Sắp xếp theo"
          options={sortOptions}
          value={sort}
          onSelect={setSort}
        />
      </Wide>
      <Block label="Dải ngày · chấm là ngày có hoá đơn">
        <DateStrip days={week} value={day} onValueChange={setDay} marked={(date) => date.getDate() === 6} />
      </Block>
      <Block label={`Bánh xe · ${hours[hour]}:${minutes[minute]}`}>
        <WheelPickerGroup>
          <WheelPicker items={hours} value={hour} onValueChange={setHour} label="Giờ" />
          <span aria-hidden="true" className="relative text-xl font-medium">
            :
          </span>
          <WheelPicker items={minutes} value={minute} onValueChange={setMinute} label="Phút" />
        </WheelPickerGroup>
      </Block>
      <Block label="Màu và biểu tượng hạng mục (ColorPicker, IconPicker gợi ý theo tên)">
        <div className="flex flex-col gap-3">
          <ColorPicker value={categoryColor} onValueChange={setCategoryColor} />
          <IconPicker
            value={categoryIcon}
            color={categoryColor}
            name="Cà phê sáng"
            onValueChange={setCategoryIcon}
            onShowAll={() => toast("Mở tất cả biểu tượng")}
          />
        </div>
      </Block>
    </CatalogSection>
  )
}

function SliderSection() {
  const [share, setShare] = React.useState([62])
  const [range, setRange] = React.useState([200, 750])
  const [saving, setSaving] = React.useState(35)
  const [people, setPeople] = React.useState(2)
  const [stars, setStars] = React.useState(4)
  const thousands = (value: number) => `${value.toLocaleString("vi-VN")}K`

  return (
    <CatalogSection id="slider">
      <Block label="Slider · kéo để thấy giá trị">
        <div className="flex items-center justify-between text-sm">
          <span>Ngân sách ăn uống</span>
          <span className="font-medium tabular-nums">{share[0]}%</span>
        </div>
        <Slider value={share} onValueChange={setShare} formatValue={(value) => `${value}%`} aria-label="Ngân sách ăn uống" />
      </Block>
      <Block label="Range · khoảng số tiền">
        <div className="flex items-center justify-between text-sm font-medium tabular-nums">
          <span>{thousands(range[0])}</span>
          <span>{thousands(range[1])}</span>
        </div>
        <Slider
          value={range}
          onValueChange={setRange}
          max={1000}
          step={10}
          minStepsBetweenThumbs={5}
          formatValue={thousands}
          aria-label="Khoảng số tiền"
        />
      </Block>
      <Block label="Thước vạch (RulerSlider)" wide>
        <p className="text-center text-3xl font-medium tabular-nums">
          {saving}
          <span className="ml-1 text-base text-muted-foreground">%</span>
        </p>
        <RulerSlider value={saving} onValueChange={setSaving} label="Tỉ lệ tiết kiệm" />
      </Block>
      <Block label="Stepper">
        <Stepper value={people} onValueChange={setPeople} min={1} max={20} label="Số người chia tiền" />
        <p className="mt-2 text-center text-xs text-muted-foreground">Chia cho {people} người</p>
      </Block>
      <Block label="Đánh giá">
        <Rating value={stars} onValueChange={setStars} />
      </Block>
    </CatalogSection>
  )
}

/** A month's limits as they show (16/31 gone): the plain bar by tone, the rows, the whole month's lead figure. */
const sampleBudgets: BudgetOverview = {
  month: "2026-10",
  day: 16,
  daysInMonth: 31,
  total: { budgetId: "total", limit: 12_000_000, spent: 7_450_000, average: 10_900_000, fromJars: 0, adjustments: 0, adjust: null },
  groups: [],
  alerts: { enabled: true, level: 80 },
  kept: { history: [10_800_000, 12_900_000, 11_200_000, 11_500_000, 12_400_000, 11_600_000, 7_450_000], since: "2026-01", minMonth: "2026-01" },
}

/** Six months before October and October so far; spending by day in October (17 days gone, ahead of plan). */
const sampleHistory = [10_800_000, 12_900_000, 11_200_000, 11_500_000, 12_400_000, 11_600_000, 7_450_000]
const sampleDaily = Array.from({ length: 31 }, (_, index) => (index < 17 ? [320_000, 0, 180_000, 90_000, 260_000][index % 5] : 0))

/** No limit yet, three months of spending: what the invitation suggests from. */
const sampleInvite: BudgetOverview = {
  ...sampleBudgets,
  total: { budgetId: null, limit: null, spent: 7_450_000, average: 11_280_000, fromJars: 0, adjustments: 0, adjust: null },
  groups: (
    [
      ["housing", "Nhà cửa", "house", "emerald", 4_120_000],
      ["food", "Ăn uống", "utensils", "orange", 3_850_000],
      ["shopping", "Mua sắm", "shopping-bag", "pink", 1_640_000],
      ["transport", "Đi lại", "bus", "blue", 820_000],
    ] as const
  ).map(([groupId, name, iconName, colorName, average]) => ({
    groupId,
    name,
    iconName,
    colorName,
    budgetId: null,
    limit: null,
    spent: 0,
    average,
    fromJars: 0,
    adjustments: 0,
    adjust: null,
  })),
}

function LimitSample() {
  const rows = [
    { name: "Ăn uống", icon: "utensils", tone: "orange", spent: 3_420_000, limit: 4_000_000 },
    { name: "Mua sắm", icon: "shopping-bag", tone: "pink", spent: 2_250_000, limit: 2_000_000 },
    { name: "Đi lại", icon: "bus", tone: "blue", spent: 380_000, limit: 1_000_000 },
  ] as const
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-card">
          <LimitBar value={38} max={100} label="Dưới mốc báo sớm (80%)" />
          <LimitBar value={86} max={100} tone="near" label="Từ mốc báo sớm (80% hay 90%), hay đang chi nhanh" />
          <LimitBar value={113} max={100} tone="over" label="Đã vượt" />
          <LimitBar value={62} max={100} tone="near" size="md" label="Cỡ md, cho con số dẫn đầu" />
          <LimitBar value={45} max={100} color="#f97316" label="color: màu của hạng mục cho mức ok (Tổng quan)" />
        </div>
        <Card size="lg">
          <CardContent>
            <BudgetTotal overview={sampleBudgets} />
            <KeptMonths history={sampleHistory} limit={12_000_000} month="2026-10" minMonth="2026-01" since="2026-01" className="mt-4 border-t border-separator pt-3.5" />
          </CardContent>
        </Card>
        <Card size="lg">
          <CardContent>
            <BudgetResult spent={2_300_000} limit={2_000_000} label="Tháng 9 đã chi" />
          </CardContent>
        </Card>
        <Card size="lg">
          <CardContent>
            <BudgetInvite
              overview={sampleInvite}
              onSuggest={() => toast("Mở Đặt theo gợi ý")}
              onOwn={() => toast("Mở đặt hạn mức tổng")}
              onDismiss={() => toast("Ẩn trên máy này")}
            />
          </CardContent>
        </Card>
      </div>
      <Card size="lg">
        <CardContent>
          <BudgetDailyChart daily={sampleDaily} limit={4_000_000} month="2026-10" gone={17} past={false} />
        </CardContent>
      </Card>
      <Card size="lg">
        <CardContent>
          <BudgetMonthsChart history={sampleHistory} limit={12_000_000} month="2026-10" minMonth="2026-01" since="2026-01" past={false} />
        </CardContent>
      </Card>
      <SettingsGroup title="Theo nhóm · 3">
        {rows.map((row) => (
          <LimitRow
            key={row.name}
            media={<IconTile icon={categoryIconRegistry[row.icon]} tone={row.tone} size="sm" />}
            title={row.name}
            figure={
              <>
                <span className="font-semibold">{formatCompactCurrency(row.spent, 1)}</span>
                <span className="text-muted-foreground"> / {formatCompactCurrency(row.limit, 1)}</span>
              </>
            }
            value={row.spent}
            max={row.limit}
            tone={limitTone(row.spent, row.limit)}
            caption={remainingLabel(row.spent, row.limit, 16)}
            onClick={() => toast("Mở sửa hạn mức")}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}

function ProgressSection() {
  const [progress, setProgress] = React.useState(64)
  const [step, setStep] = React.useState(1)

  return (
    <CatalogSection id="progress">
      <Block label="Thanh và vòng tiến độ" wide>
        <div className="flex items-center gap-5">
          <ProgressRing value={Math.round((progress * 30) / 100)} max={30} label="triệu" />
          <ProgressRing size="xs" value={7} max={8} />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>Quỹ du lịch</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Quỹ du lịch" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setProgress(Math.max(0, progress - 12))}>
                −12%
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setProgress(Math.min(100, progress + 12))}>
                +12%
              </Button>
            </div>
          </div>
        </div>
      </Block>
      <Block label={`Phân đoạn · bước ${step + 1}/4`}>
        <SegmentedProgress count={4} value={step + 1} label="Tiến độ thiết lập" />
        <div className="mt-4 flex justify-between">
          <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Quay lại
          </Button>
          <Button size="sm" disabled={step === 3} onClick={() => setStep(step + 1)}>
            Tiếp
          </Button>
        </div>
      </Block>
      {/* Its cards sit on the page, not in a block's card (2026-10-21). */}
      <Wide>
        <BlockLabel className="px-1">Hạn mức · LimitBar, LimitRow, BudgetTotal, BudgetResult, BudgetInvite, KeptMonths, biểu đồ</BlockLabel>
        <LimitSample />
      </Wide>
      <Block label="Sóng giọng nói · khi ghi âm">
        <VoiceWaveSample />
      </Block>
      <Block label="Timi · BotIcon (chớp mắt khi rê/chạm, khi hiện ra, khi đang nghĩ)">
        <BotIconSample />
      </Block>
      <Block label="Trợ lý AI · thẻ trả lời (khối ghép theo câu hỏi)">
        <AssistantAnswerSample />
      </Block>
      <Block label="Trợ lý AI · ghi nhiều khoản (DraftsView): hạng mục mới có icon AI chọn và nhãn Mới, chip đổi hạng mục, một nút lưu cả">
        <AssistantDraftsSample />
      </Block>
      <Block label="Khung chờ · đang tải">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Spinner className="size-6" />
        </div>
        <Skeleton className="mt-4 h-20 rounded-2xl" />
      </Block>
    </CatalogSection>
  )
}

/** A made-up voice for the wave: syllables, phrases that rise and fall, a pause now and then. */
function sampleVoice(startedAt: number) {
  const t = (performance.now() - startedAt) / 1000
  const syllable = Math.abs(Math.sin(t * 9.5)) ** 1.5
  const phrase = 0.55 + 0.45 * Math.sin(t * 1.7)
  const pause = t % 4.2 > 3.4 ? 0.05 : 1
  return Math.min(1, 0.04 + syllable * phrase * pause * 0.9)
}

function VoiceWaveSample() {
  const [listening, setListening] = React.useState(true)
  const startedAt = React.useRef(0)
  const level = React.useCallback(() => (startedAt.current ? sampleVoice(startedAt.current) : 0), [])
  React.useEffect(() => {
    startedAt.current = listening ? performance.now() : 0
  }, [listening])
  return (
    <div className="space-y-3">
      <VoiceWave level={level} />
      <div className="flex justify-center">
        <Button size="sm" variant="secondary" onClick={() => setListening((value) => !value)}>
          {listening ? <SquareIcon /> : <MicIcon />}
          {listening ? "Dừng" : "Nói"}
        </Button>
      </div>
    </div>
  )
}

/** An answer as the assistant shows it: a figure, its change, and blocks picked for the question. */
const sampleAnswer: React.ComponentProps<typeof ReplyView>["reply"] = {
  kind: "answer",
  plan: {
    answerable: true,
    measure: "spending",
    view: "total",
    period: { preset: "this_month", days: null, months: null, month: null, year: null, from: null, to: null },
    compare: "previous",
    order: "most",
    groupIds: [],
    categoryIds: [],
    accountIds: [],
    contactIds: [],
    search: "",
    minAmount: null,
    maxAmount: null,
    onlyExcluded: false,
    debtStatus: "open",
    limit: null,
  },
  quota: { used: 3, limit: 15, credits: 0 },
  answer: {
    kicker: "Ăn uống · tháng 10 (1–11/10) so với 1–11/9",
    figure: { amount: 2_340_000, tone: "plain" },
    delta: { current: 2_340_000, previous: 2_090_000, goodWhen: "down", comparedTo: "1–11/9" },
    line: "Chi nhiều hơn 250.000đ",
    blocks: [
      {
        type: "compare",
        rows: [
          { label: "tháng 10 (1–11/10)", amount: 2_340_000, share: 100 },
          { label: "1–11/9", amount: 2_090_000, share: 89 },
        ],
      },
      {
        type: "rows",
        groups: [
          {
            rows: [
              { icon: { kind: "category", icon: "utensils", color: "orange" }, name: "Ăn trưa", sub: "+180.000đ so với 1–11/9", amount: -1_120_000, amountTone: "expense" },
              { icon: { kind: "category", icon: "coffee", color: "amber" }, name: "Cà phê", sub: "+90.000đ so với 1–11/9", amount: -540_000, amountTone: "expense" },
            ],
          },
        ],
      },
    ],
    followUps: ["Khoản nào lớn nhất?", "Xem các khoản"],
  },
}

function AssistantAnswerSample() {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-card p-5">
      <ReplyView said="" reply={sampleAnswer} ask={() => {}} listen={() => {}} onNavigate={() => {}} />
    </div>
  )
}

// A catalogue sample only: its save fails on these made-up ids, with a toast.
const sampleDraftGroups: CategoryGroup[] = [
  {
    id: "food",
    type: "expense",
    name: "Ăn uống",
    iconName: "utensils",
    colorName: "orange",
    items: [
      { id: "breakfast", groupId: "food", type: "expense", name: "Ăn sáng", iconName: "coffee", colorName: "orange" },
      { id: "lunch", groupId: "food", type: "expense", name: "Ăn trưa", iconName: "soup", colorName: "orange" },
    ],
  },
]
const sampleDraftAccounts = [
  { id: "cash", name: "Tiền mặt", type: "cash", openingBalance: 0, balance: 0, logoFallback: "TM", status: "active", excluded: false, linked: false, openedAt: "", updatedAt: "" },
] as Account[]
const sampleDrafts: AssistantDraft[] = [
  { id: "d1", kind: "expense", amount: 40_000, note: "", categoryId: "breakfast", accountId: "cash", date: "2026-10-12", time: "08:00", fee: 0, excluded: false },
  {
    id: "d2", kind: "expense", amount: 70_000, note: "", accountId: "cash", date: "2026-10-12", time: "15:00", fee: 0, excluded: false,
    suggestedCategory: { name: "Kem", groupName: "Ăn uống", groupId: "food", iconName: "ice-cream-cone" },
  },
  {
    id: "d3", kind: "expense", amount: 300_000, note: "", accountId: "cash", date: "2026-10-12", time: "19:00", fee: 0, excluded: false,
    suggestedCategory: { name: "Xem phim", groupName: "Giải trí", iconName: "film" },
  },
]

function AssistantDraftsSample() {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-card p-5">
      <DraftsView drafts={sampleDrafts} accounts={sampleDraftAccounts} categoryGroups={sampleDraftGroups} />
    </div>
  )
}

function BotIconSample() {
  const [shown, setShown] = React.useState(0)
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button>
        <BotIcon className="text-ai-on-primary" /> Rê hoặc chạm
      </Button>
      <Button variant="secondary" onClick={() => setShown((count) => count + 1)}>
        <BotIcon key={shown} blink="once" className="text-ai-strong" /> Hiện ra lại
      </Button>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <BotIcon blink="loop" className="size-5 text-ai-strong" /> Đang nghĩ
      </span>
    </div>
  )
}
