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
    <>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `try{var theme=localStorage.getItem("theme");document.documentElement.dataset.themeSelection=theme==="light"||theme==="dark"||theme==="system"?theme:"system"}catch(error){document.documentElement.dataset.themeSelection="system"}`,
        }}
      />
      <NextThemesProvider
        {...props}
        scriptProps={{
          ...scriptProps,
          type:
            typeof window === "undefined" ? "text/javascript" : "text/plain",
        }}
      >
        {children}
      </NextThemesProvider>
    </>
  )
}
