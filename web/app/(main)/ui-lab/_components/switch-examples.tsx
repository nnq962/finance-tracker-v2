"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function SwitchExamples() {
  const [defaultEnabled, setDefaultEnabled] = React.useState(false)
  const [smallEnabled, setSmallEnabled] = React.useState(true)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="lab-switch-default">Mặc định</Label>
        <Switch
          id="lab-switch-default"
          checked={defaultEnabled}
          onCheckedChange={setDefaultEnabled}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="lab-switch-small">Nhỏ</Label>
        <Switch
          id="lab-switch-small"
          size="sm"
          checked={smallEnabled}
          onCheckedChange={setSmallEnabled}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="lab-switch-disabled-off">Vô hiệu · tắt</Label>
        <Switch id="lab-switch-disabled-off" disabled />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="lab-switch-disabled-on">Vô hiệu · bật</Label>
        <Switch id="lab-switch-disabled-on" defaultChecked disabled />
      </div>
    </div>
  )
}
