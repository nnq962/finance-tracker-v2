"use client"

import * as React from "react"
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  PartyPopperIcon,
  TargetIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { Money } from "@/components/app/money"
import { PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { Stepper } from "@/components/app/stepper"
import { CurrencyInput } from "@/components/forms/currency-input"
import { InlineInput } from "@/components/forms/inline-input"
import { SettingsFieldRow, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"
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
  type SalaryResult,
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
  unpaidLeaveDays: "",
  hoursPerDay: "8",
  weekdayHours: "",
  weekendHours: "",
  holidayHours: "",
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

/** An amount taken off, e.g. "−3.150.000đ"; nothing taken off shows as 0. */
function formatDeduction(amount: number) {
  return amount > 0 ? `−${formatCurrency(amount)}` : formatCurrency(0)
}

const overtimeOptions: {
  kind: OvertimeKind
  label: string
  /** The way to the target with more of these hours. */
  moreLabel: string
  draftKey: "weekdayHours" | "weekendHours" | "holidayHours"
  icon: LucideIcon
}[] = [
  { kind: "weekday", label: "Ngày thường", moreLabel: "Thêm giờ ngày thường", draftKey: "weekdayHours", icon: BriefcaseIcon },
  { kind: "weekend", label: "Ngày nghỉ tuần", moreLabel: "Thêm giờ ngày nghỉ tuần", draftKey: "weekendHours", icon: CalendarDaysIcon },
  { kind: "holiday", label: "Ngày lễ, Tết", moreLabel: "Thêm giờ ngày lễ, Tết", draftKey: "holidayHours", icon: PartyPopperIcon },
]

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })
}

/** Days or hours typed in place: digits, and a decimal point where halves make sense. */
function NumberInput({
  id,
  value,
  onChange,
  unit,
  placeholder = "0",
  decimal = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  unit: string
  placeholder?: string
  decimal?: boolean
}) {
  return (
    <InlineInput
      id={id}
      inputMode={decimal ? "decimal" : "numeric"}
      unit={unit}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, "").slice(0, 6))}
    />
  )
}

/**
 * Net pay from salary, days worked, insurance, PIT and overtime, under
 * Vietnamese rules. The gross salary is the screen's large amount; everything
 * else is set in place on rows. The net pay stays in the footer whatever is
 * being changed, and opens the payslip: where each đồng goes.
 */
export function SalaryCalculator() {
  const [draft, setDraft] = React.useState<Draft>(loadDraft)
  const [payslipOpen, setPayslipOpen] = React.useState(false)
  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  usePageSheetScreen(payslipOpen ? { title: "Bảng lương", onBack: () => setPayslipOpen(false) } : null)

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
  const targetOptions = target > 0 && shortfall > 0
    ? overtimeOptions.map((option) => ({
        ...option,
        hours: overtimeHoursForTarget(input, target, option.kind),
        perHour: netPerOvertimeHour(input, option.kind),
      }))
    : []
  const targetSalary = target > 0 && shortfall > 0 ? baseSalaryForTarget(input, target) : null

  return (
    <div className="flex flex-1 flex-col">
      {payslipOpen ? <Payslip input={input} result={result} /> : null}

      {/* Hidden, not removed, while the payslip shows: the fields keep their focus and scroll. */}
      <div hidden={payslipOpen} className="space-y-6">
        <div className="flex flex-col items-center gap-2 pt-2">
          <FieldLabel htmlFor="salary-base" className="text-xs font-normal text-muted-foreground">
            Lương gross mỗi tháng
          </FieldLabel>
          <CurrencyInput
            variant="hero"
            id="salary-base"
            name="baseSalary"
            value={draft.baseSalary}
            onValueChange={(value) => update("baseSalary", value)}
          />
          <p className="text-xs text-muted-foreground">
            {input.baseSalary > 0
              ? `${formatNumber(result.workedDays)} công · ${formatCurrency(Math.round(result.hourlyRate))}/giờ`
              : "Một tháng đủ công, trước bảo hiểm và thuế"}
          </p>
        </div>

        <SettingsGroup
          title="Phụ cấp"
          footer="Chịu thuế: thưởng, trách nhiệm, xăng xe… Không chịu thuế: ăn ca, điện thoại, trang phục… trong mức được miễn."
        >
          <SettingsFieldRow htmlFor="salary-taxable-allowances" title="Chịu thuế">
            <CurrencyInput
              variant="inline"
              id="salary-taxable-allowances"
              name="taxableAllowances"
              value={draft.taxableAllowances}
              onValueChange={(value) => update("taxableAllowances", value)}
            />
          </SettingsFieldRow>
          <SettingsFieldRow htmlFor="salary-tax-free-allowances" title="Không chịu thuế">
            <CurrencyInput
              variant="inline"
              id="salary-tax-free-allowances"
              name="taxFreeAllowances"
              value={draft.taxFreeAllowances}
              onValueChange={(value) => update("taxFreeAllowances", value)}
            />
          </SettingsFieldRow>
        </SettingsGroup>

        <SettingsGroup title="Ngày công">
          <SettingsFieldRow htmlFor="salary-standard-days" title="Công chuẩn">
            <NumberInput
              id="salary-standard-days"
              unit="ngày"
              placeholder="22"
              value={draft.standardDays}
              onChange={(value) => update("standardDays", value)}
              decimal
            />
          </SettingsFieldRow>
          <SettingsFieldRow htmlFor="salary-unpaid-days" title="Nghỉ không lương">
            <NumberInput
              id="salary-unpaid-days"
              unit="ngày"
              value={draft.unpaidLeaveDays}
              onChange={(value) => update("unpaidLeaveDays", value)}
              decimal
            />
          </SettingsFieldRow>
          <SettingsFieldRow htmlFor="salary-hours-per-day" title="Giờ làm mỗi ngày">
            <NumberInput
              id="salary-hours-per-day"
              unit="giờ"
              placeholder="8"
              value={draft.hoursPerDay}
              onChange={(value) => update("hoursPerDay", value)}
              decimal
            />
          </SettingsFieldRow>
        </SettingsGroup>

        <SettingsGroup
          title="Bảo hiểm và thuế"
          footer={`Giảm trừ ${formatCurrency(SELF_DEDUCTION)} cho bạn và ${formatCurrency(DEPENDANT_DEDUCTION)} mỗi người phụ thuộc. Vùng quyết định mức trần BHTN; BHXH, BHYT tính tối đa trên ${formatCurrency(INSURANCE_CAP)}.`}
        >
          <SettingsFieldRow title="Người phụ thuộc">
            <Stepper
              label="Người phụ thuộc"
              value={input.dependants}
              onValueChange={(value) => update("dependants", String(value))}
              max={20}
              className="w-32"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            title="Vùng"
            description={`Tối thiểu ${formatCurrency(regionalMinimumWages[draft.region])}`}
          >
            <ToggleGroup
              type="single"
              size="sm"
              value={String(draft.region)}
              onValueChange={(value) => {
                if (value) update("region", Number(value) as Region)
              }}
              aria-label="Vùng lương tối thiểu"
            >
              {(Object.keys(regionalMinimumWages) as `${Region}`[]).map((region) => (
                <ToggleGroupItem key={region} value={region} aria-label={`Vùng ${regionNames[Number(region) as Region]}`}>
                  {regionNames[Number(region) as Region]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </SettingsFieldRow>
          <SettingsFieldRow htmlFor="salary-insurance" title="Lương đóng BH">
            <CurrencyInput
              variant="inline"
              id="salary-insurance"
              name="insuranceSalary"
              value={draft.insuranceSalary}
              onValueChange={(value) => update("insuranceSalary", value)}
              placeholder="Như lương gross"
            />
          </SettingsFieldRow>
        </SettingsGroup>

        <SettingsGroup
          title="Tăng ca trong tháng"
          footer={`Tối đa ${MONTHLY_OVERTIME_LIMIT} giờ mỗi tháng. Phần trả thêm so với giờ thường không chịu thuế.`}
        >
          {overtimeOptions.map(({ kind, label, draftKey, icon }) => (
            <SettingsFieldRow
              key={kind}
              htmlFor={`salary-ot-${kind}`}
              icon={icon}
              title={label}
              description={`${overtimeRates[kind] * 100}% lương giờ`}
            >
              <NumberInput
                id={`salary-ot-${kind}`}
                unit="giờ"
                value={draft[draftKey]}
                onChange={(value) => update(draftKey, value)}
                decimal
              />
            </SettingsFieldRow>
          ))}
          <SettingsRow
            collapsed={overtimeHours <= MONTHLY_OVERTIME_LIMIT}
            icon={TriangleAlertIcon}
            tone="rose"
            title={`Vượt ${MONTHLY_OVERTIME_LIMIT} giờ mỗi tháng`}
            description="Mức tối đa theo Bộ luật Lao động 2019."
          />
        </SettingsGroup>

        <SettingsGroup title="Mục tiêu">
          <SettingsFieldRow htmlFor="salary-target" title="Muốn thực nhận">
            <CurrencyInput
              variant="inline"
              id="salary-target"
              name="target"
              value={draft.target}
              onValueChange={(value) => update("target", value)}
            />
          </SettingsFieldRow>
          <SettingsRow
            collapsed={target <= 0}
            icon={TargetIcon}
            tone={shortfall > 0 ? "amber" : "emerald"}
            title={shortfall > 0 ? "Còn thiếu" : "Đã đạt mục tiêu"}
            value={shortfall > 0 ? formatCurrency(shortfall) : `+${formatCurrency(-shortfall)}`}
          />
        </SettingsGroup>

        {targetOptions.length > 0 ? (
          <SettingsGroup
            title="Cách đạt · chọn một"
            footer={`Mỗi cách tính riêng, cộng vào số giờ đã nhập. Một ngày làm là ${formatNumber(input.hoursPerDay)} giờ.`}
          >
            {targetOptions.map(({ kind, moreLabel, icon, hours, perHour }) => {
              const overLimit = hours !== null && overtimeHours + hours > MONTHLY_OVERTIME_LIMIT

              return (
                <SettingsRow
                  key={kind}
                  icon={overLimit ? TriangleAlertIcon : icon}
                  tone={overLimit ? "rose" : undefined}
                  title={moreLabel}
                  description={
                    hours === null
                      ? "Nhập lương gross để tính."
                      : `${overLimit ? `Vượt ${MONTHLY_OVERTIME_LIMIT} giờ · ` : ""}khoảng ${formatNumber(hours / input.hoursPerDay)} ngày làm · +${formatCurrency(perHour)}/giờ`
                  }
                  // The row's answer: shown whole, the warning first.
                  fullDescription
                  value={hours === null ? "—" : `${formatNumber(hours)} giờ`}
                />
              )
            })}
            {targetSalary !== null ? (
              <SettingsRow
                icon={TrendingUpIcon}
                title="Hoặc tăng lương gross"
                description={`Thêm ${formatCurrency(targetSalary - input.baseSalary)}, không tăng ca`}
                fullDescription
                value={formatCurrency(targetSalary)}
              />
            ) : null}
          </SettingsGroup>
        ) : null}
      </div>

      {payslipOpen ? null : (
        <PageSheetFooter>
          {/* The answer, in reach whatever is being changed; it opens how it is reached. */}
          <Button type="button" className="justify-between" onClick={() => setPayslipOpen(true)}>
            <span>Thực nhận</span>
            <span className="flex items-center gap-1 tabular-nums">
              {formatCurrency(result.netIncome)}
              <ChevronRightIcon aria-hidden="true" />
            </span>
          </Button>
        </PageSheetFooter>
      )}
    </div>
  )
}

/** A share of the gross pay, e.g. "9,4%". */
function formatShare(part: number, whole: number) {
  return `${(whole > 0 ? (Math.max(part, 0) / whole) * 100 : 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`
}

/**
 * Where the gross pay goes: the net pay, a bar of it beside insurance and
 * tax, then each step from income to net, in the order a payslip has them.
 */
function Payslip({ input, result }: { input: SalaryInput; result: SalaryResult }) {
  const gross = result.grossIncome
  const shares = [
    { label: "Nhận", amount: result.netIncome, className: "bg-foreground" },
    { label: "Bảo hiểm", amount: result.insurance.total, className: "bg-warning" },
    { label: "Thuế", amount: result.tax, className: "bg-expense" },
  ]
  const overtimeHours = input.overtimeHours.weekday + input.overtimeHours.weekend + input.overtimeHours.holiday

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-2 text-center">
        <p className="text-base text-muted-foreground">Thực nhận</p>
        <Money amount={result.netIncome} size="xl" />
        <p className="text-xs text-muted-foreground">Từ tổng thu nhập {formatCurrency(gross)}</p>
      </div>

      <Card className="gap-3 px-4 py-4">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
          {gross > 0
            ? shares.map(({ label, amount, className }) =>
                amount > 0 ? <span key={label} className={cn("min-w-1", className)} style={{ flexGrow: amount }} /> : null,
              )
            : null}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {shares.map(({ label, amount, className }) => (
            <li key={label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", className)} />
              <span>
                {label} <span className="font-medium text-foreground tabular-nums">{formatShare(amount, gross)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <SettingsGroup title="Thu nhập">
        <SettingsRow
          title={`Lương ${formatNumber(result.workedDays)}/${formatNumber(input.standardDays)} công`}
          value={formatCurrency(result.salaryForDays)}
        />
        <SettingsRow title="Phụ cấp" value={formatCurrency(input.taxableAllowances + input.taxFreeAllowances)} />
        <SettingsRow
          title={overtimeHours > 0 ? `Tăng ca ${formatNumber(overtimeHours)} giờ` : "Tăng ca"}
          value={formatCurrency(result.overtimePay)}
        />
        <SettingsRow title="Tổng thu nhập" value={formatCurrency(gross)} />
      </SettingsGroup>

      <SettingsGroup title="Bảo hiểm">
        <SettingsRow title="BHXH (8%)" value={formatDeduction(result.insurance.social)} />
        <SettingsRow title="BHYT (1,5%)" value={formatDeduction(result.insurance.health)} />
        <SettingsRow title="BHTN (1%)" value={formatDeduction(result.insurance.unemployment)} />
      </SettingsGroup>

      <SettingsGroup
        title="Thuế TNCN"
        footer="Theo quy định áp dụng từ 01/07/2026: lương cơ sở 2.530.000đ, lương tối thiểu vùng theo Nghị định 293/2025, biểu thuế 5 bậc và mức giảm trừ gia cảnh của Luật Thuế TNCN 2025. Kết quả để tham khảo; cách tính ngày công, phụ cấp có thể khác theo công ty."
      >
        <SettingsRow title="Thu nhập chịu thuế" value={formatCurrency(result.taxableIncome)} />
        <SettingsRow
          title="Giảm trừ gia cảnh"
          description={input.dependants > 0 ? `Bạn và ${input.dependants} người phụ thuộc` : "Bản thân"}
          value={formatDeduction(result.deductions)}
        />
        <SettingsRow title="Thu nhập tính thuế" value={formatCurrency(result.assessableIncome)} />
        <SettingsRow title="Thuế TNCN" value={formatDeduction(result.tax)} />
      </SettingsGroup>
    </div>
  )
}
