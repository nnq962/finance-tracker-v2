import Image from "next/image"

import { SITE_NAME } from "@/lib/site"

export default function RootLoading() {
  return (
    <div
      className="min-h-svh bg-[#fbfaf7] px-6 pt-[34svh] text-[#2b2a33] dark:bg-[#0a0a0a] dark:text-[#f2f0f6]"
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
        <p className="mt-8 font-heading text-xl leading-none font-extrabold">
          {SITE_NAME}
        </p>
        <p className="mt-3 animate-pulse text-xs font-bold text-[#8f8b98] motion-reduce:animate-none dark:text-[#a6a1af]">
          Đang khởi động…
        </p>
      </div>
    </div>
  )
}
