"use client"

import * as React from "react"
import { SaveIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AccountDialogContentProps = {
  name: string
  onSaveName: (name: string) => void
}

export function AccountDialogContent({
  name: initialName,
  onSaveName,
}: AccountDialogContentProps) {
  const [name, setName] = React.useState(initialName)
  const trimmedName = name.trim()

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmedName) onSaveName(trimmedName)
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>
              Tên này được hiển thị trong Finance Tracker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="user-menu-name">Tên hiển thị</FieldLabel>
              <Input
                id="user-menu-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={!trimmedName}>
              <SaveIcon />
              Lưu thay đổi
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
          <CardDescription>
            Thông tin chung về tài khoản Finance Tracker.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary">Đang hoạt động</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Ngày tham gia</p>
            <p className="text-sm font-medium">13/09/2026</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
