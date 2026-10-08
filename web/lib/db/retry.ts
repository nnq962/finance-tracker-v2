import "server-only"

/** Postgres gave up one of two transactions waiting on each other's rows: running it again succeeds. */
function isDeadlock(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "40P01"
}

/**
 * Runs a database transaction again (up to three times in all) when Postgres
 * breaks a deadlock with a concurrent change by cancelling it: two paths that
 * lock the same accounts and debts in another order (deleting an account
 * while one of its loans is edited) would otherwise fail at random.
 */
export async function retryOnDeadlock<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run()
    } catch (error) {
      if (!isDeadlock(error) || attempt === 3) throw error
    }
  }
}
