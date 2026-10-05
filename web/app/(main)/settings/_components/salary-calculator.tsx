"use client"

import * as React from "react"
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  PartyPopperIcon,
  TriangleAlertIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format-currency"
import {
  baseSalaryForTarget,
  calculateSalary,
  DEPENDANT_DEDUCTION,
  INSURANCE_CAP,
  MONTHLY_OVERTIME_LIMIT,
  netPerOvertimeHour,
  overtimeHoursForTarget,
  overtimeRates,
  regionalMinimumWages,
  SELF_DEDUCTION,
  type OvertimeKind,
  type Region,
  type SalaryInput,
} from "@/lib/salary/calculate"

/** What the form holds; numbers the user types stay as text until used. */
type Draft = {
  baseSalary: number | null
  taxableAllowances: number | null
  taxFreeAllowances: number | null
  insuranceSalary: number | null
  region: Region
  dependants: string
  standardDays: string
  unpaidLeaveDays: string
  hoursPerDay: string
  weekdayHours: string
  weekendHours: string
  holidayHours: string
  target: number | null
}

const emptyDraft: Draft = {
  baseSalary: null,
  taxableAllowances: null,
  taxFreeAllowances: null,
  insuranceSalary: null,
  region: 1,
  dependants: "0",
  standardDays: "22",
  unpaidLeaveDays: "0",
  hoursPerDay: "8",
  weekdayHours: "0",
  weekendHours: "0",
  holidayHours: "0",
  target: null,
}

// The last inputs, kept on this device only for convenience.
const STORAGE_KEY = "salary-calculator"

function loadDraft(): Draft {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? { ...emptyDraft, ...JSON.parse(saved) } : emptyDraft
  } catch {
    return emptyDraft
  }
}

function toNumber(value: string) {
  const number = Number(value.replace(",", "."))
  return Number.isFinite(number) && number > 0 ? number : 0
}

function toInput(draft: Draft): SalaryInput {
  return {
    baseSalary: draft.baseSalary ?? 0,
    taxableAllowances: draft.taxableAllowances ?? 0,
    taxFreeAllowances: draft.taxFreeAllowances ?? 0,
    insuranceSalary: draft.insuranceSalary,
    region: draft.region,
    dependants: Math.floor(toNumber(draft.dependants)),
    standardDays: toNumber(draft.standardDays) || 22,
    unpaidLeaveDays: toNumber(draft.unpaidLeaveDays),
    hoursPerDay: toNumber(draft.hoursPerDay) || 8,
    overtimeHours: {
      weekday: toNumber(draft.weekdayHours),
      weekend: toNumber(draft.weekendHours),
      holiday: toNumber(draft.holidayHours),
    },
  }
}

const regionNames: Record<Region, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" }

/** An amount taken off, e.g. "−3.150.000 đ"; nothing taken off shows as 0. */
function formatDeduction(amount: number) {
  return amount > 0 ? `−${formatCurrency(amount)}` : formatCurrency(0)
}

const overtimeOptions: { kind: OvertimeKind; label: string; icon: LucideIcon }[] = [
  { kind: "weekday", label: "Ngày thường", icon: BriefcaseIcon },
  { kind: "weekend", label: "Ngày nghỉ tuần", icon: CalendarDaysIcon },
  { kind: "holiday", label: "Ngày lễ, Tết", icon: PartyPopperIcon },
]

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })
}

function formatHours(hours: number) {
  return `${formatNumber(hours)} giờ`
}

function NumberField({
  id,
  label,
  description,
  value,
  onChange,
  decimal = false,
}: {
  id: string
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  decimal?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, "").slice(0, 6))
        }
        placeholder="0"
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

/** A caption, then the section's fields in a card; `after` goes below the card. */
function FormSection({
  title,
  after,
  children,
}: {
  title: string
  after?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
      </div>
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
      {after}
    </section>
  )
}

/** Net pay from salary, days worked, insurance, PIT and overtime, under Vietnamese rules. */
export function SalaryCalculator() {
  const [draft, setDraft] = React.useState<Draft>(loadDraft)
  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // Not remembered, e.g. in a private window.
    }
  }, [draft])

  const input = toInput(draft)
  const result = calculateSalary(input)
  const overtimeHours = input.overtimeHours.weekday + input.overtimeHours.weekend + input.overtimeHours.holiday
  const target = draft.target ?? 0
  const shortfall = target - result.netIncome
  // Each kind of overtime alone, on top of what is entered, to reach the target.
  const targetOptions = target > 0
    ? overtimeOptions.map((option) => ({
        ...option,
        hours: overtimeHoursForTarget(input, target, option.kind),
        perHour: netPerOvertimeHour(input, option.kind),
      }))
    : []
  const targetSalary = target > 0 && shortfall > 0 ? baseSalaryForTarget(input, target) : null

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Thực nhận</p>
            <p className="font-heading text-3xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]">
              {formatCurrency(result.netIncome)}
            </p>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tổng thu nhập</p>
              <p className="font-heading font-extrabold tabular-nums [overflow-wrap:anywhere]">
                {formatCurrency(result.grossIncome)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bảo hiểm</p>
              <p className="font-heading font-extrabold tabular-nums [overflow-wrap:anywhere]">
                {formatCurrency(result.insurance.total)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Thuế TNCN</p>
              <p className="font-heading font-extrabold tabular-nums [overflow-wrap:anywhere]">
                {formatCurrency(result.tax)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <FormSection title="Lương & phụ cấp">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="salary-base">Lương theo hợp đồng</FieldLabel>
            <CurrencyInput
              id="salary-base"
              name="baseSalary"
              value={draft.baseSalary}
              onValueChange={(value) => update("baseSalary", value)}
            />
            <FieldDescription>Lương gross của một tháng đủ công.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="salary-taxable-allowances">Phụ cấp chịu thuế</FieldLabel>
            <CurrencyInput
              id="salary-taxable-allowances"
              name="taxableAllowances"
              value={draft.taxableAllowances}
              onValueChange={(value) => update("taxableAllowances", value)}
            />
            <FieldDescription>Thưởng, phụ cấp trách nhiệm, xăng xe…</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="salary-tax-free-allowances">Phụ cấp không chịu thuế</FieldLabel>
            <CurrencyInput
              id="salary-tax-free-allowances"
              name="taxFreeAllowances"
              value={draft.taxFreeAllowances}
              onValueChange={(value) => update("taxFreeAllowances", value)}
            />
            <FieldDescription>Ăn ca, điện thoại, trang phục… trong mức được miễn.</FieldDescription>
          </Field>
        </FieldGroup>
      </FormSection>

      <FormSection title="Ngày công">
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="salary-standard-days"
              label="Công chuẩn"
              value={draft.standardDays}
              onChange={(value) => update("standardDays", value)}
              decimal
            />
            <NumberField
              id="salary-unpaid-days"
              label="Nghỉ không lương"
              value={draft.unpaidLeaveDays}
              onChange={(value) => update("unpaidLeaveDays", value)}
              decimal
            />
          </div>
          <NumberField
            id="salary-hours-per-day"
            label="Giờ làm mỗi ngày"
            description={`${result.workedDays.toLocaleString("vi-VN")} ngày công · ${formatCurrency(Math.round(result.hourlyRate))}/giờ`}
            value={draft.hoursPerDay}
            onChange={(value) => update("hoursPerDay", value)}
            decimal
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Bảo hiểm & thuế">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="salary-insurance">Lương đóng bảo hiểm</FieldLabel>
            <CurrencyInput
              id="salary-insurance"
              name="insuranceSalary"
              value={draft.insuranceSalary}
              onValueChange={(value) => update("insuranceSalary", value)}
              placeholder="Bằng lương hợp đồng"
            />
            <FieldDescription>
              Để trống nếu bằng lương hợp đồng. Tối đa {formatCurrency(INSURANCE_CAP)} cho BHXH, BHYT.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="salary-region">Vùng lương tối thiểu</FieldLabel>
            <Select
              value={String(draft.region)}
              onValueChange={(value) => update("region", Number(value) as Region)}
            >
              <SelectTrigger id="salary-region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(regionalMinimumWages) as `${Region}`[]).map((region) => (
                    <SelectItem key={region} value={region}>
                      Vùng {regionNames[Number(region) as Region]} · {formatCurrency(regionalMinimumWages[Number(region) as Region])}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>Quyết định mức trần đóng BHTN.</FieldDescription>
          </Field>
          <NumberField
            id="salary-dependants"
            label="Người phụ thuộc"
            description={`Giảm trừ ${formatCurrency(SELF_DEDUCTION)} cho bản thân và ${formatCurrency(DEPENDANT_DEDUCTION)} mỗi người phụ thuộc.`}
            value={draft.dependants}
            onChange={(value) => update("dependants", value)}
          />
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Tăng ca"
        after={
          overtimeHours > MONTHLY_OVERTIME_LIMIT ? (
            <SettingsGroup>
              <SettingsRow
                icon={TriangleAlertIcon}
                color="rose"
                title={`Vượt ${MONTHLY_OVERTIME_LIMIT} giờ tăng ca mỗi tháng`}
                description="Mức tối đa theo Bộ luật Lao động 2019."
              />
            </SettingsGroup>
          ) : null
        }
      >
        <FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              id="salary-ot-weekday"
              label="Ngày thường"
              value={draft.weekdayHours}
              onChange={(value) => update("weekdayHours", value)}
              decimal
            />
            <NumberField
              id="salary-ot-weekend"
              label="Nghỉ tuần"
              value={draft.weekendHours}
              onChange={(value) => update("weekendHours", value)}
              decimal
            />
            <NumberField
              id="salary-ot-holiday"
              label="Ngày lễ"
              value={draft.holidayHours}
              onChange={(value) => update("holidayHours", value)}
              decimal
            />
          </div>
          <FieldDescription>
            Số giờ trong tháng, hưởng 150%, 200% và 300% lương giờ. Phần trả thêm so với giờ thường không chịu thuế.
          </FieldDescription>
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Mục tiêu"
        after={
          target > 0 ? (
            // Set apart from the card like the page's other sections.
            <div className="space-y-6 pt-4">
              <SettingsGroup>
                <SettingsRow
                  icon={WalletIcon}
                  color={shortfall > 0 ? "amber" : "emerald"}
                  title={shortfall > 0 ? "Còn thiếu" : "Đã đạt mục tiêu"}
                  description={`Thực nhận hiện tại ${formatCurrency(result.netIncome)}`}
                  value={shortfall > 0 ? formatCurrency(shortfall) : `+${formatCurrency(-shortfall)}`}
                />
              </SettingsGroup>
              {shortfall > 0 ? (
                <SettingsGroup
                  title="Nếu chỉ tăng ca thêm"
                  footer={`Mỗi cách tính riêng, cộng vào số giờ đã nhập. Một ngày làm là ${formatNumber(input.hoursPerDay)} giờ; tăng ca tối đa ${MONTHLY_OVERTIME_LIMIT} giờ/tháng.`}
                >
                  {targetOptions.map(({ kind, label, icon, hours, perHour }) => {
                    const overLimit = hours !== null && overtimeHours + hours > MONTHLY_OVERTIME_LIMIT

                    return (
                      <SettingsRow
                        key={kind}
                        icon={overLimit ? TriangleAlertIcon : icon}
                        color={overLimit ? "rose" : "blue"}
                        title={`${label} · ${overtimeRates[kind] * 100}%`}
                        description={
                          hours === null
                            ? "Nhập lương theo hợp đồng để tính."
                            : `+${formatCurrency(perHour)}/giờ · khoảng ${formatNumber(hours / input.hoursPerDay)} ngày làm${overLimit ? " · vượt giới hạn" : ""}`
                        }
                        value={hours === null ? "—" : formatHours(hours)}
                      />
                    )
                  })}
                </SettingsGroup>
              ) : null}
              {targetSalary !== null ? (
                <SettingsGroup title="Hoặc không tăng ca">
                  <SettingsRow
                    icon={BriefcaseIcon}
                    color="emerald"
                    title="Lương hợp đồng cần"
                    description={`Cao hơn hiện tại ${formatCurrency(targetSalary - input.baseSalary)}`}
                    value={formatCurrency(targetSalary)}
                  />
                </SettingsGroup>
              ) : null}
            </div>
          ) : null
        }
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="salary-target">Muốn thực nhận</FieldLabel>
            <CurrencyInput
              id="salary-target"
              name="target"
              value={draft.target}
              onValueChange={(value) => update("target", value)}
            />
            <FieldDescription>
              Số giờ tăng ca hoặc mức lương cần để đạt số tiền này mỗi tháng.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FormSection>

      <SettingsGroup
        title="Chi tiết"
        footer="Theo quy định áp dụng từ 01/07/2026: lương cơ sở 2.530.000 đ, lương tối thiểu vùng theo Nghị định 293/2025, biểu thuế 5 bậc và mức giảm trừ gia cảnh của Luật Thuế TNCN 2025. Kết quả để tham khảo; cách tính ngày công, phụ cấp có thể khác theo công ty."
      >
        <SettingsRow title="Lương theo ngày công" value={formatCurrency(result.salaryForDays)} />
        <SettingsRow title="Phụ cấp" value={formatCurrency(input.taxableAllowances + input.taxFreeAllowances)} />
        <SettingsRow title="Tăng ca" value={formatCurrency(result.overtimePay)} />
        <SettingsRow title="Tổng thu nhập" value={formatCurrency(result.grossIncome)} />
        <SettingsRow title="BHXH (8%)" value={formatDeduction(result.insurance.social)} />
        <SettingsRow title="BHYT (1,5%)" value={formatDeduction(result.insurance.health)} />
        <SettingsRow title="BHTN (1%)" value={formatDeduction(result.insurance.unemployment)} />
        <SettingsRow title="Thu nhập chịu thuế" value={formatCurrency(result.taxableIncome)} />
        <SettingsRow title="Giảm trừ gia cảnh" value={formatDeduction(result.deductions)} />
        <SettingsRow title="Thu nhập tính thuế" value={formatCurrency(result.assessableIncome)} />
        <SettingsRow title="Thuế TNCN" value={formatDeduction(result.tax)} />
        <SettingsRow title="Thực nhận" value={formatCurrency(result.netIncome)} />
      </SettingsGroup>
    </div>
  )
}
