import Image from "next/image"
import { BanknoteIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import type { Account } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

type AccountLogoProps = {
  account: Pick<
    Account,
    "institutionName" | "logoFallback" | "logoUrl" | "name" | "type"
  >
  /** sm: a list row's tile (36, as IconTile sm); xs: beside a name in a select. */
  size?: "sm" | "xs"
  className?: string
}

const tileClassName = {
  sm: "size-9 rounded-[10px] text-xs",
  xs: "size-5 rounded-[6px] text-[9px]",
} as const

/**
 * An account's mark as a tile, the same soft square as the icons in every
 * list (IconTile): the bank's or wallet's logo on white, cash as a green
 * banknote, or the initials when there is no logo.
 */
export function AccountLogo({ account, size = "sm", className }: AccountLogoProps) {
  if (account.type === "cash") {
    return (
      <span role="img" aria-label="Tiền mặt" className={className}>
        <IconTile icon={BanknoteIcon} tone="emerald" size="sm" className={cn(size === "xs" && "size-5 rounded-[6px] [&_svg]:size-3")} />
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden font-medium",
        tileClassName[size],
        // Logos are drawn for a white ground, so they keep one in dark mode;
        // a hairline sets the tile off a white card.
        account.logoUrl ? "bg-white ring-1 ring-black/5 ring-inset" : "bg-muted text-foreground",
        className,
      )}
    >
      {account.logoUrl ? (
        <Image
          src={account.logoUrl}
          alt={account.institutionName ?? account.name}
          width={36}
          height={36}
          className="size-full object-contain p-[14%]"
        />
      ) : (
        account.logoFallback
      )}
    </span>
  )
}
