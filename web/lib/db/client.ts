import "server-only"

import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import pg from "pg"

import type { DB } from "@/lib/db/types"

const { builtins } = pg.types

// Match the parsers to lib/db/types.ts (see the type mapping in
// deploy/scripts/db.sh). Money never exceeds 999,999,999,999,999, which a
// JavaScript number holds exactly; dates stay "YYYY-MM-DD" instead of being
// shifted into the server's time zone.
const parsers: Partial<Record<number, (value: string) => unknown>> = {
  [builtins.INT8]: Number,
  [builtins.NUMERIC]: Number,
  [builtins.DATE]: (value) => value,
}

function createDatabase() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Run `npm run db:up` to create it.")
  }

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString,
        max: 10,
        types: {
          getTypeParser: ((oid: number, format?: "text" | "binary") =>
            parsers[oid] ?? pg.types.getTypeParser(oid, format)) as typeof pg.types.getTypeParser,
        },
      }),
    }),
    // Columns are snake_case in SQL and camelCase in TypeScript.
    plugins: [new CamelCasePlugin()],
  })
}

// Reuse one pool across dev hot reloads instead of opening a new one each time.
const globalForDb = globalThis as typeof globalThis & { db?: Kysely<DB> }

export function getDb() {
  globalForDb.db ??= createDatabase()
  return globalForDb.db
}
