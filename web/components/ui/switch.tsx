"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onClick,
  onBlur,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  const [pressed, setPressed] = React.useState(false)
  const releaseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearReleaseTimer = () => {
    if (releaseTimer.current !== null) {
      clearTimeout(releaseTimer.current)
      releaseTimer.current = null
    }
  }

  const releasePress = () => {
    clearReleaseTimer()
    setPressed(false)
  }

  React.useEffect(() => () => {
    if (releaseTimer.current !== null) clearTimeout(releaseTimer.current)
  }, [])

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-pressed={pressed && !props.disabled ? "true" : undefined}
      className={cn(
        "ios-switch peer relative inline-flex shrink-0 cursor-pointer rounded-full border-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:ring-3 aria-invalid:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented && !props.disabled && event.button === 0) {
          clearReleaseTimer()
          setPressed(true)
        }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        // iOS may dispatch click after pointerup. Release with that click,
        // with a fallback for gestures that end without activating the switch.
        clearReleaseTimer()
        releaseTimer.current = setTimeout(() => {
          releaseTimer.current = null
          setPressed(false)
        }, 500)
      }}
      onClick={(event) => {
        onClick?.(event)
        releasePress()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        releasePress()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (event.pointerType === "mouse") releasePress()
      }}
      onBlur={(event) => {
        onBlur?.(event)
        releasePress()
      }}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none absolute block rounded-full"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
