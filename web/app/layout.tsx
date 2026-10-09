import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import { PreventZoom } from "@/components/prevent-zoom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const APPLE_STARTUP_SCREENS = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [360, 780, 3],
  [414, 736, 3],
  [375, 667, 2],
  [320, 568, 2],
  [1032, 1376, 2],
  [1024, 1366, 2],
  [834, 1210, 2],
  [834, 1194, 2],
  [834, 1112, 2],
  [820, 1180, 2],
  [810, 1080, 2],
  [768, 1024, 2],
  [744, 1133, 2],
] as const;

const appleStartupImages = APPLE_STARTUP_SCREENS.flatMap(
  ([width, height, pixelRatio]) =>
    (["light", "dark"] as const).map((colorScheme) => ({
      url: `/splash/apple-${width}x${height}-${pixelRatio}x-${colorScheme}.png`,
      media: `screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${pixelRatio}) and (orientation: portrait) and (prefers-color-scheme: ${colorScheme})`,
    })),
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
    startupImage: [
      ...appleStartupImages,
      {
        url: "/splash/launch-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/splash/launch-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // No zooming, as in a native app; inputs use 16px text, so iOS has no reason to zoom into them either.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light dark",
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetBrainsMono.variable} h-full font-sans`}
    >
      {/* Thin smoothing only in the dark theme, where light text would otherwise spread; on a light
          ground the default keeps strokes full (macOS; iOS ignores both). */}
      <body className="min-h-full flex flex-col dark:antialiased">
        <PreventZoom />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
