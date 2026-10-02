// Vietnamese payroll for an employee on a labour contract, as of 1 July 2026.
//
// - Insurance (employee's share): social 8%, health 1.5%, unemployment 1%.
//   Social and health are capped at 20× the base salary (lương cơ sở,
//   2,530,000 from 1/7/2026); unemployment at 20× the regional minimum wage
//   (Decree 293/2025, from 1/1/2026).
// - Personal income tax: the 5-bracket progressive schedule and the family
//   deductions (15.5M for oneself, 6.2M per dependant) of the 2025 PIT law,
//   applied from the 2026 tax period.
// - Overtime (Labour Code 2019, art. 98): 150% on working days, 200% on
//   weekly days off, 300% on public holidays. The part above normal pay is
//   exempt from PIT. At most 40 hours a month (art. 107).

export const BASE_SALARY = 2_530_000
export const INSURANCE_CAP = 20 * BASE_SALARY
export const SELF_DEDUCTION = 15_500_000
export const DEPENDANT_DEDUCTION = 6_200_000
export const MONTHLY_OVERTIME_LIMIT = 40

export const regionalMinimumWages = {
  1: 5_310_000,
  2: 4_730_000,
  3: 4_140_000,
  4: 3_700_000,
} as const

export type Region = keyof typeof regionalMinimumWages

export const insuranceRates = {
  social: 0.08,
  health: 0.015,
  unemployment: 0.01,
} as const

/** Upper bound of each bracket's taxable income per month, and its rate. */
export const taxBrackets = [
  { upTo: 10_000_000, rate: 0.05 },
  { upTo: 30_000_000, rate: 0.1 },
  { upTo: 60_000_000, rate: 0.2 },
  { upTo: 100_000_000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
] as const

export const overtimeRates = {
  weekday: 1.5,
  weekend: 2,
  holiday: 3,
} as const

export type OvertimeKind = keyof typeof overtimeRates

export type SalaryInput = {
  /** Contract salary for a full month. */
  baseSalary: number
  taxableAllowances: number
  /** E.g. meals or phone, where they qualify; added to pay, never taxed. */
  taxFreeAllowances: number
  /** Salary insurance is paid on; null means the contract salary. */
  insuranceSalary: number | null
  region: Region
  dependants: number
  standardDays: number
  unpaidLeaveDays: number
  hoursPerDay: number
  overtimeHours: Record<OvertimeKind, number>
}

export type SalaryResult = {
  workedDays: number
  hourlyRate: number
  salaryForDays: number
  overtimePay: number
  overtimeTaxFree: number
  grossIncome: number
  insurance: Record<keyof typeof insuranceRates, number> & { total: number }
  deductions: number
  taxableIncome: number
  assessableIncome: number
  tax: number
  netIncome: number
}

export function calculateTax(assessableIncome: number) {
  let tax = 0
  let lower = 0

  for (const { upTo, rate } of taxBrackets) {
    if (assessableIncome <= lower) break
    tax += (Math.min(assessableIncome, upTo) - lower) * rate
    lower = upTo
  }

  return Math.round(tax)
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const standardDays = Math.max(input.standardDays, 1)
  const workedDays = Math.min(Math.max(standardDays - input.unpaidLeaveDays, 0), standardDays)
  const hourlyRate = input.baseSalary / standardDays / Math.max(input.hoursPerDay, 1)
  const salaryForDays = Math.round(input.baseSalary * workedDays / standardDays)

  const overtimeKinds = Object.keys(overtimeRates) as OvertimeKind[]
  const overtimePay = Math.round(overtimeKinds.reduce(
    (total, kind) => total + hourlyRate * input.overtimeHours[kind] * overtimeRates[kind],
    0,
  ))
  // Only the normal pay for those hours is taxed.
  const overtimeNormalPay = Math.round(overtimeKinds.reduce(
    (total, kind) => total + hourlyRate * input.overtimeHours[kind],
    0,
  ))
  const overtimeTaxFree = overtimePay - overtimeNormalPay

  const insuranceSalary = input.insuranceSalary ?? input.baseSalary
  const capped = Math.min(insuranceSalary, INSURANCE_CAP)
  const unemploymentCapped = Math.min(insuranceSalary, 20 * regionalMinimumWages[input.region])
  const insurance = {
    social: Math.round(capped * insuranceRates.social),
    health: Math.round(capped * insuranceRates.health),
    unemployment: Math.round(unemploymentCapped * insuranceRates.unemployment),
  }
  const insuranceTotal = insurance.social + insurance.health + insurance.unemployment

  const grossIncome = salaryForDays + input.taxableAllowances + input.taxFreeAllowances + overtimePay
  const taxableIncome = grossIncome - input.taxFreeAllowances - overtimeTaxFree
  const deductions = SELF_DEDUCTION + input.dependants * DEPENDANT_DEDUCTION
  const assessableIncome = Math.max(taxableIncome - insuranceTotal - deductions, 0)
  const tax = calculateTax(assessableIncome)

  return {
    workedDays,
    hourlyRate,
    salaryForDays,
    overtimePay,
    overtimeTaxFree,
    grossIncome,
    insurance: { ...insurance, total: insuranceTotal },
    deductions,
    taxableIncome,
    assessableIncome,
    tax,
    netIncome: grossIncome - insuranceTotal - tax,
  }
}

/**
 * Extra overtime hours of `kind`, on top of those entered, for the net pay to
 * reach `target`, in half hours; 0 when it already does, null when no amount
 * of overtime would (no hourly rate).
 */
export function overtimeHoursForTarget(input: SalaryInput, target: number, kind: OvertimeKind = "weekday") {
  const netWith = (extra: number) => calculateSalary({
    ...input,
    overtimeHours: { ...input.overtimeHours, [kind]: input.overtimeHours[kind] + extra },
  }).netIncome

  if (netWith(0) >= target) return 0
  if (input.baseSalary <= 0) return null

  // Net pay rises with every hour, so search the half hours.
  let low = 0
  let high = 1
  while (netWith(high / 2) < target) {
    high *= 2
    if (high > 1_000_000) return null
  }
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (netWith(middle / 2) >= target) high = middle
    else low = middle
  }

  return high / 2
}
