/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads server TypeScript modules. */
/*
 * The overview's figures against the other pages', on finance_test: net worth
 * (accounts, loans), this month and six months of income and spending, the
 * calendar's days and their sheet, the categories, and the spending limits,
 * with transfers, fees, left-out rows and accounts, a balance corrected by
 * hand, a savings jar's purchase and loan interest in the mix.
 * Run: npm run db:up && node scripts/test-overview-integration.cjs
 */
const path = require('node:path')
const Module = require('node:module')
const WEB = process.cwd()
const { randomUUID } = require('node:crypto')
const { sql, createUser, cleanup } = require(path.join(WEB, 'scripts/lib/db-harness.cjs'))

// A fake session: loadOverview and the day action run as `currentUser`.
let currentUser = null
const sessionFile = path.join(WEB, 'lib/auth/session.ts')
const fake = new Module(sessionFile)
fake.filename = sessionFile
fake.loaded = true
fake.exports = {
  loadWithSession: async (fn) => ({ user: { uid: currentUser }, data: await fn({ uid: currentUser }) }),
  requireSession: async () => ({ uid: currentUser }),
}
require.cache[sessionFile] = fake

const r = (p) => require(path.join(WEB, p))
const accounts = r('lib/accounts/repository.ts')
const tx = r('lib/transactions/repository.ts')
const debts = r('lib/debts/repository.ts')
const savings = r('lib/savings/repository.ts')
const { getBalanceSummary } = r('lib/accounts/summary.ts')
const { getTransactionSummary } = r('app/(main)/transactions/_lib/get-transaction-summary.ts')
const { getDebtSummary } = r('app/(main)/debts/_lib/get-debt-summary.ts')
const { getBudgetOverview } = r('lib/budgets/repository.ts')
const { loadOverview } = r('app/(main)/overview/_lib/load-overview.ts')
const { getDayTransactionsAction } = r('app/(main)/overview/actions.ts')
const { allocationSlices } = r('app/(main)/overview/_lib/allocation-slices.ts')
const { summarizeFigures } = r('lib/transactions/types.ts')
const { toDateKey } = r('lib/format-date.ts')

const results = []
function check(id, name, fn) {
  try {
    const out = fn()
    results.push({ id, name, ok: out === true || out === undefined, detail: out === true || out === undefined ? '' : String(out) })
  } catch (error) {
    results.push({ id, name, ok: false, detail: error.message })
  }
}
const eq = (actual, expected) => (JSON.stringify(actual) === JSON.stringify(expected) ? true : `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)

const at = (day, time = '10:00') => new Date(`${day}T${time}:00+07:00`)

async function run() {
  try {
    const uid = await createUser('overview_test')
    currentUser = uid
    const today = toDateKey(new Date())
    const month = today.slice(0, 7)
    const [y, m] = month.split('-').map(Number)
    const monthKey = (offset) => { const d = new Date(Date.UTC(y, m - 1 + offset, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` }
    const thisMonthDay = `${month}-02`
    const day2 = `${month}-03`

    // Accounts: wallet 10tr, bank 50tr, a left-out fund 5tr, an archived one 1tr.
    const opened = new Date(`${monthKey(-8)}-01T08:00:00+07:00`)
    const mk = async (name, balance, extra = {}) => {
      const id = randomUUID()
      await accounts.createAccount(uid, { name, type: 'cash', balance, openedAt: opened, excluded: false, ...extra }, id)
      return id
    }
    const wallet = await mk('Ví', 10_000_000)
    const bank = await mk('Ngân hàng', 50_000_000)
    const fund = await mk('Quỹ', 5_000_000, { excluded: true })
    const old = await mk('Cũ', 1_000_000)
    await accounts.setAccountArchived(uid, old, true)

    // Categories.
    const grp = async (type, name, color = 'orange') => (await sql(`INSERT INTO category_groups (user_id, type, name, icon_name, color_name) VALUES ($1,$2,$3,'utensils',$4) RETURNING id`, [uid, type, name, color])).rows[0].id
    const item = async (group, type, name) => (await sql(`INSERT INTO category_items (user_id, group_id, type, name, icon_name) VALUES ($1,$2,$3,$4,'soup') RETURNING id`, [uid, group, type, name])).rows[0].id
    const food = await grp('expense', 'Ăn uống')
    const meal = await item(food, 'expense', 'Ăn trưa')
    const shop = await grp('expense', 'Mua sắm', 'blue')
    const gadget = await item(shop, 'expense', 'Đồ điện tử')
    const salaryG = await grp('income', 'Lương', 'emerald')
    const salary = await item(salaryG, 'income', 'Lương tháng')
    // Six more expense groups for the "Khác" fold.
    const extras = []
    for (let i = 1; i <= 6; i++) { const g = await grp('expense', `Nhóm ${i}`, 'slate'); extras.push({ g, it: await item(g, 'expense', `Mục ${i}`) }) }

    const add = (values) => tx.createTransaction(uid, values, randomUUID())
    // This month.
    await add({ kind: 'income', amount: 20_000_000, accountId: bank, categoryId: salary, occurredAt: at(thisMonthDay) })
    await add({ kind: 'expense', amount: 1_500_000, accountId: wallet, categoryId: meal, occurredAt: at(thisMonthDay) })
    await add({ kind: 'expense', amount: 300_000, accountId: wallet, categoryId: meal, occurredAt: at(thisMonthDay), excluded: true })
    await add({ kind: 'expense', amount: 200_000, accountId: fund, categoryId: meal, occurredAt: at(thisMonthDay) })
    await add({ kind: 'transfer', amount: 1_000_000, fee: 10_000, fromAccountId: wallet, toAccountId: bank, occurredAt: at(thisMonthDay) })
    await add({ kind: 'transfer', amount: 1_000_000, fee: 7_000, fromAccountId: fund, toAccountId: wallet, occurredAt: at(thisMonthDay) })
    for (const [i, { it }] of extras.entries()) await add({ kind: 'expense', amount: (i + 1) * 10_000, accountId: wallet, categoryId: it, occurredAt: at(day2) })
    // 00:30 in Vietnam is the day before in UTC: still this Vietnam day.
    await add({ kind: 'expense', amount: 40_000, accountId: wallet, categoryId: meal, occurredAt: at(day2, '00:30') })

    // Balance corrected by hand: +500k on the wallet, left out by default.
    const w = (await accounts.getAccounts(uid)).find((a) => a.id === wallet)
    await accounts.updateAccount(uid, wallet, { name: 'Ví', type: 'cash', balance: w.balance + 500_000, openedAt: opened, excluded: false }, w.balance)

    // A savings jar: 3tr in from the bank, bought for 3tr in "Mua sắm".
    const jar = randomUUID()
    await savings.createJar(uid, { name: 'Hũ xe', target: 3_000_000, icon: 'bike', color: 'blue' }, jar)
    await add({ kind: 'transfer', amount: 3_000_000, fee: 0, fromAccountId: bank, toAccountId: jar, occurredAt: at(thisMonthDay, '11:00') })
    await savings.buyWithJar(uid, jar, { kind: 'expense', amount: 3_000_000, accountId: jar, categoryId: gadget, occurredAt: at(day2, '12:00') }, undefined, randomUUID())

    // Earlier months for the chart: one each in the 5 months before, and one 6 months back (out of the chart).
    for (let k = 1; k <= 6; k++) {
      await add({ kind: 'expense', amount: k * 100_000, accountId: wallet, categoryId: meal, occurredAt: at(`${monthKey(-k)}-15`) })
      await add({ kind: 'income', amount: k * 1_000_000, accountId: bank, categoryId: salary, occurredAt: at(`${monthKey(-k)}-15`) })
    }

    // Debts: lent 5tr from the wallet with 1%/month (recorded 2 months ago), repaid 2tr this month;
    // borrowed 3tr into the bank, due in 3 days; lent 2tr from the left-out fund.
    const contact = await debts.createContact(uid, { name: 'TQ Bạn', relationship: '' }, randomUUID())
    const recorded = `${monthKey(-2)}-17`
    const lent = await debts.createDebt(uid, { contactId: contact.id, recordingMode: 'cash-flow', accountId: wallet, direction: 'lent', amount: 5_000_000, hasInterest: true, interestRate: 1, interestPeriod: 'month', recordedAt: recorded, note: '' }, randomUUID())
    await debts.saveDebtPayment(uid, lent.id, undefined, { accountId: wallet, amount: 2_000_000, paidAt: thisMonthDay, paidTime: '15:00', note: '' }, randomUUID())
    const due = new Date(Date.parse(today) + 3 * 86_400_000).toISOString().slice(0, 10)
    await debts.createDebt(uid, { contactId: contact.id, recordingMode: 'cash-flow', accountId: bank, direction: 'borrowed', amount: 3_000_000, hasInterest: false, recordedAt: day2, dueAt: due, note: '' }, randomUUID())
    await debts.createDebt(uid, { contactId: contact.id, recordingMode: 'cash-flow', accountId: fund, direction: 'lent', amount: 2_000_000, hasInterest: false, recordedAt: day2, note: '' }, randomUUID())
    // A loan alone on a day of its own (no other transaction that day).
    const loanOnlyDay = `${month}-05`
    await debts.createDebt(uid, { contactId: contact.id, recordingMode: 'cash-flow', accountId: wallet, direction: 'lent', amount: 100_000, hasInterest: false, recordedAt: loanOnlyDay, note: '' }, randomUUID())

    // ---- Read everything as the pages do.
    const data = await loadOverview(undefined)
    const accts = await accounts.getAccounts(uid)
    const debtList = await debts.getDebts(uid)
    const monthStart = new Date(`${month}-01T00:00:00+07:00`)
    const monthEnd = new Date(`${monthKey(1)}-01T00:00:00+07:00`)
    const monthTx = [...await tx.getTransactionsInRange(uid, monthStart, monthEnd), ...await tx.getDebtPaymentsInRange(uid, monthStart, monthEnd)]
    const txPage = getTransactionSummary(monthTx)
    const budget = await getBudgetOverview(uid, today)
    const nw = data.summary.netWorth
    const bal = (id) => accts.find((a) => a.id === id).balance

    check('A1', 'Tài khoản = tổng số dư trừ tài khoản ngoài báo cáo (khớp trang Tài khoản)', () => eq(nw.cash, getBalanceSummary(accts).totalBalance))
    check('A2', 'Tài khoản tính cả tài khoản đã lưu trữ, bỏ tài khoản ngoài báo cáo', () => eq(nw.cash, bal(wallet) + bal(bank) + bal(old) + bal(jar)))
    check('A3', 'Dòng "1 tài khoản ngoài báo cáo · x, cho vay 2tr"', () => eq(nw.leftOut, { count: 1, cash: bal(fund), receivable: 2_000_000, payable: 0 }))
    const lentDebt = debtList.find((d) => d.id === lent.id)
    const { getPaymentMetrics } = r('lib/debts/calculations.ts')
    const lentRemaining = getPaymentMetrics(lentDebt, today).remainingAmount
    check('A4', 'Cho vay = còn lại các khoản cho vay (gồm lãi đến hôm nay), bỏ khoản từ tài khoản ngoài báo cáo', () => eq(nw.receivable, lentRemaining + 100_000))
    check('A5', 'Đang nợ = còn lại các khoản đi vay', () => eq(nw.payable, 3_000_000))
    check('A6', 'Tài sản ròng = Tài khoản + Cho vay − Đang nợ', () => eq(nw.total, nw.cash + nw.receivable - nw.payable))
    const debtPage = getDebtSummary(debtList)
    // The debts page counts a loan from a left-out account; the card names it apart.
    check('A7', 'Cho vay + cho vay ngoài báo cáo = trang Vay nợ', () => eq(nw.receivable + nw.leftOut.receivable, debtPage.totalLent))
    check('A8', 'Đang nợ khớp trang Vay nợ', () => eq(nw.payable, debtPage.totalBorrowed))

    // Expected this month: income 20tr salary (+ interest on the repayment); expense 1.5tr + 40k + extras 210k + fee 10k + jar 3tr.
    const interestRows = monthTx.filter((t) => t.source === 'debt' && t.interest)
    const interest = interestRows.reduce((s, t) => s + t.interest, 0)
    const expectedExpense = 1_500_000 + 40_000 + 210_000 + 10_000 + 3_000_000
    check('B1', 'Thu tháng này = lương + lãi cho vay thu về', () => eq(data.summary.cashFlow.current.income, 20_000_000 + interest))
    check('B2', 'Chi tháng này: bỏ khoản ngoài báo cáo, khoản từ tài khoản ngoài báo cáo, phí từ quỹ ngoài báo cáo, điều chỉnh; tính phí chuyển và hũ', () => eq(data.summary.cashFlow.current.expense, expectedExpense))
    check('B3', '"+x tháng này" = thu − chi tháng này', () => eq(data.summary.cashFlow.current.income - data.summary.cashFlow.current.expense, 20_000_000 + interest - expectedExpense))
    check('B4', 'Thu/chi tháng này khớp trang Giao dịch', () => eq([data.summary.cashFlow.current.income, data.summary.cashFlow.current.expense], [txPage.income, txPage.expense]))
    check('B5', 'Biểu đồ 6 tháng: đúng 6 tháng, cũ nhất là tháng −5', () => eq(data.summary.cashFlow.months.map((x) => x.key), [-5, -4, -3, -2, -1, 0].map(monthKey)))
    check('B6', 'Biểu đồ 6 tháng: số liệu từng tháng trước', () => eq(data.summary.cashFlow.months.slice(0, 5).map((x) => [x.income, x.expense]), [5, 4, 3, 2, 1].map((k) => [k * 1_000_000, k * 100_000])))
    // Each past month matches the transactions page for that month.
    const pastOk = []
    for (let k = 1; k <= 5; k++) {
      const s = new Date(`${monthKey(-k)}-01T00:00:00+07:00`), e = new Date(`${monthKey(-k + 1)}-01T00:00:00+07:00`)
      const t = getTransactionSummary([...await tx.getTransactionsInRange(uid, s, e), ...await tx.getDebtPaymentsInRange(uid, s, e)])
      const b = data.summary.cashFlow.months.find((x) => x.key === monthKey(-k))
      pastOk.push(t.income === b.income && t.expense === b.expense)
    }
    check('B7', 'Từng tháng trên biểu đồ khớp trang Giao dịch tháng đó', () => eq(pastOk, [true, true, true, true, true]))
    check('B8', 'Lịch chuyển về được đúng 5 tháng trước (minMonth)', () => eq(data.minMonth, monthKey(-5)))

    // Days.
    const d1 = data.days[thisMonthDay], d2 = data.days[day2]
    check('C1', 'Ngày 2: thu = lương + lãi, chi = 1,5tr + phí 10k', () => eq([d1.income, d1.expense], [20_000_000 + interest, 1_510_000]))
    check('C2', 'Ngày 3: chi = 210k + 40k (00:30 giờ VN vẫn là ngày 3) + 3tr từ hũ', () => eq(d2.expense, 250_000 + 3_000_000))
    const daySheet = await getDayTransactionsAction(thisMonthDay)
    const sheetFig = summarizeFigures(daySheet.data)
    check('C3', 'Sheet ngày: tổng thu/chi từ danh sách khớp ô ngày trên lịch', () => eq([sheetFig.income, sheetFig.expense], [d1.income, d1.expense]))
    const daySum = Object.entries(data.days).filter(([k]) => k.startsWith(month)).reduce((s, [, v]) => [s[0] + v.income, s[1] + v.expense], [0, 0])
    check('C4', 'Tổng các ngày trong tháng = thu/chi tháng', () => eq(daySum, [data.summary.cashFlow.current.income, data.summary.cashFlow.current.expense]))
    const loanSheet = await getDayTransactionsAction(loanOnlyDay)
    check('C5', 'Ngày chỉ có khoản cho vay: lịch có mục cho ngày đó (sheet liệt kê khoản vay như trang Giao dịch)', () => (data.days[loanOnlyDay] ? true : `days[${loanOnlyDay}] không có → sheet hiện "Chưa có giao dịch" dù server trả ${loanSheet.data.length} giao dịch`))
    const bad = await getDayTransactionsAction('2026-02-30')
    check('C6', 'Ngày không tồn tại (2026-02-30) bị từ chối', () => eq(bad.success, false))
    const d1Count = d1.count
    // Day 2 rows: salary, meal, excluded meal, fund meal, transfer, transfer from fund (+2 fees derived not counted), repayment(source → skipped), jar transfer in.
    check('C7', 'Đếm giao dịch ngày (không tính khoản vay/trả nợ, phí tính một lần)', () => eq(d1Count, 7))

    // Allocation.
    const exp = allocationSlices(data.categoryGroups, data.allocation, month, 'expense')
    const inc = allocationSlices(data.categoryGroups, data.allocation, month, 'income')
    check('D1', 'Tổng chi theo hạng mục = chi tháng này', () => eq(exp.total, data.summary.cashFlow.current.expense))
    check('D2', 'Tổng thu theo hạng mục = thu tháng này', () => eq(inc.total, data.summary.cashFlow.current.income))
    check('D3', 'Tối đa 5 nhóm + "Khác (n nhóm)"', () => eq([exp.slices.length <= 6, exp.slices.at(-1).key], [true, 'rest']))
    check('D4', 'Phần trăm cộng lại ≈ 100', () => { const s = exp.slices.reduce((a, x) => a + x.share, 0); return Math.abs(s - 100) <= 2 ? true : `tổng ${s}%` })
    check('D5', 'Phí chuyển khoản là một lát riêng', () => (data.allocation[month].expense['transfer-fee'] === 10_000 ? true : JSON.stringify(data.allocation[month].expense)))
    check('D6', 'Lãi cho vay là một lát riêng bên Thu nhập', () => eq(data.allocation[month].income['debt-interest'] ?? 0, interest))

    // Budgets vs overview.
    check('E1', 'Hạn mức: đã chi tháng này = chi theo hạng mục có danh mục, bỏ hũ (3tr), bỏ phí', () => eq(budget.total.spent, 1_500_000 + 40_000 + 210_000))
    check('E2', 'Hạn mức: ghi riêng phần trả bằng hũ (fromJars)', () => eq(budget.total.fromJars, 3_000_000))
    check('E3', 'Chênh lệch Tổng quan − Hạn mức = hũ + phí chuyển + lãi đi vay (giải thích được)', () => eq(data.summary.cashFlow.current.expense - budget.total.spent, 3_000_000 + 10_000))
    check('E4', 'Mua bằng hũ: Tổng quan và Giao dịch cùng tính vào chi', () => eq(data.allocation[month].expense[shop], txPage.expense - (1_500_000 + 40_000 + 210_000 + 10_000)))

    // Due debts.
    check('F1', 'Sắp đến hạn: khoản đi vay còn 3 ngày', () => eq(data.summary.dueDebts.map((d) => [d.direction, d.daysUntilDue, d.remainingAmount]), [['borrowed', 3, 3_000_000]]))

  } finally {
    await cleanup()
  }
  console.log('\n=== Kết quả')
  for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'} ${x.id} ${x.name}${x.detail ? ` — ${x.detail}` : ''}`)
  console.log(`${results.filter((x) => x.ok).length}/${results.length} PASS`)
  if (results.some((x) => !x.ok)) process.exitCode = 1
}

run().catch((error) => { console.error(error); process.exit(1) })
