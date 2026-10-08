"use client"

import { SearchIcon, XIcon } from "lucide-react"
import * as React from "react"
import { createPortal } from "react-dom"

import { Collapse } from "@/components/app/collapse"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

import type { TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { countActiveFilters } from "./transaction-filter-fields"

/** The conditions to count on the filter chip: all but the kind, which the kind chips beside it show. */
export function countSheetFilters(filter: TransactionFilter, searchFilters: TransactionSearchFilters) {
  return countActiveFilters(filter, searchFilters) - Number(filter !== "all")
}

const subscribeNever = () => () => {}

/**
 * The search field. On phones a tap on it opens the search screen (`onFocus`)
 * and `onCancel` (Huỷ) closes it again, clearing the text; from lg up it stays.
 * The list filters as you type, so the keyboard's Search key only puts the
 * keyboard away to show the results, as in native search bars. With a mouse
 * and a hardware keyboard there is nothing to put away: Enter keeps focus in
 * the field so typing and screen readers stay where they were.
 */
export function TransactionSearchBar({
  id,
  query,
  onQueryChange,
  onCancel,
  cancelable = false,
  onFocus,
  autoFocus,
}: {
  id: string
  query: string
  onQueryChange: (query: string) => void
  onCancel?: () => void
  /** Shows Huỷ, sliding in beside the field (the search screen is open). */
  cancelable?: boolean
  /** The field taking focus, which opens the search screen on phones. */
  onFocus?: () => void
  autoFocus?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const proxyRef = React.useRef<HTMLInputElement>(null)
  const mounted = React.useSyncExternalStore(subscribeNever, () => true, () => false)

  // iOS Safari moves the whole view up to keep a focused field above the
  // keyboard. The field is still low when first tapped (the header has yet
  // to fold), so it moved, and once the header folded the field ended under
  // the Dynamic Island. So the first tap that opens the search screen takes
  // the keyboard into a hidden field at the screen's top (nothing to move
  // for), and once the real one has slid up, focus moves to it: the keyboard
  // stays up and iOS has nothing to scroll.
  const openFromTouch = (event: React.TouchEvent<HTMLInputElement>) => {
    if (cancelable || !onFocus || document.activeElement === inputRef.current) return
    if (!window.matchMedia("(width < 64rem)").matches) return
    event.preventDefault()
    proxyRef.current?.focus({ preventScroll: true })
    onFocus()
    window.setTimeout(() => {
      // Anything typed in the meantime goes along.
      const proxy = proxyRef.current
      if (proxy?.value) {
        onQueryChange(proxy.value)
        proxy.value = ""
      }
      inputRef.current?.focus({ preventScroll: true })
    }, 350)
  }

  return (
    <form
      role="search"
      className="flex min-w-0 items-center"
      onSubmit={(event) => {
        event.preventDefault()
        if (window.matchMedia("(pointer: coarse)").matches) inputRef.current?.blur()
      }}
    >
      <label htmlFor={id} className="sr-only">
        Tìm giao dịch
      </label>
      <InputGroup variant="search" className="min-w-0 flex-1">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id={id}
          onTouchEnd={openFromTouch}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          // Opened by a tap on the search button, it takes the keyboard straight away.
          autoFocus={autoFocus}
          value={query}
          onFocus={onFocus}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm giao dịch"
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Xoá tìm kiếm" onClick={() => onQueryChange("")}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {onCancel ? (
        <Collapse open={cancelable} axis="x" className="shrink-0">
          <Button type="button" variant="ghost" className="ml-1 px-3" onClick={onCancel}>
            Huỷ
          </Button>
        </Collapse>
      ) : null}
      {mounted
        ? createPortal(
            <input
              ref={proxyRef}
              aria-hidden="true"
              tabIndex={-1}
              type="text"
              inputMode="search"
              // 16px, or iOS would zoom in on it.
              className="pointer-events-none fixed top-0 left-0 size-px text-base opacity-0"
            />,
            document.body,
          )
        : null}
    </form>
  )
}
