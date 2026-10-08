/**
 * A random UUID (v4), e.g. a request's id so a retry is recorded once.
 * crypto.randomUUID exists only in secure contexts (HTTPS, localhost), so on
 * the dev server opened by its LAN address it is missing and calling it threw;
 * getRandomValues works everywhere, and builds the same kind of id there.
 */
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
