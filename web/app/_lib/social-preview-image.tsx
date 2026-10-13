import { ImageResponse } from "next/og"

import { SITE_NAME } from "@/lib/site"

export const socialPreviewAlt = "Timi: tiền của bạn, gọn trong một chỗ. Nói một câu, AI ghi giúp."

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
  brandTile: "#0e2a1f",
  /** --ai-strong: the lime that holds on the light canvas. */
  limeDeep: "#669000",
}

/** The logo's four-point sparkle, centred on (x, y), reaching `r` each way. */
function sparkle(x: number, y: number, r: number) {
  const k = r * 0.28
  return `M${x} ${y - r}C${x + k} ${y - k} ${x + k} ${y - k} ${x + r} ${y}C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + r}C${x - k} ${y + k} ${x - k} ${y + k} ${x - r} ${y}C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - r}Z`
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
            {/* Timi's icon and wordmark (docs/brand), the lockup's gap between them. */}
            <svg width={52} height={52} viewBox="0 0 100 100" aria-hidden="true">
              <rect width="100" height="100" rx="24" fill={color.brandTile} />
              <path d="M42 24V62Q42 78 58 78M28 44H56" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d={sparkle(70, 30, 13)} fill={color.lime} />
            </svg>
            <svg width={94} height={52} viewBox="0 0 181 100" aria-label={SITE_NAME}>
              <path
                d="M22 18V70Q22 90 40 90M8 42H38M62 48V90M86 90V60Q86 46 100 46Q114 46 114 60V90M114 60Q114 46 128 46Q142 46 142 60V90M166 48V90"
                stroke={color.ink}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="62" cy="22" r="8" fill={color.ink} />
              <path d={sparkle(166, 20, 14)} fill={color.limeDeep} />
            </svg>
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
