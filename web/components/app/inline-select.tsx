"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type InlineSelectOption = {
  value: string
  label: string
  /** A second line under the label, e.g. an account number. */
  description?: React.ReactNode
  /** Shown on the right of the option row, e.g. a balance. */
  meta?: React.ReactNode
  /** Leads the closed field when this option is chosen: an IconTile of size sm, so the field stays 52 high. */
  media?: React.ReactNode
}

type SelectProps = {
  options: readonly InlineSelectOption[]
  value: string | undefined
  onValueChange: (value: string) => void
  /** What is chosen, for screen readers, e.g. "Tài khoản". */
  label: string
  placeholder?: string
  className?: string
}

const fieldClassName =
  "flex h-[var(--control-h,2.75rem)] w-full items-center gap-3 px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"

/** The closed field: the chosen option's tile, name and meta, and a chevron that turns when open. */
function ChosenValue({ chosen, placeholder, open }: { chosen?: InlineSelectOption; placeholder: string; open: boolean }) {
  return (
    <>
      {chosen?.media}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-medium", !chosen && "font-normal text-muted-foreground")}>
          {chosen?.label ?? placeholder}
        </span>
        {chosen?.meta ? <span className="block truncate text-xs text-muted-foreground">{chosen.meta}</span> : null}
      </span>
      <ChevronDownIcon
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:duration-150 motion-reduce:ease-out",
          open && "rotate-180",
        )}
      />
    </>
  )
}

/** One option: name and description, meta on the right, a tick on the chosen one. */
function OptionRow({
  option,
  selected,
  onSelect,
}: {
  option: InlineSelectOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="flex min-h-14 w-full items-center gap-3 border-t border-foreground/10 px-4 py-2.5 text-left outline-none transition-colors first:border-t-0 focus-visible:bg-muted active:bg-muted"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{option.label}</span>
        {option.description ? (
          <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
      {option.meta ? <span className="shrink-0 text-sm tabular-nums">{option.meta}</span> : null}
      <CheckIcon aria-hidden="true" strokeWidth={2.5} className={cn("size-4 shrink-0", !selected && "invisible")} />
    </button>
  )
}

/** Arrow keys move between the options of a listbox, wrapping round. */
function moveFocus(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
  event.preventDefault()
  const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')]
  const index = options.indexOf(document.activeElement as HTMLElement)
  const next = (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length
  options[next]?.focus()
}

/**
 * A dropdown that opens in place: the field grows to list the options right
 * under the chosen one, pushing the content below down, as in native forms.
 * For a handful of options (accounts, wallets) inside a form or sheet; long
 * lists keep Select or Combobox. The height eases plainly; growing a block
 * relays out the page below on each frame, so on iOS it is less fluid than a
 * transform, which is accepted (tried a floating menu, 2026-10-07).
 */
export function InlineSelect({ options, value, onValueChange, label, placeholder = "Chọn", className }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const list = React.useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = React.useState(0)
  const listId = React.useId()
  const chosen = options.find((option) => option.value === value)

  // The options' natural height, so the panel can transition to a pixel value.
  React.useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => setListHeight(element.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      data-slot="inline-select"
      data-state={open ? "open" : "closed"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation()
          setOpen(false)
        }
      }}
      className={cn("overflow-hidden rounded-[var(--control-radius,0.75rem)] bg-field", className)}
    >
      <button
        type="button"
        aria-label={`${label}: ${chosen?.label ?? placeholder}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className={cn(fieldClassName, "focus-visible:ring-inset")}
      >
        <ChosenValue chosen={chosen} placeholder={placeholder} open={open} />
      </button>
      <div
        style={{ height: open ? listHeight : 0 }}
        className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:duration-150"
      >
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          inert={!open}
          onKeyDown={moveFocus}
          className={cn(
            "border-t border-foreground/10 transition-opacity duration-300 ease-out motion-reduce:duration-150",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {options.map((option) => (
            <OptionRow
              key={option.value}
              option={option}
              selected={option.value === value}
              onSelect={() => {
                onValueChange(option.value)
                setOpen(false)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
