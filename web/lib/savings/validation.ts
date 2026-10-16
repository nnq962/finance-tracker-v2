import "server-only"

import { AccountValidationError } from "@/lib/accounts/validation"
import { toDateKey } from "@/lib/format-date"
import { MAX_MONEY } from "@/lib/money"
import { isJarColorName, isJarIconName } from "@/lib/savings/jar-icons"
import { lastDayOfMonth } from "@/lib/savings/plan"

export type JarFormValues = {
  name: string
  icon: string
  color: string
  target: number
  /** "YYYY-MM-DD", the due month's last day. */
  due?: string
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

/**
 * A jar's name, what it is for, how much and by which month (none, or this
 * month or later). `keepDue`: editing, the jar's own due day, which may stay
 * even once its month has passed (2026-10-16: an overdue jar could not be
 * renamed); only a new due month must be from this one on.
 */
export function parseJarFormData(formData: FormData, keepDue?: string | null): JarFormValues {
  const name = getText(formData, "name")
  if (!name) throw new AccountValidationError("Nhập tên hũ.")
  if (name.length > 80) throw new AccountValidationError("Tên hũ không được vượt quá 80 ký tự.")

  const icon = getText(formData, "icon")
  if (!isJarIconName(icon)) throw new AccountValidationError("Biểu tượng không hợp lệ.")

  const color = getText(formData, "color")
  if (!isJarColorName(color)) throw new AccountValidationError("Màu không hợp lệ.")

  const target = Number(getText(formData, "target"))
  if (!Number.isSafeInteger(target) || target <= 0 || target > MAX_MONEY) {
    throw new AccountValidationError("Mục tiêu không hợp lệ.")
  }

  const month = getText(formData, "dueMonth")
  if (!month) return { name, icon, color, target }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new AccountValidationError("Hạn không hợp lệ.")
  const kept = keepDue?.slice(0, 7) === month
  if (!kept && month < toDateKey(new Date()).slice(0, 7)) throw new AccountValidationError("Hạn phải từ tháng này trở đi.")
  if (month > "2100-12") throw new AccountValidationError("Hạn không hợp lệ.")
  return { name, icon, color, target, due: lastDayOfMonth(month) }
}
