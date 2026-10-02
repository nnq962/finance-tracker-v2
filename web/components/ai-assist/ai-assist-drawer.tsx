"use client"

import * as React from "react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { KeyboardIcon, MicIcon, SendHorizontalIcon, SparklesIcon, SquareIcon, XIcon } from "lucide-react"

import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AiDrawer,
  AiDrawerClose,
  AiDrawerContent,
  AiDrawerDescription,
  AiDrawerHeader,
  AiDrawerTitle,
} from "@/components/ui/ai-drawer"
import { Textarea } from "@/components/ui/textarea"

import { useSpeechRecognition } from "./use-speech-recognition"

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Each step settles in from slightly above, out of a light blur.
const stepMotion = {
  initial: { opacity: 0, y: -8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: 8, filter: "blur(4px)" },
  transition: { duration: 0.28, ease: EASE_OUT },
}

type Phase<Result> =
  // After a failed request, why it failed; the request stays to try again.
  | { name: "input"; error?: string }
  // The token tells this request's answer from one already abandoned.
  | { name: "thinking"; text: string; token: object }
  | { name: "result"; text: string; result: Result }

type AiAssistDrawerProps<Result> = {
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
 * The assistant in a drawer dropping from the top: speak or type, the
 * request goes to `onSubmit`, and its result replaces the input until asked
 * again. Swiping it back up, or tapping outside, closes it.
 */
export function AiAssistDrawer<Result>({
  open,
  onOpenChange,
  prompt,
  examples,
  onSubmit,
  renderResult,
}: AiAssistDrawerProps<Result>) {
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
    <AiDrawer open={open} onOpenChange={handleOpenChange}>
      <AiDrawerContent>
        {/* The drawer spans the screen like shadcn's; its content keeps a
            phone's width, centred. */}
        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
          <AiDrawerHeader className="relative px-12">
            <AiDrawerTitle className="flex items-center justify-center gap-2 md:justify-start">
              <SparklesIcon className="size-4 text-[#a78bfa]" aria-hidden="true" />
              Trợ lý AI
            </AiDrawerTitle>
            <AiDrawerDescription>{prompt}</AiDrawerDescription>
            <AiDrawerClose asChild>
              <Button type="button" variant="ghost" size="icon-sm" className="absolute top-3 right-3" aria-label="Đóng">
                <XIcon />
              </Button>
            </AiDrawerClose>
          </AiDrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
            <MotionConfig reducedMotion="user">
              {/* The drawer's height follows each step; the 4px margin and padding
                  keep the cards' rings clear of the clipping. */}
              <AutoHeight className="-m-1 p-1" deps={[phase.name, showTyping]}>
                <AnimatePresence mode="wait" initial={false}>
                  {phase.name === "result" ? (
                    <motion.div key="result" className="space-y-4" {...stepMotion}>
                      <Said text={phase.text} />
                      {renderResult(phase.result, { retry: reset, close: () => handleOpenChange(false) })}
                    </motion.div>
                  ) : phase.name === "thinking" ? (
                    <motion.div key="thinking" className="space-y-4" role="status" aria-label="AI đang xử lý" {...stepMotion}>
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
                    </motion.div>
                  ) : (
                    <motion.div key="input" className="space-y-5" {...stepMotion}>
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
                                {/* Each word rises in as it is heard. */}
                                {speech.transcript.split(" ").filter(Boolean).map((word, index) => (
                                  <motion.span
                                    key={`${index}-${word}`}
                                    className="inline-block whitespace-pre"
                                    initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{ duration: 0.25, ease: EASE_OUT }}
                                  >
                                    {word}{" "}
                                  </motion.span>
                                ))}
                                {speech.interim ? (
                                  <span className="text-muted-foreground">{speech.interim}</span>
                                ) : null}
                              </p>
                            ) : (
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.p
                                  key={speech.listening ? "listening" : "idle"}
                                  className="text-sm text-muted-foreground"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {speech.listening ? "Đang nghe… nói xong thì bấm dừng." : "Bấm micro và nói tự nhiên."}
                                </motion.p>
                              </AnimatePresence>
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
                            {examples.map((example, index) => (
                              <motion.span
                                key={example}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.08 + index * 0.06 }}
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={speech.listening}
                                  onClick={() => submit(example)}
                                >
                                  {example}
                                </Button>
                              </motion.span>
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
                            {/* The one large control of the drawer, sized for a thumb. */}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </AutoHeight>
            </MotionConfig>
          </div>
        </div>
      </AiDrawerContent>
    </AiDrawer>
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
