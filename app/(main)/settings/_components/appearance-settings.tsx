"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, PaletteIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const subscribe = () => () => {}
const MOBILE_THEME_TRANSITION_MS = 420

type ThemeValue = "light" | "dark" | "system"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [pendingTheme, setPendingTheme] = React.useState<ThemeValue | null>(null)
  const themeChangeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const selectedTheme: ThemeValue =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system"
  const displayedTheme = pendingTheme ?? selectedTheme

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.dataset.themeSelection = selectedTheme
    }
  }, [mounted, selectedTheme])

  React.useEffect(() => {
    return () => {
      if (themeChangeTimerRef.current) {
        clearTimeout(themeChangeTimerRef.current)
      }
    }
  }, [])

  const applyTheme = (nextTheme: string) => {
    document.documentElement.dataset.themeSelection = nextTheme
    setTheme(nextTheme)
  }

  const updateMobileTheme = (nextTheme: string) => {
    const nextThemeValue = nextTheme as ThemeValue

    setPendingTheme(nextThemeValue)

    if (themeChangeTimerRef.current) {
      clearTimeout(themeChangeTimerRef.current)
    }

    // next-themes temporarily disables CSS transitions while applying a theme.
    // Let the tab indicator finish first so its slide animation is preserved.
    themeChangeTimerRef.current = setTimeout(() => {
      applyTheme(nextThemeValue)
      setPendingTheme(null)
      themeChangeTimerRef.current = null
    }, MOBILE_THEME_TRANSITION_MS)
  }

  const updateDesktopTheme = (nextTheme: string) => {
    if (themeChangeTimerRef.current) {
      clearTimeout(themeChangeTimerRef.current)
      themeChangeTimerRef.current = null
    }

    setPendingTheme(null)
    applyTheme(nextTheme)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PaletteIcon className="size-4" />
          Chủ đề
        </CardTitle>
        <CardDescription>
          Chọn cách Finance Tracker hiển thị trên thiết bị này.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel>Chế độ hiển thị</FieldLabel>
            <FieldDescription>
              Chế độ hệ thống sẽ tự đổi theo cài đặt sáng hoặc tối của thiết bị.
            </FieldDescription>
          </FieldContent>

          <Tabs
            value={displayedTheme}
            onValueChange={updateMobileTheme}
            className="w-full md:hidden"
          >
            <TabsList className="w-full" aria-label="Chế độ hiển thị">
              <TabsTrigger value="light">Sáng</TabsTrigger>
              <TabsTrigger value="dark">Tối</TabsTrigger>
              <TabsTrigger value="system">Hệ thống</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden md:block">
            <Select value={selectedTheme} onValueChange={updateDesktopTheme}>
              <SelectTrigger id="settings-theme" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="end"
                showScrollButtons={false}
              >
                <SelectGroup>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <SunIcon className="size-4" />
                      Sáng
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <MoonIcon className="size-4" />
                      Tối
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <MonitorIcon className="size-4" />
                      Theo hệ thống
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </Field>
      </CardContent>
    </Card>
  )
}
