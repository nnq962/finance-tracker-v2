"use client"

import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { gridChoices, PickGrid } from "@/components/app/pick-grid"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { searchInstitutions, type FinancialInstitution } from "@/lib/institutions"

/** How many of the catalogue, in its order (the most used first), count as the common ones. */
const COMMON_COUNT = 7

function label(institution: FinancialInstitution) {
  return institution.shortName ?? institution.name
}

/** The bank's or wallet's logo as an account's tile, the same as in the account list. */
export function InstitutionLogo({ institution }: { institution: FinancialInstitution }) {
  return (
    <AccountLogo
      account={{
        type: institution.type,
        logoUrl: institution.logoPath,
        name: label(institution),
        institutionName: institution.name,
        logoFallback: label(institution).slice(0, 2),
      }}
    />
  )
}

/**
 * The bank or wallet as a grid of logos (PickGrid): the common ones, the
 * chosen one ringed, and "Tất cả" for the whole list (InstitutionPicker).
 */
export function InstitutionGrid({
  id,
  caption,
  institutions,
  value,
  onValueChange,
  onShowAll,
  error,
}: {
  id: string
  caption: string
  institutions: readonly FinancialInstitution[]
  value: string
  onValueChange: (id: string) => void
  onShowAll: () => void
  error?: string
}) {
  return (
    <PickGrid
      id={id}
      caption={caption}
      items={gridChoices(institutions, value).map((institution) => ({
        id: institution.id,
        label: label(institution),
        media: <InstitutionLogo institution={institution} />,
      }))}
      value={value}
      onValueChange={onValueChange}
      onShowAll={onShowAll}
      labelLines={1}
      tileSize="sm"
      error={error}
    />
  )
}

/**
 * Every bank or wallet, on a deeper screen of the sheet: a search by name,
 * short name or alias (searchInstitutions, the best match first) over the
 * common ones, digital banks, then the rest A–Z. A tap
 * picks one and goes back.
 */
export function InstitutionPicker({
  kind,
  institutions,
  value,
  onPick,
}: {
  kind: "bank" | "e-wallet"
  institutions: readonly FinancialInstitution[]
  value: string
  onPick: (id: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const noun = kind === "bank" ? "ngân hàng" : "ví điện tử"

  const groups: Array<{ title: string; items: readonly FinancialInstitution[] }> = []
  if (query.trim()) {
    groups.push({ title: "Kết quả", items: searchInstitutions(institutions, query) })
  } else {
    const common = institutions.slice(0, COMMON_COUNT)
    const rest = institutions.slice(COMMON_COUNT)
    const digital = kind === "bank" ? rest.filter((institution) => institution.keywords?.includes("digital bank")) : []
    const others = rest
      .filter((institution) => !digital.includes(institution))
      .sort((left, right) => label(left).localeCompare(label(right), "vi"))
    groups.push({ title: "Phổ biến", items: common })
    if (digital.length > 0) groups.push({ title: "Ngân hàng số", items: digital })
    groups.push({ title: kind === "bank" ? "Ngân hàng khác" : "Ví khác", items: others })
  }

  return (
    <div className="flex flex-col gap-6">
      <InputGroup variant="search" role="search">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          inputMode="search"
          enterKeyHint="search"
          aria-label={`Tìm ${noun}`}
          placeholder="Tìm tên hoặc viết tắt"
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
      {groups.map((group) => (
        <SettingsGroup key={group.title} title={group.title}>
          {group.items.length > 0 ? (
            group.items.map((institution) => (
              <SettingsRow
                key={institution.id}
                media={<InstitutionLogo institution={institution} />}
                title={label(institution)}
                description={institution.shortName && institution.shortName !== institution.name ? institution.name : undefined}
                checked={value === institution.id}
                onClick={() => onPick(institution.id)}
              />
            ))
          ) : (
            <SettingsRow title={`Không tìm thấy ${noun}`} />
          )}
        </SettingsGroup>
      ))}
    </div>
  )
}
