"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  HandCoinsIcon,
  TagsIcon,
  Trash2Icon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { wipeUserDataAction } from "@/lib/user-data/actions"
import { isWipeConfirmWord, WIPE_CONFIRM_WORD } from "@/lib/user-data/confirm"
import type { UserDataSummary } from "@/lib/user-data/repository"

const formatCount = (count: number) => count.toLocaleString("vi-VN")

/**
 * The sheet behind "Xoá toàn bộ dữ liệu" (in the Dữ liệu group since
 * 2026-10-20): what goes and what stays. Nothing to undo, so the user types
 * XOÁ first; then the app starts over with the welcome.
 */
export function WipeDataSheet({ summary, open, onOpenChange }: { summary: UserDataSummary; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [word, setWord] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const wipe = async () => {
    if (pending) return
    if (!isWipeConfirmWord(word)) {
      setError(`Gõ ${WIPE_CONFIRM_WORD} vào ô trên để xoá.`)
      return
    }

    setPending(true)
    try {
      const result = await wipeUserDataAction(word)
      if (!result.success) {
        toast.error(result.error)
        setPending(false)
        return
      }
      // Full navigation: nothing of the old data stays in the client cache,
      // and the overview opens with the welcome, as for a new user.
      window.location.replace("/overview")
    } catch {
      toast.error("Không xoá được dữ liệu. Vui lòng thử lại.")
      setPending(false)
    }
  }

  return (
    <>
      <PageSheet
        title="Xoá dữ liệu"
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
          <Button
            variant="destructive"
            className="w-full"
            disabled={pending}
            onClick={() => void wipe()}
          >
            {pending ? <Spinner /> : <Trash2Icon />}
            {pending ? "Đang xoá..." : "Xoá vĩnh viễn"}
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-3 px-4 pt-2 text-center">
          <IconTile icon={Trash2Icon} tone="expense" size="lg" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Xoá toàn bộ dữ liệu?</h2>
            <p className="text-sm text-muted-foreground">
              Mọi thứ bạn đã ghi trong Timi sẽ bị xoá vĩnh viễn, không khôi phục được.
            </p>
          </div>
        </div>

        <SettingsGroup
          title="Sẽ bị xoá"
          footer="Vẫn giữ: tài khoản Google, gói Pro, lượt AI và giờ nhắc ghi chi tiêu."
        >
          <SettingsRow icon={WalletIcon} title="Tài khoản và hũ" value={formatCount(summary.accounts)} />
          <SettingsRow icon={ArrowLeftRightIcon} title="Giao dịch" value={formatCount(summary.transactions)} />
          <SettingsRow icon={HandCoinsIcon} title="Khoản vay nợ" value={formatCount(summary.debts)} />
          <SettingsRow icon={UsersIcon} title="Danh bạ" value={`${formatCount(summary.contacts)} người`} />
          <SettingsRow icon={TagsIcon} title="Hạng mục" value="Về mặc định" />
        </SettingsGroup>

        <FormSection description="Sau khi xoá, Timi mở lại màn chào như lần đầu.">
          <FieldGroup>
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="wipe-confirm">Gõ {WIPE_CONFIRM_WORD} để xác nhận</FieldLabel>
              <Input
                id="wipe-confirm"
                value={word}
                placeholder={WIPE_CONFIRM_WORD}
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
    </>
  )
}
