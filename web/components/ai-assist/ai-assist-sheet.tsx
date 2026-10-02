"use client"

import * as React from "react"
import { KeyboardIcon, MicIcon, SendHorizontalIcon, SparklesIcon, SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import { useSpeechRecognition } from "./use-speech-recognition"

type Phase<Result> =
  // After a failed request, why it failed; the request stays to try again.
  | { name: "input"; error?: string }
  // The token tells this request's answer from one already abandoned.
  | { name: "thinking"; text: string; token: object }
  | { name: "result"; text: string; result: Result }

type AiAssistSheetProps<Result> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What to ask for, e.g. "Bạn vừa tiêu gì?". */
  prompt: string
  /** Tappable sample requests, shown before anything is said. */
  examples: string[]
  /** Turns what was said into a result; rejects with a message to show. */
  onSubmit: (text: string) => Promise<Result>
  renderResult: (result: Result, actions: { retry: () => void; close: () => void }) => React.ReactNode
}

/**
 * The assistant in a small sheet rising from the bottom (a drawer on phones,
 * a floating panel on wider screens): speak or type, the request goes to
 * `onSubmit`, and its result replaces the input until asked again.
 */
export function AiAssistSheet<Result>({
  open,
  onOpenChange,
  prompt,
  examples,
  onSubmit,
  renderResult,
}: AiAssistSheetProps<Result>) {
  const [phase, setPhase] = React.useState<Phase<Result>>({ name: "input" })
  const [typing, setTyping] = React.useState(false)
  const [text, setText] = React.useState("")
  const submit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const token = {}
    // Only the request still awaited moves on; after a reset its answer is dropped.
    const settle = (next: Phase<Result>) =>
      setPhase((current) =>
        current.name === "thinking" && current.token === token ? next : current,
      )
    setPhase({ name: "thinking", text: trimmed, token })
    onSubmit(trimmed).then(
      (result) => settle({ name: "result", text: trimmed, result }),
      (reason: unknown) =>
        settle({
          name: "input",
          error: reason instanceof Error ? reason.message : "AI chưa hiểu yêu cầu này.",
        }),
    )
  }

  const speech = useSpeechRecognition({ onEnd: submit })
  const heard = `${speech.transcript} ${speech.interim}`.trim()

  const reset = () => {
    speech.cancel()
    setPhase({ name: "input" })
    setText("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const showTyping = typing || !speech.supported

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        // A drawer on phones; from sm a panel floating above the page's
        // bottom edge, no wider than a phone.
        className="mx-auto max-h-[85dvh] w-full max-w-lg gap-0 rounded-t-2xl border-x pb-[env(safe-area-inset-bottom,0px)] sm:bottom-4 sm:rounded-2xl sm:border"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="pr-12">
          <SheetTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-[#a78bfa]" aria-hidden="true" />
            Trợ lý AI
          </SheetTitle>
          <SheetDescription>{prompt}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {phase.name === "result" ? (
            <div className="space-y-4">
              <Said text={phase.text} />
              {renderResult(phase.result, { retry: reset, close: () => handleOpenChange(false) })}
            </div>
          ) : phase.name === "thinking" ? (
            <div className="space-y-4" role="status" aria-label="AI đang xử lý">
              <Said text={phase.text} />
              <Card>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SparklesIcon className="size-4 animate-pulse text-[#a78bfa]" aria-hidden="true" />
                    Đang hiểu ý bạn…
                  </p>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-5 w-3/5" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-5">
              {showTyping ? (
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      submit(text)
                    }
                  }}
                  placeholder="Ví dụ: ăn trưa 45 nghìn bằng MoMo"
                  aria-label="Yêu cầu cho AI"
                  autoFocus
                />
              ) : (
                <Card>
                  <CardContent className="flex min-h-24 items-center justify-center text-center">
                    {heard ? (
                      <p className="font-heading text-lg leading-snug font-extrabold" aria-live="polite">
                        {speech.transcript}
                        {speech.interim ? (
                          <span className="text-muted-foreground"> {speech.interim}</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {speech.listening ? "Đang nghe… nói xong thì bấm dừng." : "Bấm micro và nói tự nhiên."}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {phase.error || speech.error ? (
                <p className="px-3 text-sm text-[#c8393a] dark:text-[#ff9b93]" role="alert">
                  {phase.error ?? speech.error}
                </p>
              ) : null}

              {!heard && !text ? (
                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Thử nói
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((example) => (
                      <Button
                        key={example}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={speech.listening}
                        onClick={() => submit(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
                {speech.supported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="justify-self-start"
                    aria-label={showTyping ? "Nói thay vì gõ" : "Gõ thay vì nói"}
                    aria-pressed={typing}
                    disabled={speech.listening}
                    onClick={() => setTyping((value) => !value)}
                  >
                    {showTyping ? <MicIcon /> : <KeyboardIcon />}
                  </Button>
                ) : (
                  <span />
                )}

                {showTyping ? (
                  <Button type="button" disabled={!text.trim()} onClick={() => submit(text)}>
                    <SendHorizontalIcon />
                    Gửi
                  </Button>
                ) : (
                  <span className="relative inline-flex">
                    {speech.listening ? (
                      <>
                        <span className="ai-ripple" aria-hidden="true" />
                        <span className="ai-ripple" aria-hidden="true" />
                      </>
                    ) : null}
                    {/* The one large control of the sheet, sized for a thumb. */}
                    <Button
                      type="button"
                      variant={speech.listening ? "destructive" : "default"}
                      className="size-16 rounded-full [&_svg:not([class*='size-'])]:size-7"
                      aria-label={speech.listening ? "Dừng nghe" : "Bắt đầu nói"}
                      onClick={speech.listening ? speech.stop : speech.start}
                    >
                      {speech.listening ? <SquareIcon /> : <MicIcon />}
                    </Button>
                  </span>
                )}
                <span />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** What was asked, quoted above the answer. */
function Said({ text }: { text: string }) {
  return (
    <p className="px-3 text-sm text-muted-foreground">
      “{text}”
    </p>
  )
}
