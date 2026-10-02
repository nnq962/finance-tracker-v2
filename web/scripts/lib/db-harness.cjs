/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for integration tests. */
/*
 * Loads the app's server TypeScript modules against the finance_test database
 * (created by `npm run db:up`), never the dev database.
 */
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { randomUUID } = require('node:crypto')
const ts = require('typescript')
const pg = require('pg')

require('@next/env').loadEnvConfig(process.cwd())

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Run `npm run db:up` first.')
}

const url = new URL(process.env.DATABASE_URL)
url.pathname = '/finance_test'
process.env.DATABASE_URL = url.toString()

const originalLoad = Module._load
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {}
  // Outside Next.js there is no cache to read from: run the function directly.
  if (id === 'next/cache') return { unstable_cache: (fn) => fn }
  if (id.startsWith('@/')) id = path.join(process.cwd(), id.slice(2))
  return originalLoad.call(this, id, parent, main)
}
require.extensions['.ts'] = (mod, filename) => mod._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
const users = []

module.exports = {
  /** Runs SQL directly, for test setup and assertions. */
  sql: (text, params = []) => pool.query(text, params),

  /** Creates an isolated user; removed with everything it owns by cleanup(). */
  async createUser(prefix) {
    const id = `${prefix}_${randomUUID()}`
    await pool.query('INSERT INTO users (id) VALUES ($1)', [id])
    users.push(id)
    return id
  },

  async cleanup() {
    if (users.length) await pool.query('DELETE FROM users WHERE id = ANY($1)', [users])
    await require('../../lib/db/client.ts').getDb().destroy()
    await pool.end()
  },
}
