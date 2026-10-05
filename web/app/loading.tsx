import Image from "next/image"

import { SITE_NAME } from "@/lib/site"

export default function RootLoading() {
  return (
    <div
      className="min-h-svh bg-background px-6 pt-[34svh] text-foreground"
      role="status"
      aria-label="Đang khởi động Finance Tracker"
      aria-busy="true"
    >
      <div className="mx-auto flex w-fit flex-col items-center text-center">
        <Image
          src="/icon.svg"
          width={110}
          height={110}
          priority
          alt=""
        />
        <p className="mt-8 text-xl font-semibold">
          {SITE_NAME}
        </p>
        <p className="mt-3 animate-pulse text-sm text-muted-foreground motion-reduce:animate-none">
          Đang khởi động…
        </p>
      </div>
    </div>
  )
}
