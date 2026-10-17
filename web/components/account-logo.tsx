import Image from "next/image"
import { BanknoteIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import type { Account } from "@/lib/accounts/types"
import { getJarIcon } from "@/lib/savings/jar-icons"
import { cn } from "@/lib/utils"

type AccountLogoProps = {
  account: Pick<
    Account,
    "institutionName" | "logoFallback" | "logoUrl" | "name" | "type"
  > & { goal?: Pick<NonNullable<Account["goal"]>, "icon" | "color"> }
  /** lg: the head of the account's sheet (48, as IconTile lg); sm: a list row's tile (36, as IconTile sm); xs: beside a name in a select. */
  size?: "lg" | "sm" | "xs"
  /** Loads the logo only as it nears the screen: for a long list, such as every bank to pick from. */
  lazy?: boolean
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
 * banknote, a savings jar as what it is for (its icon and colour), or the
 * initials when there is no logo. Its name is always
 * written beside it, so it is not read out a second time.
 */
export function AccountLogo({ account, size = "sm", lazy = false, className }: AccountLogoProps) {
  if (account.type === "cash" || account.type === "savings") {
    const jar = account.type === "savings" ? getJarIcon(account.goal) : null
    return (
      <span aria-hidden="true" className={className}>
        <IconTile
          icon={jar?.icon ?? BanknoteIcon}
          tone={jar?.tone ?? "emerald"}
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
          // A handful of small files, cached for long: shown at once when a
          // grid or list mounts (a sheet, a tab), not after it lays out.
          loading={lazy ? "lazy" : "eager"}
          // Drawn at the size shown (SVG, or WebP three times the largest
          // tile): served as they are, not through the image optimizer.
          unoptimized
          className="size-full object-contain p-[14%]"
        />
      ) : (
        account.logoFallback
      )}
    </span>
  )
}
