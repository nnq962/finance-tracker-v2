"use client"

import * as React from "react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { EraserIcon, KeyboardIcon, MicIcon, SendHorizontalIcon, SparklesIcon, SquareIcon, XIcon } from "lucide-react"

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
import { cn } from "@/lib/utils"

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
  /** What to ask for, e.g. "Bạn vừa tiêu gì?", read to screen readers. */
  prompt: string
  /** Sample requests, faded in turn inside the empty input before anything is said. */
  examples: string[]
  /** Requests left this month out of the plan's limit, and AI credits, shown under the title. */
  quota?: { remaining: number; limit: number; credits: number }
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
  quota,
  onSubmit,
  renderResult,
}: AiAssistDrawerProps<Result>) {
  const [phase, setPhase] = React.useState<Phase<Result>>({ name: "input" })
  const [typing, setTyping] = React.useState(false)
  const [text, setText] = React.useState("")
  // A request answered after the drawer was closed is dropped, so the
  // content stays as it was while the drawer slides away.
  const openRef = React.useRef(open)
  React.useEffect(() => {
    openRef.current = open
  }, [open])
  const submit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const token = {}
    // Only the request still awaited moves on; after a reset its answer is dropped.
    const settle = (next: Phase<Result>) =>
      setPhase((current) =>
        openRef.current && current.name === "thinking" && current.token === token ? next : current,
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

  // Closing only stops the microphone; the content stays put while the
  // drawer slides away and is cleared once it is gone (see onAnimationEnd).
  const handleOpenChange = (next: boolean) => {
    if (!next) speech.cancel()
    onOpenChange(next)
  }

  const showTyping = typing || !speech.supported
  const hints = ["Bấm micro và nói tự nhiên.", ...examples.map((example) => `“${example}”`)]
  const hintIndex = useRotatingIndex(hints.length)

  return (
    <AiDrawer open={open} onOpenChange={handleOpenChange}>
      <AiDrawerContent
        onAnimationEnd={(event) => {
          // The drawer's own closing slide, not one bubbling from inside it.
          if (event.target === event.currentTarget && !open) reset()
        }}
      >
        {/* The drawer spans the screen like shadcn's; its content keeps a
            phone's width, centred. */}
        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
          {/* Centred on every screen; the Drawer header aligns left from md. */}
          <AiDrawerHeader className="relative px-12 md:text-center">
            <AiDrawerTitle className="flex items-center justify-center gap-2">
              <SparklesIcon className="size-4 text-[#a78bfa]" aria-hidden="true" />
              Trợ lý AI
            </AiDrawerTitle>
            <AiDrawerDescription className="sr-only">{prompt}</AiDrawerDescription>
            {quota ? (
              <p className="text-sm text-muted-foreground">
                {quota.remaining > 0
                  ? `Còn ${quota.remaining}/${quota.limit} lượt tháng này`
                  : `Đã dùng hết ${quota.limit} lượt tháng này`}
                {quota.credits > 0 ? ` · ${quota.credits} lượt thưởng` : ""}
              </p>
            ) : null}
            <AiDrawerClose asChild>
              <Button type="button" variant="ghost" size="icon-sm" className="absolute top-3 right-3" aria-label="Đóng">
                <XIcon />
              </Button>
            </AiDrawerClose>
          </AiDrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <MotionConfig reducedMotion="user">
              {/* The drawer's height follows each step. It clips, so it
                  reaches 12px into the padding at the sides and bottom, room
                  for the cards' rings and the microphone's ripples, and pads
                  the content back to 16px from those edges. Above, the
                  scroll area clips, so the rings get 4px below the header. */}
              <AutoHeight className="-mx-3 -mb-3 px-3 pt-1 pb-3" deps={[phase.name, showTyping]}>
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
                          placeholder="Nhập khoản thu chi…"
                          aria-label="Yêu cầu cho AI"
                        />
                      ) : (
                        <Card>
                          <CardContent className="flex min-h-14 items-center justify-center text-center">
                            {heard ? (
                              <p className="font-heading text-base leading-snug font-extrabold" aria-live="polite">
                                {/* Each word rises in as it is heard, muted until the
                                    recogniser settles on it, then darkens in place:
                                    keyed by position, a settled word keeps its box. */}
                                {heardWords(speech.transcript, speech.interim).map(({ word, settled }, index) => (
                                  <React.Fragment key={index}>
                                    {index > 0 ? " " : null}
                                    <motion.span
                                      className={cn(
                                        "inline-block transition-colors duration-300",
                                        !settled && "text-muted-foreground",
                                      )}
                                      initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
                                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                      transition={{ duration: 0.25, ease: EASE_OUT }}
                                    >
                                      {word}
                                    </motion.span>
                                  </React.Fragment>
                                ))}
                              </p>
                            ) : (
                              <TurningLines
                                lines={[...hints, "Đang nghe… nói xong thì bấm dừng."]}
                                active={speech.listening ? hints.length : hintIndex}
                              />
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Above the errors, which come and go, so the microphone
                          stays put. */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
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
                            {/* Round and a size up from the icon buttons beside it. */}
                            <Button
                              type="button"
                              size="icon-lg"
                              className="size-12 rounded-full [&_svg:not([class*='size-'])]:size-5"
                              aria-label={speech.listening ? "Dừng nghe" : "Bắt đầu nói"}
                              onClick={speech.listening ? speech.stop : speech.start}
                            >
                              {speech.listening ? <SquareIcon /> : <MicIcon />}
                            </Button>
                          </span>
                        )}

                        <AnimatePresence initial={false}>
                          {showTyping && text ? (
                            <motion.span
                              key="clear"
                              className="justify-self-end"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.18, ease: EASE_OUT }}
                            >
                              <Button type="button" variant="ghost" size="icon" aria-label="Xoá chữ" onClick={() => setText("")}>
                                <EraserIcon />
                              </Button>
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </div>

                      {phase.error || speech.error ? (
                        <p className="px-3 text-sm text-[#c8393a] dark:text-[#ff9b93]" role="alert">
                          {phase.error ?? speech.error}
                        </p>
                      ) : null}

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

/** The words heard so far, the settled ones first. */
function heardWords(transcript: string, interim: string) {
  const words = (text: string, settled: boolean) =>
    text.split(/\s+/).filter(Boolean).map((word) => ({ word, settled }))
  return [...words(transcript, true), ...words(interim, false)]
}

/** Counts through `count` places, one every few seconds. */
function useRotatingIndex(count: number) {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    if (count < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 3000)
    return () => window.clearInterval(timer)
  }, [count])
  return index % count
}

/**
 * Shows `lines[active]`, the old line drifting up and out as the new one
 * rises in over it. Every line sits hidden in the same cell, so the tallest
 * sets the height and a turn never moves the drawer.
 */
function TurningLines({ lines, active }: { lines: string[]; active: number }) {
  return (
    <div className="grid w-full items-center text-sm text-muted-foreground [&>*]:col-start-1 [&>*]:row-start-1">
      {lines.map((line, index) => (
        <p key={index} className="invisible" aria-hidden="true">
          {line}
        </p>
      ))}
      <AnimatePresence initial={false}>
        <motion.p
          key={active}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE_OUT } }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
        >
          {lines[active]}
        </motion.p>
      </AnimatePresence>
    </div>
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
