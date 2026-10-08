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
  /** lg: the head of the account's sheet (48, as IconTile lg); sm: a list row's tile (36, as IconTile sm); xs: beside a name in a select. */
  size?: "lg" | "sm" | "xs"
  className?: string
}

const tileClassName = {
  lg: "size-12 rounded-[14px] text-sm",
  sm: "size-9 rounded-[10px] text-xs",
  xs: "size-5 rounded-[6px] text-[9px]",
} as const

/**
 * An account's mark as a tile, the same soft square as the icons in every
 * list (IconTile): the bank's or wallet's logo on white, cash as a green
 * banknote, or the initials when there is no logo. Its name is always
 * written beside it, so it is not read out a second time.
 */
export function AccountLogo({ account, size = "sm", className }: AccountLogoProps) {
  if (account.type === "cash") {
    return (
      <span aria-hidden="true" className={className}>
        <IconTile
          icon={BanknoteIcon}
          tone="emerald"
          size={size === "lg" ? "lg" : "sm"}
          className={cn(size === "xs" && "size-5 rounded-[6px] [&_svg]:size-3")}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
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
          alt=""
          width={size === "lg" ? 48 : 36}
          height={size === "lg" ? 48 : 36}
          className="size-full object-contain p-[14%]"
        />
      ) : (
        account.logoFallback
      )}
    </span>
  )
}
