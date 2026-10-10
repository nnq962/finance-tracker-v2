import { CheckIcon, MicIcon, SparklesIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

import { SectionHeading } from "./section-heading"

const POINTS = [
  "Gõ hoặc nói, như nhắn cho một người bạn.",
  "Tự nhận số tiền, hạng mục, tài khoản, ngày và giờ.",
  "Chạm vào từng chỗ để sửa trước khi lưu.",
  "AI chạy trên máy chủ của app, câu bạn nhập không gửi cho dịch vụ AI bên ngoài.",
] as const

/** A blank AI filled in, underlined in the accent as in the app's confirmation sentence. */
function Blank({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-foreground underline decoration-ai-strong decoration-2 underline-offset-4">{children}</span>
}

/**
 * The AI that writes an entry from a sentence: on the black, what you say,
 * then the sentence it fills for you to check, then the allowance.
 */
export function AiSection() {
  return (
    <section aria-labelledby="ai-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <Card id="ai" variant="inverse" className="scroll-mt-6 rounded-[32px] p-6 sm:p-10 lg:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <SectionHeading id="ai-title" label="AI ghi giúp" title="Nói một câu, giao dịch tự điền." align="start" tone="inverse">
              Không cần chọn từng ô. Kể lại khoản thu chi bằng lời của bạn, AI điền sẵn để bạn chỉ việc xem lại và lưu.
            </SectionHeading>
            <ul className="flex flex-col gap-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm sm:text-base">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ai text-ai-foreground">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="text-sm text-inverse-foreground/60">
              Gói Free có 15 lượt AI mỗi tháng, làm nhiệm vụ để nhận thêm. Gói Pro có 300 lượt.
            </p>
          </div>

          {/* What it looks like: what you say, then the sentence AI fills. */}
          <div aria-hidden="true" className="flex flex-col gap-3">
            <div className="flex items-center gap-3 self-end rounded-[24px] rounded-br-md bg-inverse-foreground/10 px-4 py-3 text-sm sm:text-base">
              <MicIcon className="size-4 shrink-0 text-ai" />
              Hôm qua uống trà sữa lúc 4h chiều 80 cành bằng tiền mặt
            </div>
            <div className="flex items-center gap-2 px-1 text-xs text-inverse-foreground/60">
              <SparklesIcon className="size-3.5 text-ai" />
              AI đã điền, kiểm tra rồi lưu
            </div>
            <div className="surface-plain flex flex-col gap-5 rounded-[24px] bg-card p-5 text-card-foreground sm:p-6">
              <p className="text-base leading-loose text-muted-foreground sm:text-lg">
                <Blank>Hôm qua</Blank> lúc <Blank>16:00</Blank>, bạn đã <Blank>chi</Blank> <Blank>80.000đ</Blank> cho{" "}
                <Blank>Trà sữa</Blank> từ <Blank>Tiền mặt</Blank>.
              </p>
              <span className="flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                Lưu giao dịch
              </span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
