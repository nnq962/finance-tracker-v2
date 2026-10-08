import { cn } from "cn"

/**
 * A placeholder for content that is loading. Its fill is the surface's track
 * (see the surface-* utilities in globals.css), so it shows wherever it sits:
 * in the light theme a shade darker than the grey page and barely grey on a
 * white card, in the dark theme a shade lighter than either, and on an
 * inverse card the card's light text at 15%. The pulse stops under reduced
 * motion.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-2xl bg-track group-data-[variant=inverse]/card:bg-inverse-foreground/15 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
