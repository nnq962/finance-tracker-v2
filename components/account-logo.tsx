import Image from "next/image"
import { BanknoteIcon } from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

type AccountLogoProps = {
  account: Pick<
    Account,
    "institutionName" | "logoFallback" | "logoUrl" | "name" | "type"
  >
  className?: string
}

export function AccountLogo({ account, className }: AccountLogoProps) {
  if (account.type === "cash") {
    return (
      <div
        role="img"
        aria-label="Tiền mặt"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
          className,
        )}
      >
        <BanknoteIcon className="size-5" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white p-1.5",
        className,
      )}
    >
      {account.logoUrl ? (
        <Image
          src={account.logoUrl}
          alt={account.institutionName ?? account.name}
          width={40}
          height={40}
          className="size-full object-contain"
        />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          {account.logoFallback}
        </span>
      )}
    </div>
  )
}
