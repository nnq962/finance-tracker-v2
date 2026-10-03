"use client"

import type * as React from "react"
import { SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * The way into the AI assistant on any page: a button with a sparkle and,
 * given `remaining`, how many requests are left today. Its colour is set
 * where it is used, so it stands out from the page's ordinary actions.
 */
export function AiAssistButton({
  children = "Hỏi AI",
  remaining,
  ...props
}: React.ComponentProps<typeof Button> & { remaining?: number }) {
  return (
    <Button type="button" {...props}>
      <SparklesIcon aria-hidden="true" />
      {children}
      {remaining === undefined ? null : (
        <Badge variant="grape">
          {remaining}
          <span className="sr-only"> lượt còn lại hôm nay</span>
        </Badge>
      )}
    </Button>
  )
}
