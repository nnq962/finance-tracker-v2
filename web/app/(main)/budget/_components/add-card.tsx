import { PlusIcon } from "lucide-react"

/**
 * The last cell of a grid of cards (desktop): a dashed outline the size of
 * the cards beside it, a + and what it adds ("Thêm tài khoản", "Thêm hũ").
 * Where the header's button used to be, until 2026-10-14.
 */
export function AddCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex min-h-36 flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-foreground/15 text-sm font-medium text-muted-foreground transition-[scale,color,background-color,border-color] outline-none hover:border-foreground/30 hover:bg-card/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-fill-1 text-foreground [&_svg]:size-5">
        <PlusIcon />
      </span>
      {label}
    </button>
  )
}
