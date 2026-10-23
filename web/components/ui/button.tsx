import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

import { Spinner } from "@/components/ui/spinner"

// Pressed, a button shrinks to 0.96 on its own layer (will-change, 2026-10-21):
// without it the browser lifted the button onto a layer as the press began
// and dropped it as it ended, redrawing the label and icon at a slightly
// different subpixel each time, so they nudged on every tap.
// Buttons are pills, as in native apps. Heights: 44px by default (the
// smallest comfortable touch target), 36 and 32 for compact places inside
// rows and headers, 48 for the main action at the end of a form.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[background-color,color,scale,box-shadow] duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 motion-safe:will-change-transform motion-safe:active:not-aria-[haspopup]:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        // Hover: a veil fading in over the button, not its background
        // fading: a background colour fading beside something redrawn every
        // frame (the voice wave) flickered in Chrome; the veil's opacity is
        // the compositor's.
        default:
          "relative isolate bg-primary text-primary-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-primary-foreground/15 after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-100 motion-reduce:after:transition-none",
        // The grey button (2026-10-21, the design system redone for the white
        // page): a thin ink fill, no edge, as iOS's grey buttons; for actions
        // inside content (half a sheet's footer, a card's or a banner's
        // action, an empty state). Outline, white with a hairline, is gone:
        // on the white page it read as this one, only weaker.
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-fill-3 active:bg-fill-3 aria-expanded:bg-fill-3",
        // A header's tools: the round ✕ ‹ ✎, the theme switch and the bell,
        // the month pill. Every header the same. Flat in the card's colour
        // (2026-10-24, on the grey page): a small piece of card, no edge and
        // no shadow; was white lifted by a short shadow (2026-10-21).
        elevated:
          "bg-card text-foreground hover:bg-[color-mix(in_oklab,var(--card),var(--foreground)_4%)] active:bg-[color-mix(in_oklab,var(--card),var(--foreground)_7%)] aria-expanded:bg-[color-mix(in_oklab,var(--card),var(--foreground)_7%)]",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        // Soft red (2026-10-21): Xoá beside Lưu, where saving is the main
        // action and deleting should not weigh as much.
        destructive:
          "bg-destructive/10 text-destructive-text hover:bg-destructive/15 active:bg-destructive/16 focus-visible:border-destructive/40 focus-visible:ring-destructive/30 dark:bg-destructive/18 dark:hover:bg-destructive/24 dark:active:bg-destructive/24",
        // Solid red, white text: the last step of something that cannot be
        // undone (delete the account, wipe the data). The veil darkens it on
        // hover; the fill is its own token, deeper in the dark theme.
        "destructive-solid":
          "relative isolate bg-destructive-fill text-destructive-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-black/10 after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-100 focus-visible:border-destructive/40 focus-visible:ring-destructive/30 motion-reduce:after:transition-none",
        // The AI's lime with ink (Hỏi AI in an answer).
        ai: "bg-ai text-ai-foreground hover:bg-ai/85 active:bg-ai/85",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Three sizes: L 56, M 44 (default, the height of a field), S 36.
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        // xs and the small icon sizes stretch their touch area to 44 with an invisible margin, as sm does.
        xs: "relative h-8 gap-1 px-3 text-xs after:absolute after:inset-x-0 after:-inset-y-1.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        // 36 tall, its touch area stretched to 44 by an invisible margin.
        sm: "relative h-9 gap-1.5 px-4 after:absolute after:inset-x-0 after:-inset-y-1 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-14 gap-2 px-7 text-base has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-11 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "relative size-8 after:absolute after:-inset-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "relative size-9 after:absolute after:-inset-1",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
        // A page's main action floating above the tab bar on phones.
        fab: "size-[60px] [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `loading` (2026-10-21): a spinner over the label, which stays (hidden) so
 * the button keeps its width; full strength rather than the disabled fade,
 * taps ignored, read out as busy.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const busy = loading && !asChild

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={busy || undefined}
      aria-busy={busy || undefined}
      aria-disabled={busy || props["aria-disabled"]}
      className={cn(buttonVariants({ variant, size, className }), busy && "pointer-events-none relative")}
      {...props}
    >
      {busy ? (
        <>
          <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
          <Spinner className="absolute inset-0 m-auto" />
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
