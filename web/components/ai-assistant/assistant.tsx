"use client"

import * as React from "react"
import { ArrowUpIcon, MicIcon, SquareIcon, XIcon } from "lucide-react"

import { BotIcon } from "@/components/app/bot-icon"
import { VoiceWave } from "@/components/app/voice-wave"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { FollowChip, ReplyView } from "./answer-view"
import { useAssistant, type Assistant, type AssistantPhase } from "./use-assistant"

/* ------------------------------------------------------------- the opener */

const AssistantContext = React.createContext<{ open: () => void } | null>(null)

/** Opens the assistant, from anywhere inside the app's shell. */
export function useOpenAssistant() {
  const context = React.useContext(AssistantContext)
  if (!context) throw new Error("useOpenAssistant needs an AssistantProvider")
  return context.open
}

/**
 * The AI assistant, one for the whole app (2026-10-11): opened from the
 * button beside the tab bar on phones, from the header on computers. It sits
 * over the page, dimmed, with its bar where the tab bar was.
 */
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo(() => ({ open: () => setOpen(true) }), [])
  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantFrame open={open} onClose={() => setOpen(false)} />
    </AssistantContext.Provider>
  )
}

/** The way in beside the tab bar, as iOS 26 sets a lone action (Search) beside it: LiuLiu's face, blinking when pressed. */
export function AssistantTabButton({ className }: { className?: string }) {
  const open = useOpenAssistant()
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Hỏi LiuLiu, trợ lý AI"
      className={cn(
        "group/button pointer-events-auto flex size-15 shrink-0 touch-manipulation items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_44px_rgb(0_0_0/0.2),0_2px_8px_rgb(0_0_0/0.08)] outline-none transition-transform duration-150 select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 motion-reduce:transition-none dark:shadow-[0_14px_44px_rgb(0_0_0/0.5)]",
        className,
      )}
    >
      <BotIcon className="size-6 text-ai" />
    </button>
  )
}

/** The way in on a computer, in the header. */
export function AssistantHeaderButton() {
  const open = useOpenAssistant()
  return (
    <Button size="sm" onClick={open}>
      <BotIcon className="text-ai" /> Hỏi AI
    </Button>
  )
}

/* -------------------------------------------------------------- motion */

/** Comes in softly each time what it holds changes. */
const enter = "animate-in fade-in-0 duration-200 ease-out motion-reduce:animate-none"
/** A card or a line rising into place: everything that appears does so. */
const rise =
  "animate-in fade-in-0 slide-in-from-bottom-3 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] fill-mode-both motion-reduce:animate-none"
/** What goes sinks and fades. */
const sink =
  "animate-out fade-out-0 slide-out-to-bottom-3 duration-[220ms] ease-[cubic-bezier(0.4,0,1,1)] fill-mode-forwards motion-reduce:animate-none"
/** How long a view takes to go before the next comes in. */
const LEAVE_MS = 220
/** Closing is a little slower than opening, so it is seen to go. */
const CLOSE_MS = 420

/* ---------------------------------------------------------- the frame */

/** How far the on-screen keyboard reaches up, so the bar stays above it. */
function useKeyboardInset() {
  const [inset, setInset] = React.useState(0)
  React.useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)))
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])
  return inset
}

/**
 * Over the page, dimmed as under a sheet (no blur: a blur under a layer
 * fading in shows only once the fade ends). The question and the answer stack
 * up from the bar at the bottom, which rises in where the tab bar was. All of
 * it moves by opacity and transform, which a phone runs off the main thread;
 * only the card's height is laid out anew as it changes.
 */
function AssistantFrame({ open, onClose }: { open: boolean; onClose: () => void }) {
  const assistant = useAssistant()

  // Mounted a moment before it shows and after it hides, so it can move in and out.
  const [mounted, setMounted] = React.useState(open)
  const [shown, setShown] = React.useState(false)
  if (open && !mounted) setMounted(true)
  if (!open && shown) setShown(false)
  const reset = React.useRef(assistant.reset)
  React.useEffect(() => {
    reset.current = assistant.reset
  })
  React.useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(frame)
    }
    const timer = window.setTimeout(() => {
      setMounted(false)
      reset.current()
    }, CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  // Escape closes, as a dialog does.
  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // The newest stays in sight when the stack is taller than the screen, as the card grows too.
  const scroller = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const element = scroller.current
    if (element) element.scrollTop = element.scrollHeight
  })
  React.useEffect(() => {
    const element = scroller.current
    const content = element?.firstElementChild
    if (!element || !content) return
    const observer = new ResizeObserver(() => (element.scrollTop = element.scrollHeight))
    observer.observe(content)
    return () => observer.disconnect()
  }, [mounted])

  const keyboard = useKeyboardInset()

  if (!mounted) return null

  // In: fast then settling. Out: easing in and out, the content a beat ahead of the bar.
  const easeIn = "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0"
  const easeOut = "ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:duration-0"
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Trợ lý AI">
      {/* The tab bar steps aside while the assistant's bar takes its place. */}
      {open ? <span data-hide-tab-bar hidden /> : null}
      {/* The dim on ::before, as the sheets': Safari 26 tints the status bar from a fixed layer's own background. */}
      <button
        type="button"
        aria-label="Đóng trợ lý"
        tabIndex={-1}
        onClick={onClose}
        className={cn(
          "absolute inset-0 transition-opacity before:absolute before:inset-0 before:bg-black/50 dark:before:bg-black/65",
          shown ? cn("opacity-100 duration-300", easeIn) : cn("pointer-events-none opacity-0 duration-[420ms]", easeOut),
        )}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-h-full max-w-lg flex-col justify-end px-4 pt-[calc(env(safe-area-inset-top,0px)+4rem)] pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] md:pb-10"
        style={keyboard ? { paddingBottom: keyboard + 12 } : undefined}
      >
        <div
          ref={scroller}
          className={cn(
            "pointer-events-auto -mx-4 min-h-0 overflow-y-auto overscroll-contain px-4 pb-3 transition-[opacity,translate] [scrollbar-width:none]",
            shown ? cn("translate-y-0 opacity-100 duration-300", easeIn) : cn("translate-y-3 opacity-0 duration-[280ms]", easeOut),
          )}
        >
          <Body assistant={assistant} onNavigate={onClose} />
        </div>
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-3 transition-[opacity,translate,scale]",
            shown
              ? cn("translate-y-0 scale-100 opacity-100 duration-[320ms]", easeIn)
              : cn("translate-y-5 scale-[0.97] opacity-0 delay-[60ms] duration-[360ms]", easeOut),
          )}
        >
          <div className="min-w-0 flex-1">
            <Composer assistant={assistant} />
          </div>
          <button
            type="button"
            aria-label="Đóng trợ lý"
            onClick={onClose}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card shadow-[0_10px_30px_-6px_rgb(0_0_0/0.25)] outline-none transition-transform duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 motion-reduce:transition-none"
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ the composer */

/** One line to speak or type into, and one button at its end. */
function Composer({ assistant }: { assistant: Assistant }) {
  const [text, setText] = React.useState("")
  const { phase } = assistant
  const busy = phase === "transcribing" || phase === "thinking"

  const send = () => {
    if (!text.trim()) return
    assistant.ask(text)
    setText("")
  }

  // ↑ sends, typed or said (as ChatGPT and Claude); ■ stops what runs; the
  // microphone starts. Without a microphone the line only takes typing.
  const action =
    (text.trim() && !busy && phase !== "listening") || (!assistant.canListen && phase !== "thinking")
      ? { name: "send", label: "Gửi", icon: <ArrowUpIcon />, onClick: send, disabled: !text.trim() }
      : phase === "listening"
        ? { name: "send", label: "Gửi", icon: <ArrowUpIcon />, onClick: assistant.send }
        : phase === "thinking"
          ? { name: "stop", label: "Dừng", icon: <SquareIcon className="size-3.5 fill-current" />, onClick: assistant.cancel }
          : { name: "mic", label: "Nói", icon: <MicIcon />, onClick: assistant.listen, disabled: phase === "transcribing" }

  return (
    <form
      className="relative flex h-14 items-center gap-2 rounded-full bg-card pr-1.5 pl-5 shadow-[0_10px_30px_-6px_rgb(0_0_0/0.25)]"
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
    >
      <div key={busy ? phase : phase === "listening" ? "voice" : "input"} className={cn("flex min-w-0 flex-1 items-center", enter)}>
        {phase === "listening" ? (
          assistant.level ? (
            <VoiceWave level={assistant.level} className="h-8" />
          ) : (
            // The browser's recogniser gives words as they come, not a level.
            <p className="truncate text-muted-foreground" aria-live="polite">
              {assistant.heard || "Đang nghe…"}
            </p>
          )
        ) : busy ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner className="size-4" />
            {phase === "transcribing" ? "Đang nhận dạng…" : "Đang trả lời…"}
          </p>
        ) : (
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            enterKeyHint="send"
            maxLength={600}
            aria-label="Câu hỏi cho trợ lý"
            placeholder={phase === "result" ? "Hỏi tiếp…" : "Hỏi hoặc kể khoản chi…"}
            className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      <ComposerButton {...action} />
    </form>
  )
}

/**
 * Its icon pops in when what the button does changes. The hover is a veil
 * fading in over the button, on a layer of its own: a background colour
 * fading beside the voice wave, redrawn every frame, flickered in Chrome.
 */
function ComposerButton({
  name,
  label,
  icon,
  onClick,
  disabled,
}: {
  name: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="transition-[opacity,scale] duration-200 [transform:translateZ(0)]"
    >
      <span key={name} className="flex animate-in fade-in-0 zoom-in-50 duration-200 ease-out motion-reduce:animate-none">
        {icon}
      </span>
    </Button>
  )
}

/* --------------------------------------------------- what the frame shows */

/** Talking (the card and the question) or speaking (the line over the bar). */
type View = "talk" | "voice"
const viewOf = (phase: AssistantPhase): View => (phase === "listening" || phase === "transcribing" ? "voice" : "talk")

type BodyProps = { assistant: Assistant; onNavigate: () => void }

/**
 * What stands over the bar. Everything comes in one way, rising from below;
 * moving between talking and speaking, what was there sinks and fades first.
 */
function Body(props: BodyProps) {
  const { phase } = props.assistant
  const view = viewOf(phase)
  const [shownView, setShownView] = React.useState(view)
  const [leaving, setLeaving] = React.useState(false)
  if (view !== shownView && !leaving) setLeaving(true)
  // The line keeps what it last said while it goes, not what the next phase would make it.
  const [voiceLine, setVoiceLine] = React.useState("Đang nghe…")
  const line =
    phase === "listening"
      ? props.assistant.starting
        ? "Đang bật micro…"
        : "Đang nghe…"
      : phase === "transcribing"
        ? "Đang chuyển thành chữ…"
        : voiceLine
  if (line !== voiceLine) setVoiceLine(line)
  React.useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => {
      setShownView(view)
      setLeaving(false)
    }, LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [leaving, view])

  return (
    <div key={shownView} className={cn(leaving && sink)}>
      {shownView === "voice" ? (
        <VoiceLine text={line} />
      ) : (
        <Talk {...props} />
      )}
    </div>
  )
}

/**
 * The line over the bar while speaking. A new line rises in while the one
 * before sinks away in the same place, at once, so there is no gap between
 * them; both sit in one grid cell, so the height holds.
 */
function VoiceLine({ text }: { text: string }) {
  const [lines, setLines] = React.useState([{ text, id: 0, leaving: false }])
  const current = lines.at(-1)!
  if (current.text !== text) setLines([...lines.filter((line) => !line.leaving).map((line) => ({ ...line, leaving: true })), { text, id: current.id + 1, leaving: false }])
  React.useEffect(() => {
    if (!lines.some((line) => line.leaving)) return
    const timer = window.setTimeout(() => setLines((all) => all.filter((line) => !line.leaving)), LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [lines])
  return (
    <div className="grid pb-4 text-center text-lg font-semibold text-white [&>*]:col-start-1 [&>*]:row-start-1" aria-live="polite">
      {lines.map((line) => (
        <p
          key={line.id}
          aria-hidden={line.leaving || undefined}
          className={cn(
            line.leaving
              ? "animate-out fade-out-0 slide-out-to-top-2 duration-[220ms] ease-[cubic-bezier(0.4,0,1,1)] fill-mode-forwards motion-reduce:animate-none"
              : rise,
          )}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}

const suggestions = ["Tháng này tiêu bao nhiêu?", "Chi nhiều nhất vào đâu?", "Ai đang nợ tôi?", "Số dư các tài khoản"]

function Talk({ assistant, onNavigate }: BodyProps) {
  const { turn, asked } = assistant
  // While speaking takes over, the talk stays as it was until it has gone.
  const phase = viewOf(assistant.phase) === "talk" ? assistant.phase : turn ? "result" : "idle"
  const question =
    phase === "thinking" ? asked : phase === "result" && turn?.said ? { id: turn.id, said: turn.said } : null

  // A question withdrawn (stopped while thinking) sinks away rather than vanishing.
  const [shownQuestion, setShownQuestion] = React.useState(question)
  const [questionLeaving, setQuestionLeaving] = React.useState(false)
  if (question && question.id !== shownQuestion?.id) {
    setShownQuestion(question)
    setQuestionLeaving(false)
  }
  if (!question && shownQuestion && !questionLeaving) setQuestionLeaving(true)
  React.useEffect(() => {
    if (!questionLeaving) return
    const timer = window.setTimeout(() => {
      setShownQuestion(null)
      setQuestionLeaving(false)
    }, LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [questionLeaving])

  return (
    <div className="space-y-3">
      {shownQuestion ? (
        <div key={`said-${shownQuestion.id}`} className={cn(questionLeaving && sink)}>
          <div className={cn("flex justify-end", rise)}>
            <p className="max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-sm break-words text-primary-foreground">
              {shownQuestion.said}
            </p>
          </div>
        </div>
      ) : null}
      {/* One card throughout, from the welcome to the wait to the answer: it changes height smoothly. */}
      <MorphCard contentKey={phase === "idle" ? "idle" : phase === "thinking" ? `thinking-${asked?.id}` : `reply-${turn?.id}`}>
        {phase === "idle" ? (
          <>
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <BotIcon blink="once" className="size-4 text-ai-strong" /> LiuLiu
              </p>
              <p className="text-lg font-semibold">Nay bạn cháy ví vụ gì dzậy?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((text) => (
                <FollowChip key={text} onClick={() => assistant.ask(text)}>
                  {text}
                </FollowChip>
              ))}
            </div>
          </>
        ) : phase === "thinking" ? (
          <Thinking />
        ) : turn ? (
          <ReplyView
            said={turn.said}
            reply={turn.reply}
            ask={assistant.ask}
            listen={assistant.listen}
            onNavigate={onNavigate}
          />
        ) : null}
      </MorphCard>
    </div>
  )
}

/**
 * A card that follows its content's height with a transition, so a longer
 * answer opens it out rather than jumping. The new content fades in once the
 * card has started to grow.
 */
function MorphCard({ contentKey, children }: { contentKey: string; children: React.ReactNode }) {
  const inner = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const element = inner.current
    if (!element) return
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-[height] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        rise,
      )}
      style={height === null ? undefined : { height }}
    >
      <div ref={inner} className="shrink-0">
        <div
          key={contentKey}
          className="flex animate-in flex-col gap-4 px-5 py-5 delay-100 duration-300 fade-in-0 fill-mode-both motion-reduce:animate-none"
        >
          {children}
        </div>
      </div>
    </Card>
  )
}

/** Steps of the wait, said as they would happen: sorting the question, reading it, looking it up. */
const thinkingSteps = [
  { at: 0, text: "Đợi tui xíu…" },
  { at: 1500, text: "Đang lục sổ của bạn…" },
  { at: 4000, text: "Sắp xong rồi, đừng hối…" },
]

function Thinking() {
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    const timers = thinkingSteps.slice(1).map((item, index) => window.setTimeout(() => setStep(index + 1), item.at))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])
  return (
    <div className="space-y-3" role="status">
      <p className="flex items-center gap-2 text-sm font-medium">
        <BotIcon blink="loop" className="size-4 shrink-0 text-ai-strong" />
        {/* The step rises in on the outer span, the light sweeps on the inner:
            both are animations, and on one element the first undid the other. */}
        <span key={step} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none">
          <span className="text-shimmer">{thinkingSteps[step].text}</span>
        </span>
      </p>
      <div className="h-8 w-1/2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted [animation-delay:150ms] motion-reduce:animate-none" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted [animation-delay:300ms] motion-reduce:animate-none" />
    </div>
  )
}
