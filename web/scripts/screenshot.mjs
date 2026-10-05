/*
 * Screenshots a page of the dev server, signed in as the seeded dev user
 * (DEV_LOGIN=1 in .env.local, `npm run dev` running). Uses the installed
 * Google Chrome through playwright-core.
 *
 * Run: node scripts/screenshot.mjs /transactions [options]
 *   --device=phone|desktop  phone: 390×844 at 3x with touch (default); desktop: 1440×900
 *   --theme=light|dark      default light
 *   --full                  the whole page, not just the first screen
 *   --scroll=<px>           scroll the page this far first
 *   --out=<file.png>        default screenshots/<page>-<device>-<theme>.png
 *   --base=<url>            default http://localhost:3000
 */
import fs from "node:fs"
import path from "node:path"

import { chromium } from "playwright-core"

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : fallback
}
const pagePath = args.find((arg) => arg.startsWith("/")) ?? "/overview"
const device = option("device", "phone")
const theme = option("theme", "light")
const base = option("base", "http://localhost:3000")
const full = args.includes("--full")
const scroll = Number(option("scroll", "0"))
const slug = pagePath.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"
const out = option("out", path.join("screenshots", `${slug}-${device}-${theme}.png`))

const viewport = device === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 }

const browser = await chromium.launch({ channel: "chrome", headless: true })
try {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: device === "desktop" ? 1 : 3,
    isMobile: device !== "desktop",
    hasTouch: device !== "desktop",
    colorScheme: theme,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
  })
  // The app's theme choice, read before it paints.
  await context.addInitScript((value) => localStorage.setItem("theme", value), theme)
  const page = await context.newPage()
  await page.goto(`${base}/api/dev/login?next=${encodeURIComponent(pagePath)}`, { waitUntil: "networkidle" })
  if (new URL(page.url()).pathname.startsWith("/login")) {
    throw new Error("Not signed in: is DEV_LOGIN=1 set in .env.local and the dev server restarted?")
  }

  // The dev server's Next.js badge is not part of the app.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })

  // Phones scroll inside the app shell's pane, desktop scrolls the window.
  const pane = "[data-main-scroll-viewport]"
  if (scroll) {
    await page.evaluate(([selector, top]) => {
      const element = document.querySelector(selector)
      const target = element && element.scrollHeight > element.clientHeight ? element : document.scrollingElement
      target.scrollTo(0, top)
    }, [pane, scroll])
  }
  if (full) {
    const height = await page.evaluate((selector) => {
      const element = document.querySelector(selector)
      return Math.max(document.documentElement.scrollHeight, element?.scrollHeight ?? 0)
    }, pane)
    await page.setViewportSize({ width: viewport.width, height: Math.min(height, 12000) })
  }
  await page.waitForTimeout(600)

  fs.mkdirSync(path.dirname(out), { recursive: true })
  await page.screenshot({ path: out, fullPage: full })
  console.log(out)
} finally {
  await browser.close()
}
