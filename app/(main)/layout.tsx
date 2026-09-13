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
} from "@/components/animate-ui/components/radix/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { requireSession } from "@/lib/auth/session"

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await requireSession()

  return (
    <AuthSessionGuard>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset className="min-w-0">
            <header className="flex h-16 shrink-0 items-center">
              <div className="flex w-full items-center justify-between px-4">
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
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthSessionGuard>
  )
}
