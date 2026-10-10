import { SectionHeading } from "./section-heading"

const STEPS = [
  { title: "Đăng nhập", description: "Dùng tài khoản Google, không cần tạo mật khẩu mới." },
  { title: "Thêm tài khoản", description: "Ngân hàng, ví, tiền mặt với số dư hiện tại, vài chạm là xong." },
  { title: "Ghi và theo dõi", description: "Ghi từng khoản, hoặc nói một câu để AI ghi giúp. Tổng quan tự cập nhật." },
] as const

/** Three steps in, each numbered on the accent. */
export function StepsSection() {
  return (
    <section aria-labelledby="steps-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading anchor="cach-hoat-dong" id="steps-title" label="3 bước" title="Bắt đầu trong chưa đầy một phút.">
        Không cần nhập liệu phức tạp hay kết nối ngân hàng.
      </SectionHeading>
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="surface-plain flex flex-col gap-4 rounded-[28px] bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-ai text-base font-bold text-ai-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
