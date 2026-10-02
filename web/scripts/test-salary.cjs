/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness transpiles TypeScript modules before loading them. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const ts = require('typescript')

// Resolve the app's "@/" imports from the web root, as Next.js does.
const originalLoad = Module._load
Module._load = function (id, parent, main) {
  return originalLoad.call(this, id.startsWith('@/') ? path.join(__dirname, '..', id.slice(2)) : id, parent, main)
}

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText,
  filename,
)

const {
  calculateSalary,
  calculateTax,
  overtimeHoursForTarget,
} = require('../lib/salary/calculate.ts')

const base = {
  baseSalary: 30_000_000,
  taxableAllowances: 0,
  taxFreeAllowances: 0,
  insuranceSalary: null,
  region: 1,
  dependants: 0,
  standardDays: 22,
  unpaidLeaveDays: 0,
  hoursPerDay: 8,
  overtimeHours: { weekday: 0, weekend: 0, holiday: 0 },
}

// Progressive tax, bracket by bracket.
assert.equal(calculateTax(0), 0)
assert.equal(calculateTax(10_000_000), 500_000)
assert.equal(calculateTax(30_000_000), 2_500_000)
assert.equal(calculateTax(60_000_000), 8_500_000)
assert.equal(calculateTax(100_000_000), 20_500_000)
assert.equal(calculateTax(120_000_000), 27_500_000)

// 30M: 10.5% insurance, then 30 − 3.15 − 15.5 = 11.35M assessed.
{
  const result = calculateSalary(base)
  assert.equal(result.insurance.total, 3_150_000)
  assert.equal(result.assessableIncome, 11_350_000)
  assert.equal(result.tax, 635_000)
  assert.equal(result.netIncome, 26_215_000)
}

// 120M: social and health capped at 50.6M, unemployment at 106.2M (region I).
{
  const result = calculateSalary({ ...base, baseSalary: 120_000_000 })
  assert.equal(result.insurance.social, 4_048_000)
  assert.equal(result.insurance.health, 759_000)
  assert.equal(result.insurance.unemployment, 1_062_000)
  assert.equal(result.tax, 20_089_300)
  assert.equal(result.netIncome, 94_041_700)
}

// Dependants and a lower insurance salary.
{
  const result = calculateSalary({ ...base, insuranceSalary: 10_000_000, dependants: 2 })
  assert.equal(result.insurance.total, 1_050_000)
  // 30 − 1.05 − 15.5 − 12.4 = 1.05M assessed.
  assert.equal(result.tax, 52_500)
}

// Unpaid leave pays the days worked; overtime's premium is tax free.
{
  const result = calculateSalary({
    ...base,
    baseSalary: 22_000_000,
    unpaidLeaveDays: 2,
    overtimeHours: { weekday: 10, weekend: 0, holiday: 0 },
  })
  assert.equal(result.workedDays, 20)
  assert.equal(result.salaryForDays, 20_000_000)
  assert.equal(result.hourlyRate, 125_000)
  assert.equal(result.overtimePay, 1_875_000)
  assert.equal(result.overtimeTaxFree, 625_000)
  assert.equal(result.taxableIncome, 21_250_000)
}

// Below the deduction no tax is due; tax-free allowances are added untaxed.
{
  const result = calculateSalary({ ...base, baseSalary: 12_000_000, taxFreeAllowances: 730_000 })
  assert.equal(result.tax, 0)
  assert.equal(result.netIncome, 12_000_000 - 1_260_000 + 730_000)
}

// Overtime for a target: the fewest half hours that reach it.
{
  const net = calculateSalary(base).netIncome
  assert.equal(overtimeHoursForTarget(base, net), 0)
  const hours = overtimeHoursForTarget(base, net + 2_000_000)
  const withHours = (h) => calculateSalary({ ...base, overtimeHours: { ...base.overtimeHours, weekday: h } }).netIncome
  assert.ok(withHours(hours) >= net + 2_000_000)
  assert.ok(withHours(hours - 0.5) < net + 2_000_000)
  assert.equal(overtimeHoursForTarget({ ...base, baseSalary: 0 }, 1), null)
}

console.log('Salary checks passed.')
