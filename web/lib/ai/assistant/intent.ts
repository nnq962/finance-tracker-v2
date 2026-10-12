import "server-only"

import { localAiJson, type ChatMessage } from "@/lib/ai/llm"

/**
 * What a request to the assistant is, before anything else is done with it:
 * - question: asks about the user's own money as kept in the app
 * - record: tells of an expense, an income or a transfer to write down
 * - action: wants something else done in the app (a loan, an edit, a delete…)
 * - usage: about the user's own AI requests and plan, answered from the plan
 * - chat: anything else (greetings, who it is, jokes, small talk, things
 *   outside the app's data), which LiuLiu answers in a line or two
 */
export type Intent = "question" | "record" | "action" | "usage" | "chat"

const intents: Intent[] = ["question", "record", "action", "usage", "chat"]

const schema = {
  type: "object",
  properties: { intent: { type: "string", enum: intents } },
  required: ["intent"],
}

// The same for every user, so Ollama keeps it ready between requests.
const system = `Bạn phân loại yêu cầu người dùng gửi cho trợ lý của một app ghi chép thu chi cá nhân. Chỉ trả lời một nhãn:
- question: hỏi hoặc muốn xem tiền của chính người dùng đã ghi trong app: chi tiêu, thu nhập, số dư tài khoản, các giao dịch, khoản vay và cho vay, so sánh, nhiều nhất, liệt kê, chia theo hạng mục hay tài khoản. Câu hỏi nối tiếp câu trước ("còn tháng trước?", "thế còn ăn uống?") cũng là question.
- record: kể một khoản đã chi, đã nhận hoặc đã chuyển để ghi lại, thường có số tiền ("ăn phở 35k", "nhận lương 15 triệu", "chuyển 2 triệu sang momo").
- action: muốn app làm việc khác: ghi khoản cho vay hay đi vay, trả nợ, sửa hoặc xoá giao dịch, tạo tài khoản, hạng mục, ngân sách, nhắc nhở.
- usage: hỏi về lượt AI, lượt hỏi trợ lý, hạn mức sử dụng AI, nhiệm vụ nhận thêm lượt, gói Free hay Pro và ngày hết hạn của chính người dùng ("còn bao nhiêu lượt AI", "gói Pro hết hạn khi nào").
- chat: mọi câu còn lại: chào hỏi, cảm ơn, hỏi trợ lý là ai, trêu đùa, nói chuyện phiếm, tâm sự, xin mẹo tiết kiệm chung, hỏi thứ ngoài dữ liệu của người dùng (giá vàng, tỷ giá, thời tiết, kiến thức chung), hoặc câu không rõ nghĩa.`

const examples: [string, Intent][] = [
  ["tháng này tiêu hết bao nhiêu", "question"],
  ["techcombank còn bao nhiêu tiền", "question"],
  ["ai đang nợ tôi", "question"],
  ["còn tuần trước thì sao", "question"],
  ["mua sắm chia theo hạng mục", "question"],
  ["xem các khoản chi bằng momo", "question"],
  ["sáng nay ăn phở ba lăm nghìn", "record"],
  ["nhận lương mười lăm triệu vào vietcombank", "record"],
  ["cho nam mượn hai triệu", "action"],
  ["xoá giao dịch cà phê vừa rồi", "action"],
  ["tôi còn bao nhiêu lượt ai", "usage"],
  ["tài sản ròng của tôi", "question"],
  ["những khoản không tính vào thống kê", "question"],
  ["tài khoản vietcombank mở từ khi nào", "question"],
  ["còn nhiệm vụ nào để nhận lượt", "usage"],
  ["giá vàng hôm nay bao nhiêu", "chat"],
  ["xin chào", "chat"],
  ["bạn là ai thế", "chat"],
  ["kể chuyện cười đi", "chat"],
]

/** Sorts a request into its kind; `previous` is the question just answered, for follow-ups. */
export async function classifyRequest(text: string, previous?: string): Promise<Intent> {
  const said = (value: string) => (previous ? `Câu trước: ${previous}\nCâu này: ${value}` : value)
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...examples.flatMap(([example, intent]) => [
      { role: "user" as const, content: example },
      { role: "assistant" as const, content: JSON.stringify({ intent }) },
    ]),
    { role: "user", content: said(text) },
  ]
  const reply = (await localAiJson(messages, schema)) as { intent?: unknown }
  return intents.includes(reply?.intent as Intent) ? (reply.intent as Intent) : "chat"
}
