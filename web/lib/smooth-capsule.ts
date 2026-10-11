/**
 * A capsule's outline with continuous ends, as iOS draws them, for a CSS
 * `clip-path: path()` or an SVG path. CSS's round ends are a half circle met
 * by a straight edge, where the bend jumps from none to 1/R at once and shows
 * as a ripple along the join. Here the tip is still that half circle, but from
 * `blend` degrees off the tip on each side a cubic takes over that starts dead
 * straight (no bend) and meets the circle with the circle's own bend, so the
 * bend grows from nothing and never jumps. Width under the height: an oval.
 */
export function smoothCapsule(width: number, height: number, blend = 60) {
  const r = height / 2
  const phi = (blend * Math.PI) / 180
  const sin = Math.sin(phi)
  const cos = Math.cos(phi)
  // Where the circle takes over, from the end's centre.
  const ax = r * sin
  const ay = r - r * cos
  // The cubic's last handle lies on the straight edge's line, so it starts with
  // no bend, and along the circle's tangent where they meet.
  const t = (r * (1 - cos)) / sin
  const p2 = ax - t * cos
  // Its first handle sits so the bend where they meet is exactly 1/R.
  const p1 = p2 - (1.5 * t * t) / (r * sin)
  const p0 = p1 - 0.6 * (p2 - p1)
  const right = width - r
  const left = r
  const x = (offset: number, side: 1 | -1) => (side === 1 ? right + offset : left - offset).toFixed(3)
  const y = (value: number) => value.toFixed(3)
  return [
    `M ${x(p0, -1)} 0`,
    `L ${x(p0, 1)} 0`,
    `C ${x(p1, 1)} 0 ${x(p2, 1)} 0 ${x(ax, 1)} ${y(ay)}`,
    `A ${r} ${r} 0 0 1 ${x(ax, 1)} ${y(height - ay)}`,
    `C ${x(p2, 1)} ${height} ${x(p1, 1)} ${height} ${x(p0, 1)} ${height}`,
    `L ${x(p0, -1)} ${height}`,
    `C ${x(p1, -1)} ${height} ${x(p2, -1)} ${height} ${x(ax, -1)} ${y(height - ay)}`,
    `A ${r} ${r} 0 0 1 ${x(ax, -1)} ${y(ay)}`,
    `C ${x(p2, -1)} 0 ${x(p1, -1)} 0 ${x(p0, -1)} 0`,
    "Z",
  ].join(" ")
}
