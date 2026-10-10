import { ImageResponse } from "next/og"

import { SITE_NAME } from "@/lib/site"

export const socialPreviewAlt = "Finance Tracker: tiền của bạn, gọn trong một chỗ. Nói một câu, AI ghi giúp."

export const socialPreviewSize = {
  width: 1200,
  height: 630,
}

export const socialPreviewContentType = "image/png"

// The app's colours, written out: an image cannot read the CSS variables.
const color = {
  canvas: "#f5f4f0",
  ink: "#171717",
  muted: "#858585",
  lime: "#d4f25a",
  limeInk: "#17181a",
  white: "#ffffff",
  grey: "#ecebe6",
  income: "#2e8b57",
  tile: "#f8e3d8",
  tileInk: "#8a4a2b",
}

const title = "Tiền của bạn, gọn trong một chỗ."
const badge = "Nói một câu, AI ghi giúp"
const line = "Thu chi, tài khoản và vay nợ ở một nơi."
const card = ["Tài sản ròng", "55.103.000đ", "+3,2tr", "tháng này", "Tiền vào", "+18.000.000đ", "Ăn trưa", "MoMo", "−45.000đ", "“ăn trưa 45k momo”"]

/**
 * Manrope at one weight, only the glyphs these words use: Google Fonts
 * serves a static TrueType subset to a plain fetch, which the image renderer
 * needs (the variable font is not read).
 */
async function loadManrope(weight: number, text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Manrope:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((response) => response.text())
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!url) throw new Error(`Không tải được font Manrope ${weight}.`)
  return fetch(url).then((response) => response.arrayBuffer())
}

const allText = [SITE_NAME, title, badge, line, ...card, "đ"].join("")

export async function createSocialPreviewImage() {
  const [medium, semibold, bold] = await Promise.all([
    loadManrope(500, allText),
    loadManrope(700, allText),
    loadManrope(800, allText),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: color.canvas,
          color: color.ink,
          fontFamily: "Manrope",
          fontWeight: 700,
          padding: "64px 72px",
        }}
      >
        {/* The words: the name, the AI badge, the title and one line. */}
        <div style={{ display: "flex", width: 560, flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28 }}>
            <svg width={44} height={44} viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#96ccee" d="M9.85 4.28a.59.59 0 0 1 .44.15.54.54 0 0 1 .18.41c0 1.11 0 3.43 0 4.41a.58.58 0 0 1-.45.56 3.42 3.42 0 1 0 4.25 3.81.55.55 0 0 1 .55-.49c1 0 3.34 0 4.4 0a.52.52 0 0 1 .39.17.54.54 0 0 1 .15.4 8.89 8.89 0 1 1-9.92-9.4Z" />
              <path fill="#ffeabb" d="m13.5 2.34-.38.07V7a.58.58 0 0 0 .5.57 3.38 3.38 0 0 1 2.88 2.86.56.56 0 0 0 .56.49c1 0 3.29 0 4.36 0a.56.56 0 0 0 .42-.18.57.57 0 0 0 .15-.42A8.89 8.89 0 0 0 13.55 2c-.15 0 .09.34-.05.34Z" />
              <path fill="#f7bf75" d="M13.12 2.2a.19.19 0 0 1 .19-.2h.35A8.33 8.33 0 0 1 22 9.76l0 .53a.57.57 0 0 1-.15.42.56.56 0 0 1-.42.18H18.7a8.88 8.88 0 0 0-5.58-8.25Z" />
              <path fill="#6f73d5" d="M17.07 13.11a8.89 8.89 0 0 1-7.53 8.78A8.81 8.81 0 0 0 10.9 22a8.9 8.9 0 0 0 8.87-8.32.59.59 0 0 0-.15-.4.55.55 0 0 0-.39-.16Z" />
            </svg>
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                borderRadius: 999,
                background: color.lime,
                color: color.limeInk,
                fontSize: 24,
                padding: "10px 20px",
              }}
            >
              {badge}
            </div>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2 }}>
              {title}
            </div>
            <div style={{ display: "flex", color: color.muted, fontSize: 28, fontWeight: 500 }}>{line}</div>
          </div>
        </div>

        {/* The picture: the app's cards laid over each other, as on the landing. */}
        <div style={{ display: "flex", position: "relative", flex: 1, marginLeft: 40 }}>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 6,
              left: 10,
              right: 0,
              flexDirection: "column",
              borderRadius: 30,
              background: color.ink,
              color: color.white,
              padding: "30px 32px",
              transform: "rotate(-3deg)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", position: "absolute", top: -80, right: -70, width: 240, height: 240, borderRadius: 999, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{card[0]}</span>
            <span style={{ marginTop: 8, fontSize: 52, fontWeight: 800, letterSpacing: -1.5 }}>{card[1]}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 20 }}>
              <span style={{ display: "flex", borderRadius: 999, background: color.lime, color: color.limeInk, padding: "4px 12px", fontWeight: 800 }}>
                {card[2]}
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{card[3]}</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 228,
              left: 0,
              width: 250,
              flexDirection: "column",
              gap: 26,
              borderRadius: 30,
              background: color.lime,
              color: color.limeInk,
              padding: "24px 24px",
              transform: "rotate(2deg)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
            }}
          >
            <span style={{ fontSize: 20, color: "rgba(23,24,26,0.6)", fontWeight: 500 }}>{card[4]}</span>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{card[5]}</span>
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 366,
              right: 0,
              width: 330,
              flexDirection: "column",
              gap: 16,
              borderRadius: 28,
              background: color.white,
              padding: "18px 22px",
              transform: "rotate(-1deg)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.14)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", width: 48, height: 48, borderRadius: 14, background: color.tile, alignItems: "center", justifyContent: "center" }}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color.tileInk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
                  <path d="M7 21h10" />
                </svg>
              </div>
              <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
                <span style={{ fontSize: 22, whiteSpace: "nowrap" }}>{card[6]}</span>
                <span style={{ fontSize: 18, color: color.muted, fontWeight: 500 }}>{card[7]}</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{card[8]}</span>
            </div>
            <div style={{ display: "flex", borderRadius: 999, background: color.grey, fontSize: 18, fontWeight: 500, padding: "8px 16px" }}>
              {card[9]}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...socialPreviewSize,
      fonts: [
        { name: "Manrope", data: medium, style: "normal", weight: 500 },
        { name: "Manrope", data: semibold, style: "normal", weight: 700 },
        { name: "Manrope", data: bold, style: "normal", weight: 800 },
      ],
    },
  )
}
