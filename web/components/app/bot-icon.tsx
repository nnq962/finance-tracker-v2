import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * When the eyes blink:
 * - hover: as the button around it is hovered or pressed (a `group/button`)
 * - once: once, as it appears
 * - loop: now and then, a double blink, while LiuLiu thinks
 * - none: never
 */
type Blink = "hover" | "once" | "loop" | "none"

const eyes: Record<Blink, string> = {
  hover:
    "group-hover/button:animate-[bot-blink_0.45s_ease-in-out] group-active/button:animate-[bot-blink_0.45s_ease-in-out]",
  once: "animate-[bot-blink_0.45s_ease-in-out_0.25s]",
  loop: "animate-[bot-blink-idle_3.2s_ease-in-out_infinite]",
  none: "",
}

/**
 * LiuLiu's face (chosen 2026-10-11, after lucide-animated's Bot): Lucide's
 * bot, drawn as Lucide draws it so it sizes and aligns as any Lucide icon in
 * a button or a tile, with eyes that blink by CSS, shut to a dot and open
 * again. The sparkle stays for Pro and AI requests; the bot is the assistant.
 * Still when motion is reduced.
 */
export function BotIcon({
  blink = "hover",
  className,
  ...props
}: React.ComponentProps<"svg"> & { blink?: Blink }) {
  const eye = cn("origin-center [transform-box:fill-box] motion-reduce:animate-none", eyes[blink])
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("lucide lucide-bot", className)}
      {...props}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" className={eye} />
      <path d="M9 13v2" className={eye} />
    </svg>
  )
}
