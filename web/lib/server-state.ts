import "server-only"

/**
 * State kept for the whole server process. Next builds a module into each
 * bundle that imports it (instrumentation, every route and page), and each
 * copy has its own module variables: the watcher's watchdog never heard the
 * watcher, and the evening summary always counted 0 errors (2026-10-18).
 * What must be one for the server lives on globalThis, under `name`.
 */
export function serverState<T extends object>(name: string, initial: () => T): T {
  const store = globalThis as typeof globalThis & { __timiServerState?: Record<string, object> }
  store.__timiServerState ??= {}
  return (store.__timiServerState[name] ??= initial()) as T
}
