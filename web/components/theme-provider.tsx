"use client"

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes"

export function ThemeProvider({
  children,
  scriptProps,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      disableTransitionOnChange
      {...props}
      scriptProps={{
        ...scriptProps,
        type:
          typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      {children}
    </NextThemesProvider>
  )
}
