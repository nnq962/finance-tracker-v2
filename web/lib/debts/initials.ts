/** A person's initials from their name, the first letters of its last two words: "Nguyễn Minh Tuấn" → "MT". */
export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}
