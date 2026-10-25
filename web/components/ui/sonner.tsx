"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"

/**
 * Toasts as an iOS capsule at the top (2026-10-25, the user's pick of the
 * /zz-preview/toast mockup; a 64-high card across the screen before): as wide
 * as its words, centred, 48 high, a capsule at every height: a long title's
 * two lines or a description's keep the round ends (rounded 24 left them less
 * round, 2026-10-25), never wider than the screen less 16 a side; its words 20
 * in from the left without a mark, 12 with one. Solid in both themes:
 * white with a soft fall in the light one, the lead card's grey #262626 with a
 * light hairline in the dark one (it was see-through there, on the fill-2 of
 * bg-secondary). A mark of its meaning on the left, a solid round one with a
 * white glyph (ink on the light amber) as iOS's checkmark.circle.fill; the
 * title 15 semibold, a description 13 under it; an action such as Hoàn tác a
 * small grey capsule. Its coming and going is in globals.css (after
 * transitions.dev's toast, from the top). Sonner keeps stacking, swiping and
 * the timers. The fall stays below it: a shadow reaching the top of the screen
 * tints Safari 26's status bar.
 */
const mark = "grid size-[22px] place-items-center rounded-full"

/**
 * A toast's state changing in place (toast.loading, then toast.success with
 * its id): Sonner swaps the words and the mark at once. On a new kind this
 * sets off the words' cross-blur (data-state-swap, globals.css) and eases the
 * width from the old words' to the new ones' (transitions.dev's card resize):
 * the width each toast last had is kept, set back inline for a frame, then
 * let go to the new one, and cleared once there.
 */
function useToastStateMotion() {
  React.useEffect(() => {
    const widths = new WeakMap<Element, number>()
    const kinds = new WeakMap<Element, string | null>()
    const still = window.matchMedia("(prefers-reduced-motion: reduce)")
    const remember = () => {
      document.querySelectorAll("[data-sonner-toast]").forEach((toast) => {
        if (!toast.hasAttribute("data-resizing")) widths.set(toast, toast.getBoundingClientRect().width)
        if (!kinds.has(toast)) kinds.set(toast, toast.getAttribute("data-type"))
      })
    }
    const swap = (toast: HTMLElement) => {
      const before = widths.get(toast)
      const after = toast.getBoundingClientRect().width
      toast.removeAttribute("data-state-swap")
      void toast.offsetWidth
      toast.setAttribute("data-state-swap", "")
      if (still.matches || before === undefined || Math.abs(before - after) < 1) return
      toast.setAttribute("data-resizing", "")
      toast.style.setProperty("width", `${before}px`, "important")
      void toast.offsetWidth
      toast.style.setProperty("width", `${after}px`, "important")
      const done = (event: TransitionEvent) => {
        if (event.target !== toast || event.propertyName !== "width") return
        toast.style.removeProperty("width")
        toast.removeAttribute("data-resizing")
        widths.set(toast, toast.getBoundingClientRect().width)
        toast.removeEventListener("transitionend", done)
      }
      toast.addEventListener("transitionend", done)
    }
    const observer = new MutationObserver((records) => {
      let touched = false
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : null
        // Anything else changing on the page is none of this.
        if (!target?.closest("[data-sonner-toaster]") && !(target?.matches("section") && target.querySelector("[data-sonner-toaster]"))) continue
        touched = true
        if (record.type === "attributes" && record.attributeName === "data-type" && target instanceof HTMLElement && target.matches("[data-sonner-toast]")) {
          if (kinds.get(target) !== target.getAttribute("data-type")) swap(target)
          kinds.set(target, target.getAttribute("data-type"))
        }
      }
      // After the change, so the next one starts from these words' width.
      if (touched) requestAnimationFrame(remember)
    })
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-type"] })
    return () => observer.disconnect()
  }, [])
}

const Toaster = ({ style, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  useToastStateMotion()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Sonner's column, 356 by default; on phones it spans the screen less its 16 offsets.
      style={{ "--width": "400px", ...style } as React.CSSProperties}
      // Each mark keyed by its kind: a state changing in place (loading, then done) draws a new
      // element, which comes in with its own motion (globals.css), rather than the old one recoloured.
      icons={{
        success: (
          <span key="success" className={`${mark} bg-income text-white`}>
            <CheckIcon className="size-3.5" strokeWidth={3} />
          </span>
        ),
        // A bold letter: Lucide's info and alert draw a ring of their own.
        info: (
          <span key="info" className={`${mark} bg-transfer text-[13px] leading-none font-extrabold text-white`}>
            i
          </span>
        ),
        warning: (
          <span key="warning" className={`${mark} bg-warning text-[13px] leading-none font-extrabold text-black/80`}>
            !
          </span>
        ),
        error: (
          <span key="error" className={`${mark} bg-expense text-white`}>
            <XIcon className="size-3.5" strokeWidth={3} />
          </span>
        ),
        // In a box of its own, which takes the mark's coming in, so the spinner keeps its turning.
        loading: (
          <span key="loading" className={mark}>
            <Loader2Icon className="size-[22px] animate-spin text-muted-foreground" strokeWidth={2.5} />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // As wide as its words and centred in Sonner's column (left and right 0, margins auto).
          // Stacked behind the front one, only its edge shows, not its words.
          toast:
            "inset-x-0 mx-auto flex min-h-12 w-fit! max-w-full items-center gap-2.5 rounded-full bg-raised py-1.5 pr-4 pl-5 font-sans text-card-foreground shadow-[0_0_0_0.5px_rgb(0_0_0/0.06),0_10px_28px_-10px_rgb(0_0_0/0.25)] has-[[data-icon]]:pl-3 has-[[data-description]]:min-h-14 has-[[data-description]]:py-2 has-[[data-action]]:pr-1.5 dark:bg-lead dark:shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1),0_12px_28px_-10px_rgb(0_0_0/0.8)] data-[expanded=false]:data-[front=false]:[&>*]:opacity-0",
          // Sonner's own box around the icon is 16 square, with margins; it
          // also wraps the loading spinner in a layer centred on the nearest
          // positioned box, which was the whole toast.
          icon: "relative m-0! flex size-[22px]! shrink-0 items-center justify-center",
          content: "flex min-w-0 flex-col justify-center",
          // Two lines alone (a long error is read whole); one above a description.
          title: "line-clamp-2 text-[15px] leading-5 font-semibold [[data-content]:has([data-description])>&]:line-clamp-1",
          // Sonner colours descriptions per theme on its own; keep them muted.
          description: "truncate text-[13px] leading-4 text-muted-foreground!",
          actionButton: "ml-1.5 h-9 shrink-0 rounded-full bg-fill-2 px-3.5 text-sm font-semibold text-foreground outline-none active:bg-fill-3",
          cancelButton: "ml-1 h-9 shrink-0 rounded-full px-3 text-sm font-medium text-muted-foreground active:opacity-80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
