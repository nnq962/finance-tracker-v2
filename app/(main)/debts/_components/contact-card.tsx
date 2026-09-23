"use client"

import * as React from "react"
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import type { Contact, NewContact } from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"

type ContactCardProps = {
  contact: Contact
  hasDebts: boolean
  onEdit: (values: NewContact) => Promise<void>
  onDelete: () => Promise<void>
}

export function ContactCard({ contact, hasDebts, onEdit, onDelete }: ContactCardProps) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const deleting = React.useRef(false)
  const menuButton = React.useRef<HTMLButtonElement>(null)
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex min-w-0 items-center gap-3">
      <Avatar size="lg"><AvatarFallback>{contact.initials}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle><span className="block truncate" title={contact.name}>{contact.name}</span></CardTitle>
            <CardDescription><span className="block truncate" title={contact.relationship}>{contact.relationship || "Chưa cập nhật quan hệ"}</span></CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={menuButton} type="button" variant="ghost" size="icon-sm" aria-label={`Thao tác với ${contact.name}`}><EllipsisIcon /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(event) => {
              if (editing || open) event.preventDefault()
            }}>
              <DropdownMenuItem onSelect={() => setEditing(true)}><PencilIcon />Sửa thông tin</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => { setErrorMessage(null); setOpen(true) }}><Trash2Icon />Xoá người</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <AddContactSheet contact={contact} onAddContact={onEdit} open={editing} onOpenChange={setEditing} returnFocusRef={menuButton} />
      <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!deleting.current) setOpen(nextOpen) }}>
        <AlertDialogContent onCloseAutoFocus={(event) => {
          event.preventDefault()
          menuButton.current?.focus()
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle>{hasDebts ? "Chưa thể xoá người liên hệ" : "Xoá người liên hệ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDebts
                ? `${contact.name} đang có lịch sử khoản nợ. Giữ người liên hệ để không mất thông tin của các khoản này.`
                : `Xoá ${contact.name} khỏi danh bạ? Hành động này không thể hoàn tác.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{hasDebts ? "Đóng" : "Huỷ"}</AlertDialogCancel>
            {!hasDebts ? <AlertDialogAction disabled={pending} onClick={async (event) => {
              event.preventDefault()
              if (deleting.current) return
              deleting.current = true
              setPending(true)
              setErrorMessage(null)
              try {
                await onDelete()
                setOpen(false)
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Không thể xoá người liên hệ.")
              } finally {
                deleting.current = false
                setPending(false)
              }
            }}>{pending ? "Đang xoá…" : "Xoá người"}</AlertDialogAction> : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
