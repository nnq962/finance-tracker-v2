import "server-only"

import { PayOS } from "@payos/node"

import { closePayment, getPayment, settlePaidPayment, type SettleResult } from "@/lib/plans/payments"

let client: PayOS | null | undefined

/**
 * The payOS client, from PAYOS_CLIENT_ID, PAYOS_API_KEY and
 * PAYOS_CHECKSUM_KEY on the server; null until all three are set, which
 * keeps checkout off.
 */
export function getPayOS() {
  if (client === undefined) {
    const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env
    client =
      PAYOS_CLIENT_ID && PAYOS_API_KEY && PAYOS_CHECKSUM_KEY
        ? new PayOS({ clientId: PAYOS_CLIENT_ID, apiKey: PAYOS_API_KEY, checksumKey: PAYOS_CHECKSUM_KEY })
        : null
  }
  return client
}

export type PaymentOutcome = SettleResult | "pending" | "cancelled" | "expired"

/**
 * Asks payOS where a payment stands, for when the user comes back before the
 * webhook arrived, and settles or closes it to match.
 */
export async function syncPayment(orderCode: number): Promise<PaymentOutcome> {
  const payment = await getPayment(orderCode)
  if (!payment) return "unknown"
  if (payment.status === "paid") return "settled"

  const payos = getPayOS()
  if (!payos) return "pending"
  const link = await payos.paymentRequests.get(orderCode)
  switch (link.status) {
    case "PAID":
      return settlePaidPayment(orderCode, {
        amountPaid: link.amountPaid,
        reference: link.transactions[0]?.reference,
      })
    case "CANCELLED":
      await closePayment(orderCode, "cancelled")
      return "cancelled"
    case "EXPIRED":
      await closePayment(orderCode, "expired")
      return "expired"
    default:
      return "pending"
  }
}
