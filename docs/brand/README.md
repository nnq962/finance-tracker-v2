# Timi brand

The logo (chosen 2026-10-13, direction "C · Cột tăng dần" of the mockups): three rounded
bars on an ink tile, short then tall, the last one lime and a little lower with the app's AI
sparkle above it, for money kept in order and growing, with AI writing it down. The shape is
the mockup as the user chose it: do not "fix" the lime bar's height. It replaced a "t" mark that, set beside
the name, read as "t timi".

- Colours: tile `#171717` (the app's `--primary` ink), bars `#FFFFFF`, last bar and sparkle
  `#D4F25A` (the app's `--ai` lime).
- The name is not drawn: it is "Timi" in Manrope, the app's font, extra bold, tracking
  -0.03em (`web/components/timi-wordmark.tsx`), at about three quarters of the icon's height
  beside it.
- `timi-icon.svg` is the app icon (`web/app/icon.svg`, also the favicon), with its own rounded
  corners. `timi-icon-square.svg` is the same full bleed, for iOS (`web/app/apple-icon.png`,
  iOS rounds it). `timi-icon-maskable.svg` shrinks the mark to 82% so Android's circle mask
  keeps it clear (`web/public/icons/pwa-maskable-512.png`).
- `timi-icon-dark.svg` is the icon in the app's dark theme (chosen 2026-10-13, "Tối 3"): a white
  tile, ink bars, the last bar and sparkle in a deeper lime `#7FA300`, since the ink tile sinks into
  the dark background. `web/public/icon-dark.svg`; `TimiIcon` (`web/components/timi-icon.tsx`)
  shows it in dark and the ink tile in light. The favicon and installed icons stay the ink tile.
- `timi-icon-light.svg` (cream tile, ink bars, deeper lime) and `timi-icon-lime.svg` (lime tile, ink
  mark) are for other light backgrounds and promotion; `timi-mono-black.svg` is the mark in one
  colour.
- `timi-lockup.png` / `timi-lockup-dark.png`: icon + name for light and dark backgrounds, exported
  at 3x (the name is Manrope, which an SVG file cannot carry).
- `timi-badge.svg`: the mark alone in white, for the one-colour badge Android shows in the
  status bar beside a notification (`web/public/icons/badge-96.png`).

The PNGs and the iOS start-up images (`web/public/splash/`, made from `app/loading.tsx`) are
exported from these files; export them again after changing the icon. The share image
(`web/app/_lib/social-preview-image.tsx`) draws the icon inline and needs the same change.
