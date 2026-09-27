import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border-2 border-[#e7e4dd] bg-[#f3f1ec] px-2.5 py-1 text-base text-[#2b2a33] outline-none transition-[background-color,border-color,box-shadow] duration-150 md:text-sm",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#8f8b98]/70",
        "enabled:not-focus:not-aria-invalid:hover:border-[#d6d2c8] focus:border-[oklch(0.74_0.14_235)] focus:bg-white focus:ring-4 focus:ring-[oklch(0.95_0.04_235)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-[oklch(0.70_0.19_25)] aria-invalid:bg-[oklch(0.95_0.04_25)] aria-invalid:enabled:hover:border-[oklch(0.70_0.19_25)] aria-invalid:focus:border-[oklch(0.70_0.19_25)] aria-invalid:focus:ring-[oklch(0.95_0.04_25)]",
        "dark:border-[#35323e] dark:bg-[#1b1a21] dark:text-[#f2f0f6] dark:placeholder:text-[#9d99a9]/70 dark:enabled:not-focus:not-aria-invalid:hover:border-[#4a4656] dark:focus:border-[oklch(0.74_0.14_235)] dark:focus:bg-[#201e26] dark:focus:ring-[oklch(0.33_0.06_238)] dark:aria-invalid:border-[oklch(0.70_0.19_25)] dark:aria-invalid:bg-[oklch(0.33_0.07_25)] dark:aria-invalid:enabled:hover:border-[oklch(0.70_0.19_25)] dark:aria-invalid:focus:border-[oklch(0.70_0.19_25)] dark:aria-invalid:focus:ring-[oklch(0.33_0.07_25)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
