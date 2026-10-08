"use client"

import * as React from "react"
import { ArrowUpDownIcon, BanknoteIcon, CheckIcon, CreditCardIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, SearchIcon, UserIcon, WalletIcon, XIcon } from "lucide-react"

import { ActionSheet } from "@/components/app/action-sheet"
import { Collapse } from "@/components/app/collapse"
import { DateStrip } from "@/components/app/date-strip"
import { IconTile } from "@/components/app/icon-tile"
import { InlineSelect } from "@/components/app/inline-select"
import { OtpInput } from "@/components/app/otp-input"
import { ProgressRing } from "@/components/app/progress-ring"
import { Rating } from "@/components/app/rating"
import { RulerSlider } from "@/components/app/ruler-slider"
import { SegmentedProgress } from "@/components/app/steps"
import { Stepper } from "@/components/app/stepper"
import { WheelPicker, WheelPickerGroup } from "@/components/app/wheel-picker"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
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

import { Block, CatalogSection, Wide } from "./catalog-kit"

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

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const strength = Math.min(4, Math.ceil(password.length / 3))

  return (
    <CatalogSection id="input">
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
            <div className="mb-3 rounded-2xl bg-card p-4 text-sm text-muted-foreground">Đầu trang và thẻ tổng</div>
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

function ProgressSection() {
  const [progress, setProgress] = React.useState(64)
  const [step, setStep] = React.useState(1)

  return (
    <CatalogSection id="progress">
      <Block label="Thanh và vòng tiến độ" wide>
        <div className="flex items-center gap-5">
          <ProgressRing value={Math.round((progress * 30) / 100)} max={30} label="triệu" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>Quỹ du lịch</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Quỹ du lịch" />
            </div>
            <div className="flex gap-2">
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
