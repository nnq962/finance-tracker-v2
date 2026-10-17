/**
 * A request sent from another site (a form or script elsewhere riding on the
 * user's cookies). request.url carries the server's bind address (e.g.
 * 0.0.0.0:3000) in dev, in Docker and behind the Cloudflare Tunnel; the Host
 * header keeps the address the browser actually used, which it cannot forge.
 */
export function isCrossOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (origin === null) return false

  const host = request.headers.get("host")
  if (!host) return true

  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}
