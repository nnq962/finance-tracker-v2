# Timi brand

The logo set (2026-10-13), from the Figma Make design "Design logo for Timi app": a
rounded "t" with a lime sparkle (the app's AI mark) on a deep green tile.

- Colours: tile `#0E2A1F`, mark `#FFFFFF`, sparkle `#D4F25A` (the app's `--ai` lime;
  the design's `#C6F432` was moved onto it so the logo and the app agree).
- `timi-icon.svg` is the app icon (`web/app/icon.svg`, also the favicon), with its own
  rounded corners. `timi-icon-square.svg` is the same full bleed, for iOS
  (`web/app/apple-icon.png`, iOS rounds it). `timi-icon-maskable.svg` shrinks the mark
  to 82% so Android's circle mask keeps it clear (`web/public/icons/pwa-maskable-512.png`).
- `timi-icon-light/lime/mono`, `timi-wordmark*` and `timi-lockup*` are kept for later use
  (landing page, social images); the wordmark's last "i" carries the sparkle as its dot.

The PNGs and the iOS start-up images (`web/public/splash/`, made from `app/loading.tsx`)
are exported from these files; export them again after changing the icon.
