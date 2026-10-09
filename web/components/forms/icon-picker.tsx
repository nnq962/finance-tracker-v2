"use client"

import * as React from "react"
import { LayoutGridIcon, SearchIcon, XIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { groupCaptionClassName } from "@/components/settings-list"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import {
  categoryIconOptions,
  categoryIconRegistry,
  type CategoryIconName,
} from "@/lib/icons/category-icon-registry"
import { searchKey } from "@/lib/search-text"
import { cn } from "@/lib/utils"

/** How many icons the quick grid shows: two rows of six, the last cell opening every icon. */
const QUICK_COUNT = 11

// Words that say nothing about an icon ("Cà phê và trà sữa").
const fillerWords = new Set(["va", "và", "cua", "của", "cho", "cac", "các", "nhung", "những", "voi", "với", "la", "là", "o", "ở"])

/** The words of `text` as `key` compares them, without the filler ones. */
const wordsOf = (text: string, key: (value: string) => string) =>
  key(text).split(/[\s,.;:()/&+-]+/).filter((word) => word && !fillerWords.has(word))

/**
 * Whether every word typed starts a word of `label`, as the app's searches
 * match ("xe" finds Xe buýt and Bãi đỗ xe); accents count only when typed.
 */
function labelMatches(label: string, typed: string[], key: (value: string) => string) {
  const labelWords = wordsOf(label, key)
  return typed.every((word) => labelWords.some((labelWord) => labelWord.startsWith(word)))
}

/**
 * The icons whose names share words with `name` ("Cà phê sáng" → Cà phê),
 * those sharing most first. Accents count when the name has them, so
 * "sữa" (milk) does not bring up "sửa" (repairs).
 */
export function suggestIcons(name: string): CategoryIconName[] {
  const key = searchKey(name)
  const typed = new Set(wordsOf(name, key).filter((word) => word.length > 1))
  if (typed.size === 0) return []
  return categoryIconOptions
    .map((option) => ({ name: option.name, score: wordsOf(option.label, key).filter((word) => typed.has(word)).length }))
    .filter((option) => option.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((option) => option.name)
}

const cellClassName =
  "pressable grid aspect-square place-items-center rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"

/** One icon to tap: in the category's colour and ringed when chosen, grey otherwise. */
function IconCell({
  name,
  color,
  chosen,
  onPick,
}: {
  name: CategoryIconName
  color: CategoryColorName
  chosen: boolean
  onPick: (name: CategoryIconName) => void
}) {
  const label = categoryIconOptions.find((option) => option.name === name)?.label ?? name

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={chosen}
      onClick={() => onPick(name)}
      className={cellClassName}
    >
      {/* Ringed around the tile itself, as the chosen colour is, so a narrow cell never hides it. */}
      <span className={cn("rounded-[10px]", chosen && "ring-2 ring-foreground ring-offset-2 ring-offset-card")}>
        <IconTile icon={categoryIconRegistry[name]} tone={chosen ? color : undefined} />
      </span>
    </button>
  )
}

/**
 * A category's icon picked from a grid of two rows on a white card, as
 * PickGrid picks a category: the chosen icon first, then those matching the
 * name being typed (`name`), then `fallback` (the group's, its other items'),
 * and last a cell opening every icon (IconPickerScreen, a deeper screen).
 */
export function IconPicker({
  value,
  color,
  name,
  fallback = [],
  onValueChange,
  onShowAll,
}: {
  value: CategoryIconName
  color: CategoryColorName
  name: string
  fallback?: readonly CategoryIconName[]
  onValueChange: (value: CategoryIconName) => void
  onShowAll: () => void
}) {
  const shown = [...new Set([value, ...suggestIcons(name), ...fallback, ...categoryIconOptions.map((option) => option.name)])].slice(
    0,
    QUICK_COUNT,
  )

  return (
    <div role="group" aria-label="Biểu tượng" className="grid grid-cols-6 gap-1 rounded-[20px] bg-card p-2">
      {shown.map((icon) => (
        <IconCell key={icon} name={icon} color={color} chosen={icon === value} onPick={onValueChange} />
      ))}
      <button type="button" aria-label="Tất cả biểu tượng" onClick={onShowAll} className={cellClassName}>
        <IconTile icon={LayoutGridIcon} />
      </button>
    </div>
  )
}

/**
 * Every icon, on a deeper screen of the sheet: a search by name ("xe",
 * "nhà"), then all of them as one grid, the chosen one ringed. A tap picks
 * one (and the caller goes back).
 */
export function IconPickerScreen({
  value,
  color,
  onPick,
}: {
  value: CategoryIconName
  color: CategoryColorName
  onPick: (value: CategoryIconName) => void
}) {
  const [query, setQuery] = React.useState("")
  const key = searchKey(query)
  const typed = wordsOf(query, key)
  const shown = categoryIconOptions.filter((option) => typed.length === 0 || labelMatches(option.label, typed, key))

  return (
    <div className="flex flex-col gap-6 pb-4">
      <InputGroup variant="search" role="search">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Tìm biểu tượng"
          placeholder="Tìm: cà phê, xe, nhà…"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Xoá tìm kiếm" onClick={() => setQuery("")}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      <section className="flex flex-col gap-2">
        <h3 className={cn("px-4", groupCaptionClassName)}>
          {typed.length > 0 ? `Kết quả · ${shown.length}` : `Tất cả · ${shown.length}`}
        </h3>
        {shown.length > 0 ? (
          <div role="group" aria-label="Biểu tượng" className="grid grid-cols-6 gap-1 rounded-[20px] bg-card p-2">
            {shown.map((option) => (
              <IconCell key={option.name} name={option.name} color={color} chosen={option.name === value} onPick={onPick} />
            ))}
          </div>
        ) : (
          <p className="rounded-[20px] bg-card px-4 py-5 text-center text-sm text-muted-foreground">
            Không tìm thấy “{query.trim()}”
          </p>
        )}
      </section>
    </div>
  )
}
