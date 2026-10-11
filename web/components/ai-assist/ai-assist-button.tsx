"use client"

import type * as React from "react"

import { BotIcon } from "@/components/app/bot-icon"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * The way into the AI assistant on any page: a button with LiuLiu's face and,
 * given `remaining`, how many requests are left (this month's and AI credits). Its colour is set
 * where it is used, so it stands out from the page's ordinary actions.
 */
export function AiAssistButton({
  children = "Hỏi AI",
  remaining,
  ...props
}: React.ComponentProps<typeof Button> & { remaining?: number }) {
  return (
    <Button type="button" {...props}>
      <BotIcon />
      {children}
      {remaining === undefined ? null : (
        <Badge variant="secondary">
          {remaining}
          <span className="sr-only"> lượt còn lại</span>
        </Badge>
      )}
    </Button>
  )
}
