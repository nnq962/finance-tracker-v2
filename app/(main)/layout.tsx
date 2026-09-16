import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthSessionGuard } from "@/components/auth-session-guard"
import { MainBreadcrumb } from "@/components/main-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { requireSession } from "@/lib/auth/session"

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await requireSession()

  return (
    <AuthSessionGuard>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset className="min-w-0 bg-[#FCFCFB] [--main-content-px:--spacing(4)] dark:bg-background md:[--main-content-px:--spacing(6)] md:peer-data-[state=collapsed]:[--main-content-px:--spacing(24)]">
            <header className="flex h-16 shrink-0 items-center">
              <div className="flex w-full items-center justify-between px-(--main-content-px) transition-[padding] duration-200 ease-linear">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                  />
                  <MainBreadcrumb />
                </div>
                <ThemeToggle />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 px-(--main-content-px) pb-4 pt-0 transition-[padding] duration-200 ease-linear [&>*]:mx-0 [&>*]:max-w-none">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthSessionGuard>
  )
}
