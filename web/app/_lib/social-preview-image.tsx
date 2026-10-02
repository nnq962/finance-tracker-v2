import { ImageResponse } from "next/og"

export const socialPreviewAlt =
  "Finance Tracker — Quản lý tài chính cá nhân rõ ràng và đơn giản"

export const socialPreviewSize = {
  width: 1200,
  height: 630,
}

export const socialPreviewContentType = "image/png"

const featurePills = ["Tài khoản", "Giao dịch", "Vay nợ"]

async function loadFont(url: string, name: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Không thể tải font ${name}.`)
  }

  return response.arrayBuffer()
}

const balooFont = loadFont(
  "https://raw.githubusercontent.com/google/fonts/ee334a51f/ofl/baloo2/Baloo2-ExtraBold.ttf",
  "Baloo 2",
)
const nunitoFont = loadFont(
  "https://raw.githubusercontent.com/google/fonts/57661967c8617c151bfbb804945cf64b21d5dad6/ofl/nunito/Nunito-Bold.ttf",
  "Nunito",
)

export async function createSocialPreviewImage() {
  const [balooFontData, nunitoFontData] = await Promise.all([
    balooFont,
    nunitoFont,
  ])

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #fbfaf7 0%, #f5fbf2 52%, #eaf7ff 100%)",
          color: "#2b2a33",
          fontFamily: "Nunito",
          fontWeight: 700,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -150,
            right: -100,
            width: 440,
            height: 440,
            borderRadius: 999,
            background: "rgba(56, 184, 246, 0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -190,
            left: 310,
            width: 500,
            height: 500,
            borderRadius: 999,
            background: "rgba(110, 204, 73, 0.14)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "72px 76px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 640,
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 92,
                  height: 92,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #e7e4dd",
                  borderRadius: 24,
                  background: "#ffffff",
                }}
              >
                <svg
                  width={68}
                  height={68}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#96ccee"
                    d="M9.85 4.28a.59.59 0 0 1 .44.15.54.54 0 0 1 .18.41c0 1.11 0 3.43 0 4.41a.58.58 0 0 1-.45.56 3.42 3.42 0 1 0 4.25 3.81.55.55 0 0 1 .55-.49c1 0 3.34 0 4.4 0a.52.52 0 0 1 .39.17.54.54 0 0 1 .15.4 8.89 8.89 0 1 1-9.92-9.4Z"
                  />
                  <path
                    fill="#ffeabb"
                    d="m13.5 2.34-.38.07V7a.58.58 0 0 0 .5.57 3.38 3.38 0 0 1 2.88 2.86.56.56 0 0 0 .56.49c1 0 3.29 0 4.36 0a.56.56 0 0 0 .42-.18.57.57 0 0 0 .15-.42A8.89 8.89 0 0 0 13.55 2c-.15 0 .09.34-.05.34Z"
                  />
                  <path
                    fill="#f7bf75"
                    d="M13.12 2.2a.19.19 0 0 1 .19-.2h.35A8.33 8.33 0 0 1 22 9.76l0 .53a.57.57 0 0 1-.15.42.56.56 0 0 1-.42.18H18.7a8.88 8.88 0 0 0-5.58-8.25Z"
                  />
                  <path
                    fill="#6f73d5"
                    d="M17.07 13.11a8.89 8.89 0 0 1-7.53 8.78A8.81 8.81 0 0 0 10.9 22a8.9 8.9 0 0 0 8.87-8.32.59.59 0 0 0-.15-.4.55.55 0 0 0-.39-.16Z"
                  />
                </svg>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignSelf: "flex-start",
                    width: "auto",
                    borderRadius: 999,
                    background: "#dff4d7",
                    color: "#3e9727",
                    fontFamily: "Baloo 2",
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    padding: "8px 15px 7px",
                  }}
                >
                  TÀI CHÍNH CÁ NHÂN
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 10,
                    fontFamily: "Baloo 2",
                    fontSize: 38,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  Finance Tracker
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 50,
                flexDirection: "column",
                fontFamily: "Baloo 2",
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: -1.5,
              }}
            >
              <span>Quản lý tài chính</span>
              <span style={{ color: "#0083c4" }}>rõ ràng hơn mỗi ngày.</span>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 42,
                gap: 12,
              }}
            >
              {featurePills.map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    border: "2px solid #e7e4dd",
                    borderRadius: 999,
                    background: "rgba(255, 255, 255, 0.86)",
                    color: "#686470",
                    fontFamily: "Baloo 2",
                    fontSize: 19,
                    fontWeight: 700,
                    padding: "10px 18px",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: 350,
              height: 450,
              flexDirection: "column",
              border: "2px solid #e7e4dd",
              borderRadius: 30,
              background: "rgba(255, 255, 255, 0.94)",
              padding: 28,
              transform: "rotate(2deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "Baloo 2",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Tổng quan
              </span>
              <span
                style={{
                  display: "flex",
                  borderRadius: 999,
                  background: "#e7f7ff",
                  color: "#0083c4",
                  fontFamily: "Baloo 2",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "7px 11px",
                }}
              >
                THÁNG NÀY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 24,
                flexDirection: "column",
                borderRadius: 20,
                background: "linear-gradient(135deg, #242333, #087f70)",
                color: "white",
                padding: "22px 20px",
              }}
            >
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>
                Tài sản ròng
              </span>
              <span
                style={{
                  marginTop: 8,
                  fontFamily: "Baloo 2",
                  fontSize: 32,
                  fontWeight: 800,
                }}
              >
                24.680.000đ
              </span>
              <div
                style={{
                  display: "flex",
                  marginTop: 18,
                  height: 10,
                  overflow: "hidden",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.2)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    width: "72%",
                    borderRadius: 999,
                    background: "#6ecc49",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 22,
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  borderRadius: 18,
                  background: "#eef9ea",
                  padding: 16,
                }}
              >
                <span style={{ fontSize: 14, color: "#686470" }}>Đã thu</span>
                <span
                  style={{
                    marginTop: 7,
                    color: "#3e9727",
                    fontFamily: "Baloo 2",
                    fontSize: 21,
                    fontWeight: 800,
                  }}
                >
                  +8.4tr
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  borderRadius: 18,
                  background: "#fff0ef",
                  padding: 16,
                }}
              >
                <span style={{ fontSize: 14, color: "#686470" }}>Đã chi</span>
                <span
                  style={{
                    marginTop: 7,
                    color: "#c8393a",
                    fontFamily: "Baloo 2",
                    fontSize: 21,
                    fontWeight: 800,
                  }}
                >
                  −3.2tr
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 22,
                flexDirection: "column",
                gap: 12,
              }}
            >
              {["#38b8f6", "#6ecc49", "#ffca3a"].map((color, index) => (
                <div
                  key={color}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: color,
                    }}
                  />
                  <span
                    style={{
                      display: "flex",
                      width: index === 1 ? 180 : 220,
                      height: 12,
                      borderRadius: 999,
                      background: "#e7e4dd",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...socialPreviewSize,
      fonts: [
        {
          name: "Nunito",
          data: nunitoFontData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Baloo 2",
          data: balooFontData,
          style: "normal",
          weight: 800,
        },
      ],
    },
  )
}
