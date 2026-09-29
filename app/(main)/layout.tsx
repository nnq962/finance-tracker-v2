import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthSessionGuard } from "@/components/auth-session-guard"
import { MainBreadcrumb } from "@/components/main-breadcrumb"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { PwaThemeColor } from "@/components/pwa-theme-color"
import { ThemeSelect } from "@/components/theme-select"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { requireSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await requireSession()

  return (
    <AuthSessionGuard>
      <TooltipProvider>
        <SidebarProvider
          data-app-shell="main"
          className="bg-[#fbfaf7] dark:bg-background md:bg-sidebar dark:md:bg-sidebar"
        >
          <PwaThemeColor />
          <AppSidebar user={user} />
          <SidebarInset className="min-h-svh min-w-0 bg-[#fbfaf7] [--main-content-px:--spacing(4)] [padding-top:env(safe-area-inset-top,0px)] dark:bg-background md:border-l-2 md:border-l-[#e7e4dd] md:pt-0 md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0 md:[--main-content-px:--spacing(6)] dark:md:border-l-[#35323e]">
            <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center bg-[#fbfaf7] dark:bg-background md:flex">
              <div className="flex w-full items-center justify-between gap-3 px-(--main-content-px) transition-[padding] duration-200 ease-linear">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                  />
                  <MainBreadcrumb />
                </div>
                <ThemeSelect />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 px-(--main-content-px) pt-4 [padding-bottom:calc(4rem+env(safe-area-inset-bottom,0px))] transition-[padding] duration-200 ease-linear md:pt-0 md:pb-4 [&>*]:mx-0 [&>*]:max-w-none">
              {children}
            </div>
          </SidebarInset>
          <MobileBottomNav />
        </SidebarProvider>
      </TooltipProvider>
    </AuthSessionGuard>
  )
}
