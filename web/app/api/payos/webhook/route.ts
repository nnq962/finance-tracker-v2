import { NextResponse } from "next/server"
import type { Webhook } from "@payos/node"

import { settlePaidPayment } from "@/lib/plans/payments"
import { getPayOS } from "@/lib/plans/payos"
import { noticeSale } from "@/lib/plans/sale-notice"

export const runtime = "nodejs"

/**
 * payOS reports each transfer here. Only a body signed with our checksum key
 * is trusted; a paid one settles its payment and grants Pro, once however
 * often it is sent. Anything else verified (payOS's test when the URL is
 * saved names an order that is not ours) is acknowledged and ignored.
 */
export async function POST(request: Request) {
  const payos = getPayOS()
  if (!payos) return NextResponse.json({ error: "payOS is not configured" }, { status: 503 })

  let body: Webhook
  try {
    body = (await request.json()) as Webhook
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  let data: Awaited<ReturnType<typeof payos.webhooks.verify>>
  try {
    data = await payos.webhooks.verify(body)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (data.code === "00") {
    try {
      const result = await settlePaidPayment(data.orderCode, { amountPaid: data.amount, reference: data.reference })
      if (result === "granted") noticeSale(data.orderCode)
    } catch (error) {
      // Not acknowledged, so payOS sends it again.
      console.error("payOS webhook could not settle", { orderCode: data.orderCode }, error)
      return NextResponse.json({ error: "Could not settle" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
