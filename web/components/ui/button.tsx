import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

import { Spinner } from "@/components/ui/spinner"

// Buttons are pills, as in native apps. Heights: 44px by default (the
// smallest comfortable touch target), 36 and 32 for compact places inside
// rows and headers, 48 for the main action at the end of a form.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[background-color,color,scale,box-shadow] duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 motion-safe:active:not-aria-[haspopup]:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        // Hover: a veil fading in over the button, not its background
        // fading: a background colour fading beside something redrawn every
        // frame (the voice wave) flickered in Chrome; the veil's opacity is
        // the compositor's.
        default:
          "relative isolate bg-primary text-primary-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-primary-foreground/15 after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-100 motion-reduce:after:transition-none",
        // A hairline inside the edge (2026-10-21): without it outline read as
        // ghost and link, three variants alike.
        outline:
          "bg-card shadow-[inset_0_0_0_1px_var(--separator)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.14)] hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        // Light: as outline, white with a hairline inside its edge (2026-10-21;
        // the light grey fill all but vanished on the white page, cards and
        // sheets). Dark: the field grey, which stands off black.
        secondary:
          "bg-card text-secondary-foreground shadow-[inset_0_0_0_1px_var(--separator)] hover:bg-muted aria-expanded:bg-muted aria-expanded:text-secondary-foreground dark:bg-field dark:shadow-none dark:hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_5%)] dark:aria-expanded:bg-field",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // Solid red, white text (2026-10-16): the pale red tint of before read
        // faded in both themes beside Save; the veil darkens it on hover. The
        // fill is its own token, deeper in the dark theme (2026-10-18).
        destructive:
          "relative isolate bg-destructive-fill text-destructive-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-black/10 after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-100 focus-visible:border-destructive/40 focus-visible:ring-destructive/30 motion-reduce:after:transition-none",
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
