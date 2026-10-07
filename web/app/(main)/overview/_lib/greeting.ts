import { formatTime } from "@/lib/format-date"

/** By the hour in Vietnam. */
export function greetingFor(now: Date) {
  const hour = Number(formatTime(now).slice(0, 2))
  if (hour >= 4 && hour < 11) return "Chào buổi sáng"
  if (hour >= 11 && hour < 13) return "Chào buổi trưa"
  if (hour >= 13 && hour < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

/** The first letters of the last two words, for an avatar without a picture. */
export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}
