/**
 * The desktop column (2026-10-25): 1040 wide with 48 on each side, centred,
 * shared by the top bar and the pages so their edges line up. The user keeps
 * wide margins rather than using the whole window; the main layout's
 * content takes the same from md (md:max-w-[1136px], --main-content-px 48).
 * A plain module: a "use client" module's strings reach server components
 * as references.
 */
export const desktopColumnClassName = "mx-auto w-full max-w-[1136px] px-12"
