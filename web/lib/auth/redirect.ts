const DEFAULT_AUTHENTICATED_ROUTE = "/overview"

export function getSafeRedirectPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value

  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/login")
  ) {
    return DEFAULT_AUTHENTICATED_ROUTE
  }

  return path
}
