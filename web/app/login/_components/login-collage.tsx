import { ArrowDownLeftIcon, SoupIcon, SparklesIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The sign-in page's picture: the app's own blocks with made-up figures,
 * laid over each other and slightly turned (the net worth card, the money in
 * tile, a lunch written with AI), so it shows what the app is as it will
 * look. A drawing: inert and hidden from screen readers.
 */
export function LoginCollage({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" inert className={cn("pointer-events-none relative mx-auto h-[19rem] w-full max-w-[22rem] select-none", className)}>
      <Card variant="inverse" size="lg" className="absolute inset-x-2 top-0 -rotate-3 shadow-[0_20px_50px_rgb(0_0_0/0.18)]">
        <CardContent>
          <CardLabel>Tài sản ròng</CardLabel>
          <Money amount={55_103_000} size="xl" className="mt-1.5" />
          <p className="mt-1.5 flex items-center gap-1.5 text-sm">
            <span className="rounded-full bg-ai px-2 py-0.5 text-xs font-bold text-ai-foreground tabular-nums">+3,2tr</span>
            <CardLabel as="span">tháng này</CardLabel>
          </p>
        </CardContent>
      </Card>
      <div className="absolute top-40 left-0 flex w-36 rotate-2 flex-col gap-4 rounded-[24px] bg-ai p-4 text-ai-foreground shadow-[0_20px_50px_rgb(0_0_0/0.15)]">
        <span className="flex items-center justify-between text-sm text-ai-foreground/60">
          Tiền vào
          <span className="flex size-8 items-center justify-center rounded-full bg-ai-foreground text-ai">
            <ArrowDownLeftIcon className="size-4" />
          </span>
        </span>
        <Money amount={18_000_000} size="md" sign="always" />
      </div>
      <Card className="absolute top-48 right-0 w-54 -rotate-1 shadow-[0_20px_50px_rgb(0_0_0/0.12)]">
        <CardContent className="flex flex-col gap-3">
          <span className="flex items-center gap-3">
            <IconTile icon={SoupIcon} tone="orange" size="sm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">Ăn trưa</span>
              <span className="text-xs text-muted-foreground">MoMo</span>
            </span>
            <Money amount={-45_000} size="sm" sign="always" />
          </span>
          <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs">
            <SparklesIcon className="size-3.5 text-ai-strong" />
            “ăn trưa 45k momo”
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
