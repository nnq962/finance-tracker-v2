"use client"

import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { signOutCurrentUser } from "@/lib/firebase/auth"
import { deleteAccountAction } from "@/lib/user-data/actions"
import { DELETE_ACCOUNT_WORD, isDeleteAccountWord } from "@/lib/user-data/confirm"

/**
 * Cài đặt › Dữ liệu › Xoá tài khoản (2026-10-20): what goes, the words to
 * type, the red button. Done, the sign-in is gone too, so the app clears its
 * session and leaves for the landing page.
 */
export function DeleteAccountSheet({ email, proEndsAt, open, onOpenChange }: { email?: string; proEndsAt: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [word, setWord] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const remove = async () => {
    if (pending) return
    if (!isDeleteAccountWord(word)) {
      setError(`Gõ ${DELETE_ACCOUNT_WORD} vào ô trên để xoá.`)
      return
    }
    setPending(true)
    try {
      const result = await deleteAccountAction(word)
      if (!result.success) {
        toast.error(result.error)
        setPending(false)
        return
      }
      // The account is gone on the server; drop the session here and start over on the landing page.
      await signOutCurrentUser().catch(() => undefined)
      window.location.replace("/")
    } catch {
      toast.error("Không xoá được tài khoản. Vui lòng thử lại.")
      setPending(false)
    }
  }

  return (
    <PageSheet
      title="Xoá tài khoản"
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        onOpenChange(next)
        if (!next) {
          setWord("")
          setError(null)
        }
      }}
      disabled={pending}
      className="space-y-6"
      footer={
        <Button variant="destructive-solid" className="w-full" disabled={pending || !isDeleteAccountWord(word)} onClick={() => void remove()}>
          {pending ? <Spinner /> : <TriangleAlertIcon />}
          {pending ? "Đang xoá..." : "Xoá tài khoản vĩnh viễn"}
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-3 px-4 pt-2 text-center">
        <IconTile icon={TriangleAlertIcon} tone="expense" size="lg" />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Xoá tài khoản Timi của bạn?</h2>
          {email ? <p className="text-sm text-muted-foreground">{email}</p> : null}
        </div>
      </div>

      <SettingsGroup>
        <SettingsRow title="Xoá toàn bộ dữ liệu" description="Tài khoản, giao dịch, vay nợ, hạn mức, hũ tiết kiệm" fullDescription />
        <SettingsRow title="Gỡ đăng nhập Google khỏi Timi" description="Đăng nhập lại sẽ tạo tài khoản mới, trống" fullDescription />
        <SettingsRow title="Gói Pro còn lại không hoàn" description={proEndsAt ? `Pro của bạn còn đến ${new Date(proEndsAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : "Bạn đang dùng gói Free"} fullDescription />
        <SettingsRow title="Không khôi phục được" description="Hãy xuất dữ liệu trước nếu cần giữ" fullDescription />
      </SettingsGroup>

      <FormSection>
        <FieldGroup>
          <Field data-invalid={Boolean(error) || undefined}>
            <FieldLabel htmlFor="delete-account-confirm">Gõ {DELETE_ACCOUNT_WORD} để xác nhận</FieldLabel>
            <Input
              id="delete-account-confirm"
              value={word}
              placeholder={DELETE_ACCOUNT_WORD}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={pending}
              aria-invalid={Boolean(error) || undefined}
              onChange={(event) => {
                setWord(event.target.value)
                setError(null)
              }}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        </FieldGroup>
      </FormSection>
    </PageSheet>
  )
}
