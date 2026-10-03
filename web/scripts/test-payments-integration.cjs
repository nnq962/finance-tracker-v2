/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/* Run: npm run db:up && node scripts/test-payments-integration.cjs */
const assert = require('node:assert/strict')

// Test keys, set before the payOS client is first made.
process.env.PAYOS_CLIENT_ID = 'test-client'
process.env.PAYOS_API_KEY = 'test-api-key'
process.env.PAYOS_CHECKSUM_KEY = 'test-checksum-key'

const { sql, createUser, cleanup } = require('./lib/db-harness.cjs')
const { PayOS } = require('@payos/node')
const payments = require('../lib/plans/payments.ts')
const plans = require('../lib/plans/repository.ts')
const { proPrices, priceWithCoupon } = require('../lib/plans/plans.ts')
const coupons = require('../lib/plans/coupons.ts')
const { getDb } = require('../lib/db/client.ts')
const { POST } = require('../app/api/payos/webhook/route.ts')

const signer = new PayOS({ clientId: 'x', apiKey: 'x', checksumKey: process.env.PAYOS_CHECKSUM_KEY })

/** A webhook body as payOS sends it, signed with the test checksum key. */
async function webhookBody(data, { tamper = false } = {}) {
  const full = {
    accountNumber: '0123456789', currency: 'VND', paymentLinkId: 'link', transactionDateTime: '2026-10-03 10:00:00',
    reference: 'FT123', description: 'FT PRO1T', code: '00', desc: 'success',
    counterAccountBankId: null, counterAccountBankName: null, counterAccountName: null,
    counterAccountNumber: null, virtualAccountName: null, virtualAccountNumber: null,
    ...data,
  }
  const signature = await signer.crypto.createSignatureFromObj(full, process.env.PAYOS_CHECKSUM_KEY)
  return { code: '00', desc: 'success', success: true, data: tamper ? { ...full, amount: full.amount * 10 } : full, signature }
}

const send = async (body) => {
  const response = await POST(new Request('https://finance.test/api/payos/webhook', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }))
  return response.status
}

const grantCount = async (userId) =>
  Number((await sql('SELECT count(*) FROM subscriptions WHERE user_id = $1', [userId])).rows[0].count)

async function run() {
  try {
    const userId = await createUser('pay_test')
    const price = proPrices.month.amount

    // A payment opens pending, at the period's price, with its own order code.
    const payment = await payments.createPayment(userId, 'month')
    assert.equal(payment.amount, price)
    assert.ok(payment.orderCode >= 100001)
    assert.equal((await payments.getPayment(payment.orderCode)).status, 'pending')

    // A body not signed with our key changes nothing.
    assert.equal(await send(await webhookBody({ orderCode: payment.orderCode, amount: price }, { tamper: true })), 400)
    assert.equal(await send({ code: '00', data: { orderCode: payment.orderCode, amount: price }, signature: 'nope' }), 400)
    assert.equal(await grantCount(userId), 0)

    // A paid webhook grants Pro and settles the payment.
    const paid = await webhookBody({ orderCode: payment.orderCode, amount: price })
    assert.equal(await send(paid), 200)
    const settled = await payments.getPayment(payment.orderCode)
    assert.equal(settled.status, 'paid')
    assert.ok(settled.paidAt)
    assert.equal((await plans.getPlanState(userId)).plan, 'pro')
    assert.equal((await plans.listGrants(userId))[0].note, `payOS #${payment.orderCode}`)

    // Sent again, it grants nothing more.
    assert.equal(await send(paid), 200)
    assert.equal(await grantCount(userId), 1)

    // The webhook and the return page settling at once grant once.
    const raced = await payments.createPayment(userId, 'year')
    const results = await Promise.all([
      payments.settlePaidPayment(raced.orderCode, { amountPaid: proPrices.year.amount }),
      payments.settlePaidPayment(raced.orderCode, { amountPaid: proPrices.year.amount }),
    ])
    assert.deepEqual(results.sort(), ['granted', 'settled'])
    assert.equal(await grantCount(userId), 2)
    // The year follows the month already bought.
    const [year, month] = await plans.listGrants(userId)
    assert.equal(year.startsAt, month.endsAt)

    // Less than the price grants nothing and stays open for an admin.
    const short = await payments.createPayment(userId, 'month')
    assert.equal(await payments.settlePaidPayment(short.orderCode, { amountPaid: price - 1000 }), 'underpaid')
    assert.equal((await payments.getPayment(short.orderCode)).status, 'pending')
    assert.equal(await grantCount(userId), 2)

    // A payment closed as cancelled that is paid after all still counts.
    const late = await payments.createPayment(userId, 'month')
    await payments.closePayment(late.orderCode, 'cancelled')
    assert.equal((await payments.getPayment(late.orderCode)).status, 'cancelled')
    assert.equal(await send(await webhookBody({ orderCode: late.orderCode, amount: price })), 200)
    assert.equal((await payments.getPayment(late.orderCode)).status, 'paid')
    // Closing never undoes a paid one.
    await payments.closePayment(late.orderCode, 'expired')
    assert.equal((await payments.getPayment(late.orderCode)).status, 'paid')

    // payOS's test when the URL is saved, and transfers that are not "paid", are acknowledged and ignored.
    assert.equal(await send(await webhookBody({ orderCode: 123, amount: 3000 })), 200)
    const other = await payments.createPayment(userId, 'month')
    assert.equal(await send(await webhookBody({ orderCode: other.orderCode, amount: price, code: '01' })), 200)
    assert.equal((await payments.getPayment(other.orderCode)).status, 'pending')

    // Coupons: a shared percentage off, once per user, counted when Pro is granted.
    const tag = String(Date.now()).slice(-8)
    const admin = 'coupon-admin'
    const code = `T${tag}`
    await coupons.createCoupon(admin, { code: code.toLowerCase(), percentOff: 30, maxRedemptions: 2 })
    await assert.rejects(coupons.createCoupon(admin, { code, percentOff: 30 }), /đã tồn tại/)
    await assert.rejects(coupons.createCoupon(admin, { code: 'X', percentOff: 30 }))
    await assert.rejects(coupons.createCoupon(admin, { code: `B${tag}`, percentOff: 101 }))
    const buyer = await createUser('pay_test')
    const coupon = await coupons.findUsableCoupon(getDb(), buyer, ` ${code.toLowerCase()} `)
    assert.equal(coupon.percentOff, 30)
    await assert.rejects(coupons.findUsableCoupon(getDb(), buyer, 'NOPE123'), /không hợp lệ/)

    // The checkout costs less; settling grants at that price and counts the use.
    const discounted = await payments.createPayment(buyer, 'month', coupon)
    // Prices after a code round to the nearest 1.000đ: 29.000đ less 30% is 20.000đ, less 35% is 19.000đ.
    assert.equal(discounted.amount, 20_000)
    assert.deepEqual(priceWithCoupon('month', 35), { listAmount: 29_000, discount: 10_000, amount: 19_000 })
    assert.equal(priceWithCoupon('year', 100).amount, 0)
    assert.equal(await send(await webhookBody({ orderCode: discounted.orderCode, amount: discounted.amount })), 200)
    assert.equal(await grantCount(buyer), 1)
    await assert.rejects(coupons.findUsableCoupon(getDb(), buyer, code), /đã dùng/)

    // The limit: a second user uses the last one, a third finds none left.
    const second = await createUser('pay_test')
    const third = await createUser('pay_test')
    const secondPayment = await payments.createPayment(second, 'year', await coupons.findUsableCoupon(getDb(), second, code))
    assert.equal(await send(await webhookBody({ orderCode: secondPayment.orderCode, amount: secondPayment.amount })), 200)
    await assert.rejects(coupons.findUsableCoupon(getDb(), third, code), /hết lượt/)

    // Off or past its date, a code is refused.
    await sql('UPDATE coupons SET active = false WHERE code = $1', [code])
    await assert.rejects(coupons.findUsableCoupon(getDb(), third, code), /không hợp lệ/)
    const expired = `E${tag}`
    await coupons.createCoupon(admin, { code: expired, percentOff: 10 })
    await sql(`UPDATE coupons SET expires_at = now() - interval '1 minute' WHERE code = $1`, [expired])
    await assert.rejects(coupons.findUsableCoupon(getDb(), third, expired), /hết hạn/)

    // 100% off grants Pro at once, without payOS, for a single last use even when asked twice together.
    const free = `F${tag}`
    await coupons.createCoupon(admin, { code: free, percentOff: 100, maxRedemptions: 1 })
    const freeGrants = await Promise.allSettled([coupons.grantWithCoupon(third, 'month', free), coupons.grantWithCoupon(buyer, 'month', free)])
    assert.equal(freeGrants.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(Number((await sql('SELECT count(*) FROM coupon_redemptions r JOIN coupons c ON c.id = r.coupon_id WHERE c.code = $1', [free])).rows[0].count), 1)
    await assert.rejects(coupons.grantWithCoupon(third, 'month', code), /không hợp lệ/)
    // An admin changes a code's limits, or deletes it with its uses.
    const editable = (await sql('SELECT id FROM coupons WHERE code = $1', [expired])).rows[0].id
    await coupons.updateCoupon(editable, { percentOff: 35, maxRedemptions: null, expiresOn: '' })
    assert.equal((await coupons.findUsableCoupon(getDb(), third, expired)).percentOff, 35)
    await assert.rejects(coupons.updateCoupon(editable, { percentOff: 0 }), /Mức giảm/)
    await coupons.deleteCoupon(editable)
    await assert.rejects(coupons.findUsableCoupon(getDb(), third, expired), /không hợp lệ/)
    await sql('DELETE FROM coupons WHERE code = ANY($1)', [[code, free]])

    console.log('Payment checks passed: signatures, settling once, races, underpaid, late payment, test pings, coupons.')
  } finally {
    await cleanup()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
