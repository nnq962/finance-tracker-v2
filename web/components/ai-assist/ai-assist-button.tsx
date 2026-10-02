"use client"

import type * as React from "react"
import { SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The way into the AI assistant on any page: an outline button inside a
 * turning ring of colour (`.ai-glow` in globals.css), so it reads as special
 * next to the page's ordinary actions.
 */
export function AiAssistButton({
  children = "Hỏi AI",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <span className="ai-glow">
      <Button type="button" variant="outline" {...props}>
        <SparklesIcon className="text-[#a78bfa]" aria-hidden="true" />
        {children}
      </Button>
    </span>
  )
}
