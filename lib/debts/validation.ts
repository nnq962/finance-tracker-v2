import { todayDate } from "./calculations"
import type { NewContact, NewDebt, NewDebtPayment } from "./types"

export const MAX_MONEY = 999_999_999_999_999

export class DebtValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DebtValidationError"
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DebtValidationError("Dữ liệu không hợp lệ.")
  }
  return value as Record<string, unknown>
}

export function assertDebtId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new DebtValidationError("Mã dữ liệu không hợp lệ.")
  }
}

function id(value: unknown) {
  assertDebtId(value)
  return value
}

function text(value: unknown, label: string, length: number, required = false) {
  if (value === undefined && !required) return ""
  if (typeof value !== "string" || value.trim().length > length || (required && !value.trim())) {
    throw new DebtValidationError(`${label} ${required ? "bắt buộc và " : ""}không được dài quá ${length} ký tự.`)
  }
  return value.trim()
}

function money(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > MAX_MONEY) {
    throw new DebtValidationError("Số tiền phải là số nguyên từ 1 đến 999.999.999.999.999đ.")
  }
  return value
}

function date(value: unknown, label: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value < "1900-01-01") {
    throw new DebtValidationError(`${label} không hợp lệ.`)
  }
  return value
}

export function parseContact(value: unknown): NewContact {
  const input = object(value)
  return {
    name: text(input.name, "Tên", 80, true),
    relationship: text(input.relationship, "Mối quan hệ", 80),
    phone: text(input.phone, "Số điện thoại", 30),
    note: text(input.note, "Ghi chú", 500),
  }
}

export function parseDebt(value: unknown): NewDebt {
  const input = object(value)
  if (input.direction !== "lent" && input.direction !== "borrowed") throw new DebtValidationError("Loại khoản nợ không hợp lệ.")
  if (typeof input.hasInterest !== "boolean") throw new DebtValidationError("Thiết lập lãi suất không hợp lệ.")
  if (input.paidAmount !== undefined && input.paidAmount !== 0) throw new DebtValidationError("Hãy ghi nhận thanh toán sau khi tạo khoản nợ.")
  const recordedAt = date(input.recordedAt, "Ngày ghi")
  if (recordedAt > todayDate()) throw new DebtValidationError("Ngày ghi không được sau hôm nay.")
  const dueAt = input.dueAt ? date(input.dueAt, "Hẹn trả") : undefined
  if (dueAt && dueAt < recordedAt) throw new DebtValidationError("Hẹn trả phải từ ngày ghi trở đi.")
  let interestRate: number | undefined
  let interestPeriod: "month" | "year" | undefined
  if (input.hasInterest) {
    if (typeof input.interestRate !== "number" || !Number.isFinite(input.interestRate) || input.interestRate <= 0 || input.interestRate > 100 || Math.abs(input.interestRate * 100 - Math.round(input.interestRate * 100)) > 1e-8) throw new DebtValidationError("Lãi suất phải lớn hơn 0, tối đa 100%, với tối đa 2 chữ số thập phân.")
    if (input.interestPeriod !== "month" && input.interestPeriod !== "year") throw new DebtValidationError("Chu kỳ lãi không hợp lệ.")
    interestRate = input.interestRate
    interestPeriod = input.interestPeriod
  }
  return {
    contactId: id(input.contactId), accountId: id(input.accountId), direction: input.direction,
    amount: money(input.amount), paidAmount: 0, hasInterest: input.hasInterest,
    interestRate, interestPeriod, recordedAt, dueAt, note: text(input.note, "Nội dung", 500, true),
  }
}

export function parsePayment(value: unknown): NewDebtPayment {
  const input = object(value)
  const paidAt = date(input.paidAt, "Ngày thanh toán")
  if (paidAt > todayDate()) throw new DebtValidationError("Ngày thanh toán không được sau hôm nay.")
  const paidTime = text(input.paidTime, "Giờ thanh toán", 5)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(paidTime)) throw new DebtValidationError("Giờ thanh toán không hợp lệ.")
  return { amount: money(input.amount), accountId: id(input.accountId), paidAt, paidTime, note: text(input.note, "Ghi chú", 500) }
}
