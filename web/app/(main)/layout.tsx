import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthSessionGuard } from "@/components/auth-session-guard"
import { GestureDebug } from "@/components/gesture-debug"
import { MainBreadcrumb } from "@/components/main-breadcrumb"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { NotificationsButton } from "@/components/notifications-sheet"
import { WelcomeProvider } from "@/components/onboarding/welcome"
import { PwaThemeColor } from "@/components/pwa-theme-color"
import { PushMessageListener } from "@/components/push-message-listener"
import { ThemeSelect } from "@/components/theme-select"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isDevSessionUser, requireSession } from "@/lib/auth/session"
import { needsOnboarding } from "@/lib/onboarding/repository"

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
  // A failed read only skips the welcome; it never blocks the app.
  const firstRun = await needsOnboarding(user.uid).catch(() => false)

  return (
    <AuthSessionGuard initialUid={user.uid} devSession={isDevSessionUser(user)}>
      <PushMessageListener />
      <TooltipProvider>
        <WelcomeProvider firstRun={firstRun}>
          <SidebarProvider
            data-app-shell="main"
            // The floating tab bar's height plus its gap from the screen's bottom edge.
            className="h-dvh min-h-0 flex-col overflow-hidden [--tab-bar-space:calc(3.75rem+max(0.75rem,calc(env(safe-area-inset-bottom,0px)-0.75rem)))] md:h-auto md:min-h-svh md:flex-row md:overflow-visible"
          >
            <PwaThemeColor />
            <AppSidebar />
            <SidebarInset
              data-main-scroll-viewport
              className="surface-grouped min-h-0 min-w-0 overflow-y-auto overscroll-y-contain [--main-content-px:--spacing(4)] [-webkit-overflow-scrolling:touch] md:min-h-svh md:overflow-visible md:[--main-content-px:--spacing(6)]"
            >
              <div
                aria-hidden="true"
                className="h-[env(safe-area-inset-top,0px)] shrink-0 md:hidden"
              />
              <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center bg-background md:flex">
                <div className="flex w-full items-center justify-between gap-3 px-(--main-content-px) transition-[padding] duration-200 ease-linear">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <MainBreadcrumb />
                  </div>
                  <div className="flex items-center gap-1">
                    <NotificationsButton variant="ghost" />
                    <ThemeSelect />
                  </div>
                </div>
              </header>
              {/* A 1px scroll range keeps iOS bounce inside this pane on short pages. */}
              {/* Vertical rhythm and bottom padding come from each page's <Page>; on
                  phones the floating tab bar's space is added below it. */}
              <div className="flex min-h-[calc(100%+1px)] shrink-0 grow flex-col px-(--main-content-px) pt-4 pb-(--tab-bar-space) transition-[padding] duration-200 ease-linear md:min-h-0 md:pt-0 md:pb-0">
                {children}
              </div>
            </SidebarInset>
            <MobileBottomNav />
            <GestureDebug />
          </SidebarProvider>
        </WelcomeProvider>
      </TooltipProvider>
    </AuthSessionGuard>
  )
}
