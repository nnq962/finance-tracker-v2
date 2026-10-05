import Image from "next/image"
import { BanknoteIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
      <Avatar size="lg" role="img" aria-label="Tiền mặt" className={className}>
        <AvatarFallback>
          <BanknoteIcon className="size-1/2" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    // Bank logos are drawn for a white ground, so they keep one in dark mode.
    <Avatar size="lg" className={cn(account.logoUrl && "bg-white", className)}>
      {account.logoUrl ? (
        <Image
          src={account.logoUrl}
          alt={account.institutionName ?? account.name}
          width={40}
          height={40}
          className="size-full rounded-full object-contain p-[15%]"
        />
      ) : (
        <AvatarFallback>{account.logoFallback}</AvatarFallback>
      )}
    </Avatar>
  )
}
