"use client"

import Link from "next/link"
import { ArrowLeftRightIcon, ChevronRightIcon, MicIcon, SparklesIcon, WalletIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { BotIcon } from "@/components/app/bot-icon"
import { DeltaBadge } from "@/components/app/delta-badge"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Button } from "@/components/ui/button"
import type { Answer, AnswerBlock, AnswerIcon, AnswerRow } from "@/lib/ai/assistant/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { DraftsView } from "./drafts-view"
import type { TurnReply } from "./use-assistant"

/** A question to ask next, one tap away. */
export function FollowChip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 shrink-0 rounded-full bg-field px-3.5 text-sm font-medium transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none"
    >
      {children}
    </button>
  )
}

/** Every answer: what it is about, the figure, the answer in a line, the detail, and where to go next. */
function AnswerShell({
  kicker,
  figure,
  line,
  children,
  follow,
  action,
}: {
  kicker: string
  figure?: React.ReactNode
  line?: React.ReactNode
  children?: React.ReactNode
  follow?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{kicker}</p>
        {figure}
        {line ? <p className="text-sm text-muted-foreground">{line}</p> : null}
      </div>
      {children}
      {action}
      {follow ? <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">{follow}</div> : null}
    </>
  )
}

function RowIcon({ icon, size = "sm" }: { icon: AnswerIcon; size?: "sm" }) {
  if (icon.kind === "initials") {
    return (
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
        {icon.text}
      </span>
    )
  }
  if (icon.kind === "transfer") return <IconTile icon={ArrowLeftRightIcon} tone="transfer" size={size} />
  if (icon.kind === "account") {
    return icon.account ? <AccountLogo account={icon.account} size={size} /> : <IconTile icon={WalletIcon} tone="neutral" size={size} />
  }
  return <IconTile icon={categoryIconRegistry[icon.icon] ?? WalletIcon} tone={icon.color} size={size} />
}

function Row({ row }: { row: AnswerRow }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      <RowIcon icon={row.icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{row.name}</span>
        {row.sub ? (
          <span className={cn("block truncate text-xs", row.subTone === "late" ? "text-destructive-text" : "text-muted-foreground")}>
            {row.sub}
          </span>
        ) : null}
      </span>
      {row.amountText ? (
        <span className="text-sm font-semibold whitespace-nowrap">{row.amountText}</span>
      ) : (
        <Money
          amount={row.amount}
          size="sm"
          tone={row.amountTone === "income" ? "income" : "default"}
          sign={row.amountTone === "income" || row.amountTone === "expense" ? "always" : "auto"}
        />
      )}
    </div>
  )
}

function Block({ block }: { block: AnswerBlock }) {
  if (block.type === "bars") {
    return (
      <div className="space-y-3">
        {block.rows.map((row) => (
          <div key={row.name} className="flex items-center gap-3">
            <RowIcon icon={row.icon} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex justify-between gap-2 text-sm">
                <span className="truncate">{row.name}</span>
                <Money amount={row.amount} size="sm" />
              </div>
              <div className="h-1.5 rounded-full bg-track">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${row.share}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (block.type === "columns") {
    const highest = Math.max(1, ...block.columns.flatMap((column) => column.values.map(Math.abs)))
    // A label under every column while they are few; otherwise the first, every few, and the last.
    const every = block.columns.length <= 12 ? 1 : Math.ceil(block.columns.length / 6)
    const shade = (tone: "income" | "expense" | "plain", strong: boolean) =>
      tone === "income" ? (strong ? "bg-income" : "bg-income/40") : strong ? "bg-foreground" : "bg-foreground/25"
    return (
      <div className="space-y-2">
        {block.series.length > 1 ? (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {block.series.map((series) => (
              <span key={series.name} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", shade(series.tone, true))} aria-hidden="true" />
                {series.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex h-28 items-end gap-1" role="img" aria-label={block.columns.map((column) => `${column.label}: ${column.values.join(", ")}`).join("; ")}>
          {block.columns.map((column, index) => {
            const strong = block.highlight === undefined || block.highlight === index
            return (
              <div key={column.label + index} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px">
                {column.values.map((value, series) => (
                  <div
                    key={series}
                    className={cn("w-full max-w-5 rounded-t-[3px]", shade(block.series[series]?.tone ?? "plain", strong))}
                    style={{ height: `${value ? Math.max(3, (Math.abs(value) / highest) * 100) : 0}%` }}
                  />
                ))}
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 text-[10px] text-muted-foreground tabular-nums">
          {block.columns.map((column, index) => (
            <span key={column.label + index} className={cn("min-w-0 flex-1 text-center whitespace-nowrap", block.highlight === index && "font-semibold text-foreground")}>
              {index % every === 0 || index === block.columns.length - 1 || block.highlight === index ? column.label : ""}
            </span>
          ))}
        </div>
      </div>
    )
  }
  if (block.type === "compare") {
    return (
      <div className="space-y-3">
        {block.rows.map((row, index) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex justify-between gap-2 text-sm">
              <span className={cn("inline-block first-letter:uppercase", index > 0 && "text-muted-foreground")}>{row.label}</span>
              <Money amount={row.amount} size="sm" tone={index > 0 ? "muted" : "default"} />
            </div>
            <div className="h-2.5 rounded-full bg-track">
              <div
                className={cn("h-full rounded-full", index === 0 ? "bg-foreground" : "bg-foreground/30")}
                style={{ width: `${Math.max(row.share, row.amount ? 2 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {block.groups.map((group, index) => (
        <div key={group.heading ?? index} className="space-y-2">
          {group.heading ? <p className="pt-1 text-xs font-semibold text-muted-foreground">{group.heading}</p> : null}
          <div className="divide-y divide-separator rounded-2xl bg-field px-4">
            {group.rows.map((row, rowIndex) => (
              <Row key={rowIndex} row={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnswerBody({ answer, ask, onNavigate }: { answer: Answer; ask: (text: string) => void; onNavigate: () => void }) {
  return (
    <AnswerShell
      kicker={answer.kicker}
      figure={
        answer.figureText ? (
          <p className="text-[34px] leading-tight font-semibold tracking-tight">{answer.figureText}</p>
        ) : answer.figure ? (
          <div className="flex flex-wrap items-center gap-x-2">
            <Money
              amount={answer.figure.amount}
              size="xl"
              tone={answer.figure.tone === "income" ? "income" : "default"}
            />
            {answer.delta ? (
              <DeltaBadge
                current={answer.delta.current}
                previous={answer.delta.previous}
                goodWhen={answer.delta.goodWhen}
                comparedTo={answer.delta.comparedTo}
              />
            ) : null}
          </div>
        ) : undefined
      }
      line={answer.line}
      action={
        answer.link ? (
          <Button variant="secondary" asChild>
            <Link href={answer.link.href} onClick={onNavigate}>
              {answer.link.label} <ChevronRightIcon />
            </Link>
          </Button>
        ) : undefined
      }
      follow={
        answer.followUps.length
          ? answer.followUps.map((text) => (
              <FollowChip key={text} onClick={() => ask(text)}>
                {text}
              </FollowChip>
            ))
          : undefined
      }
    >
      {answer.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </AnswerShell>
  )
}

const tryAsking = ["Tháng này tiêu bao nhiêu?", "Ai đang nợ tôi?"]

/**
 * Timi's words, coming in a word at a time as if said: each word fades up
 * after the one before (CSS only, by a delay per word). Still when motion is
 * reduced.
 */
function Spoken({ text }: { text: string }) {
  const words = text.split(/(\s+)/)
  let index = 0
  return (
    <p className="text-base leading-relaxed">
      {words.map((word, position) =>
        /^\s+$/.test(word) ? (
          word
        ) : (
          <span
            key={position}
            className="inline-block animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out fill-mode-both motion-reduce:animate-none"
            style={{ animationDelay: `${150 + index++ * 35}ms` }}
          >
            {word}
          </span>
        ),
      )}
    </p>
  )
}

/** What a turn shows, in the one card: the answer, or why there is none and what to do. */
export function ReplyView({
  said,
  reply,
  ask,
  listen,
  onNavigate,
}: {
  said: string
  reply: TurnReply
  ask: (text: string) => void
  listen: () => void
  /** Closes the assistant as a link in it is followed. */
  onNavigate: () => void
}) {
  const chips = tryAsking.map((text) => (
    <FollowChip key={text} onClick={() => ask(text)}>
      {text}
    </FollowChip>
  ))
  switch (reply.kind) {
    case "answer":
    case "usage":
      return <AnswerBody answer={reply.answer} ask={ask} onNavigate={onNavigate} />
    case "drafts":
      return <DraftsView drafts={reply.drafts} accounts={reply.accounts} categoryGroups={reply.categoryGroups} />
    case "unread":
      return (
        <AnswerShell
          kicker="Ủa khoản nào dzậy?"
          line="Tui chưa thấy số tiền đâu hết. Nói kiểu “ăn phở 35k, cà phê 25k” là tui ghi liền. Câu này khum tính lượt nha."
        />
      )
    case "chat":
      return (
        <>
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <BotIcon blink="once" className="size-4 text-ai-strong" /> Timi
          </p>
          <Spoken text={reply.text} />
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">{chips}</div>
        </>
      )
    case "action":
      return (
        <AnswerShell
          kicker="Vụ này tui chưa làm được"
          line="Tui mới biết trả lời và ghi thu chi thôi. Ghi vay nợ, sửa hay xoá giao dịch thì đợi tui lên level nha 😤"
          follow={chips}
        />
      )
    case "other":
      return (
        <AnswerShell
          kicker="Câu này khó quá bạn ơi"
          line="Tui chỉ rành tiền bạn đã ghi trong app thôi: chi tiêu, thu nhập, số dư, ai nợ ai."
          follow={chips}
        />
      )
    case "quota":
      return (
        <AnswerShell
          kicker="Hết lượt AI tháng này rồi bạn ơi"
          figure={
            <p className="text-xl font-semibold">
              {reply.quota.limit}/{reply.quota.limit} lượt đã dùng
            </p>
          }
          line={reply.isPro ? "Lượt mới có từ đầu tháng sau." : `Lượt mới có từ đầu tháng sau. Gói Pro có ${reply.proLimit} lượt mỗi tháng.`}
          action={
            reply.isPro ? undefined : (
              <Button className="bg-ai text-ai-foreground hover:bg-ai/85" asChild>
                <Link href="/settings?screen=plan" onClick={onNavigate}>
                  <SparklesIcon /> Nâng cấp Pro
                </Link>
              </Button>
            )
          }
        />
      )
    case "unheard":
      return (
        <AnswerShell kicker="Tui nghe hong rõ" line={`${reply.message} Nói to rõ gần micro xíu, hoặc gõ vô dưới kia cũng được.`}>
          <Button onClick={listen}>
            <MicIcon /> Nói lại
          </Button>
        </AnswerShell>
      )
    default:
      return (
        <AnswerShell kicker="Lag rồi bạn ơi" line="Mạng chậm hay tui đang ngáo xíu. Thử lại phát nữa nha, câu này chưa bị tính lượt.">
          {said ? (
            <Button variant="secondary" onClick={() => ask(said)}>
              Thử lại
            </Button>
          ) : null}
        </AnswerShell>
      )
  }
}
