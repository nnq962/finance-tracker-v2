"use client"

import * as React from "react"
import { cn } from "cn"
import { Select as SelectPrimitive } from "radix-ui"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border-2 border-[#e7e4dd] bg-[#f3f1ec] py-2 pr-2 pl-2.5 text-sm text-[#2b2a33] whitespace-nowrap outline-none transition-[background-color,border-color,box-shadow] duration-150 select-none",
        "enabled:not-focus-visible:not-data-[state=open]:not-aria-invalid:hover:border-[#d6d2c8] focus-visible:border-[oklch(0.74_0.14_235)] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[oklch(0.95_0.04_235)] data-[state=open]:border-[oklch(0.74_0.14_235)] data-[state=open]:bg-white data-[state=open]:ring-4 data-[state=open]:ring-[oklch(0.95_0.04_235)]",
        "disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-[oklch(0.70_0.19_25)] aria-invalid:bg-[oklch(0.95_0.04_25)] aria-invalid:enabled:hover:border-[oklch(0.70_0.19_25)] aria-invalid:focus-visible:border-[oklch(0.70_0.19_25)] aria-invalid:focus-visible:ring-[oklch(0.95_0.04_25)] aria-invalid:data-[state=open]:border-[oklch(0.70_0.19_25)] aria-invalid:data-[state=open]:ring-[oklch(0.95_0.04_25)] data-placeholder:text-[#8f8b98]/70",
        "data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        "dark:border-[#35323e] dark:bg-[#1b1a21] dark:text-[#f2f0f6] dark:enabled:not-focus-visible:not-data-[state=open]:not-aria-invalid:hover:border-[#4a4656] dark:focus-visible:border-[oklch(0.74_0.14_235)] dark:focus-visible:bg-[#201e26] dark:focus-visible:ring-[oklch(0.33_0.06_238)] dark:data-[state=open]:border-[oklch(0.74_0.14_235)] dark:data-[state=open]:bg-[#201e26] dark:data-[state=open]:ring-[oklch(0.33_0.06_238)] dark:data-placeholder:text-[#9d99a9]/70 dark:aria-invalid:border-[oklch(0.70_0.19_25)] dark:aria-invalid:bg-[oklch(0.33_0.07_25)] dark:aria-invalid:enabled:hover:border-[oklch(0.70_0.19_25)] dark:aria-invalid:focus-visible:border-[oklch(0.70_0.19_25)] dark:aria-invalid:focus-visible:ring-[oklch(0.33_0.07_25)] dark:aria-invalid:data-[state=open]:border-[oklch(0.70_0.19_25)] dark:aria-invalid:data-[state=open]:ring-[oklch(0.33_0.07_25)]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-[#8f8b98] dark:text-[#9d99a9]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-white text-[#2b2a33] shadow-none ring-2 ring-inset ring-[#e7e4dd] data-[align-trigger=true]:w-[calc(100%+2px)] data-[align-trigger=true]:-translate-x-0.5 dark:bg-[#201e26] dark:text-[#f2f0f6] dark:ring-[#35323e]",
          "duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && ""
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-[#8f8b98] dark:text-[#9d99a9]", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-[oklch(0.95_0.04_235)] focus:text-[oklch(0.58_0.14_240)] data-[state=checked]:text-[oklch(0.58_0.14_240)] data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-[oklch(0.33_0.06_238)] dark:focus:text-[#71caff] dark:data-[state=checked]:text-[#71caff] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-[#e7e4dd] dark:bg-[#35323e]", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-white py-1 text-[#8f8b98] dark:bg-[#201e26] dark:text-[#9d99a9] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-white py-1 text-[#8f8b98] dark:bg-[#201e26] dark:text-[#9d99a9] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
