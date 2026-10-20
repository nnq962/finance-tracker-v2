import { TimiIcon } from "@/components/timi-icon"

/**
 * A push as the phone shows it on the lock screen: Timi's icon, the title in
 * semibold with "bây giờ" across from it, the body under it up to four
 * lines. For previewing a notice before it is sent (Quản trị › Gửi thông
 * báo); empty fields show what goes there.
 */
export function PushBanner({ title, body, time = "bây giờ" }: { title: string; body: string; time?: string }) {
  return (
    <div className="flex gap-3 rounded-[20px] bg-card p-3 shadow-card">
      <TimiIcon size={36} className="size-9 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title || "Tiêu đề"}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="line-clamp-4 text-sm text-foreground/80">{body || "Nội dung thông báo"}</p>
      </div>
    </div>
  )
}
