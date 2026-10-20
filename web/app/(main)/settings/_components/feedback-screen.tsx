"use client"

import * as React from "react"
import { SendIcon } from "lucide-react"
import { toast } from "sonner"

import { ChipButton, ChipRow } from "@/components/app/chip-row"
import { FormSection } from "@/components/app/form-section"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedbackAction } from "@/lib/feedback/actions"
import { FEEDBACK_MAX_LENGTH, feedbackKindLabels, feedbackKinds, type FeedbackKind } from "@/lib/feedback/types"

/** What this device is, in a few words, for a bug report. */
function describeDevice() {
  const ua = navigator.userAgent
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : "khác"
  const browser = /CriOS|Chrome/.test(ua) && !/Edg/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox|FxiOS/.test(ua) ? "Firefox" : "trình duyệt khác"
  const installed = window.matchMedia("(display-mode: standalone)").matches ? " · đã cài" : ""
  return `${os} · ${browser}${installed}`
}

/**
 * Cài đặt › Hỗ trợ › Góp ý với Timi (2026-10-20): the kind, the words, and
 * whether to attach the version and device; sent to the person behind Timi.
 */
export function FeedbackScreen({ onSent }: { onSent: () => void }) {
  const [kind, setKind] = React.useState<FeedbackKind>("idea")
  const [message, setMessage] = React.useState("")
  const [attach, setAttach] = React.useState(true)
  const [pending, setPending] = React.useState(false)
  const [device, setDevice] = React.useState("")
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after mount
    setDevice(describeDevice())
  }, [])

  const send = async () => {
    if (pending || !message.trim()) return
    setPending(true)
    try {
      const result = await submitFeedbackAction({ kind, message, device: attach ? device : undefined })
      if (!result.success) {
        toast.error(result.error)
        setPending(false)
        return
      }
      toast.success("Đã gửi. Cảm ơn bạn!")
      onSent()
    } catch {
      toast.error("Không gửi được. Kiểm tra mạng rồi thử lại.")
      setPending(false)
    }
  }

  const version = process.env.NEXT_PUBLIC_APP_VERSION

  return (
    <div className="space-y-6">
      <ChipRow>
        {feedbackKinds.map((item) => (
          <ChipButton key={item} type="button" active={kind === item} onClick={() => setKind(item)}>
            {feedbackKindLabels[item]}
          </ChipButton>
        ))}
      </ChipRow>
      <FormSection>
        <FieldGroup>
          <Field>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, FEEDBACK_MAX_LENGTH))}
              placeholder={kind === "bug" ? "Bạn làm gì, Timi làm gì, bạn mong gì? Càng cụ thể càng dễ sửa." : "Bạn muốn Timi làm gì tốt hơn? Càng cụ thể càng dễ sửa."}
              rows={6}
              className="resize-none"
              disabled={pending}
              aria-label="Nội dung góp ý"
            />
          </Field>
        </FieldGroup>
      </FormSection>
      <SettingsGroup footer="Góp ý đến thẳng người làm Timi. Nếu cần hỏi lại, Timi trả lời qua email đăng nhập của bạn.">
        <SettingsRow
          title="Gửi kèm phiên bản và thiết bị"
          description={[version, device].filter(Boolean).join(" · ") || undefined}
          action={<Switch aria-label="Gửi kèm phiên bản và thiết bị" checked={attach} onCheckedChange={setAttach} />}
        />
      </SettingsGroup>
      <Button className="w-full" disabled={pending || !message.trim()} onClick={() => void send()}>
        {pending ? <Spinner /> : <SendIcon data-icon="inline-start" />}
        {pending ? "Đang gửi..." : "Gửi"}
      </Button>
    </div>
  )
}
