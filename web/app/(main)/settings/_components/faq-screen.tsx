"use client"

import * as React from "react"
import { ChevronDownIcon, MailIcon, MessageSquareIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SUPPORT_EMAIL } from "@/lib/site"
import { faq } from "@/lib/support/faq"
import { cn } from "@/lib/utils"

/** The questions as rows that unfold their answer; the first one open. */
export function FaqList({ onFeedback }: { onFeedback?: () => void }) {
  const [open, setOpen] = React.useState<string | null>(faq[0]?.items[0]?.q ?? null)

  return (
    <div className="space-y-6">
      {faq.map((group) => (
        <SettingsGroup key={group.title} title={group.title}>
          {group.items.map((item) => {
            const expanded = open === item.q
            return (
              <SettingsRow
                key={item.q}
                title={item.q}
                expanded={expanded}
                chevron={false}
                onClick={() => setOpen(expanded ? null : item.q)}
                // The answer as the row's description while open (a block inside the <p> would not be valid HTML, so no slide).
                description={expanded ? item.a : undefined}
                fullDescription
                action={<ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} aria-hidden="true" />}
              />
            )
          })}
        </SettingsGroup>
      ))}
      <SettingsGroup footer="Không thấy câu bạn cần?">
        {onFeedback ? <SettingsRow icon={MessageSquareIcon} title="Góp ý với Timi" onClick={onFeedback} /> : null}
        <SettingsRow icon={MailIcon} title="Email hỗ trợ" value={SUPPORT_EMAIL} onClick={() => window.open(`mailto:${SUPPORT_EMAIL}`, "_self")} />
      </SettingsGroup>
    </div>
  )
}
