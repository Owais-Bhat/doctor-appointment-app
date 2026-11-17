/**
 * MySQL / MariaDB database client (e.g. a Hostinger database).
 *
 * The app's routes talk to the database through the Supabase query builder
 * (`db.from('appointments').select(...).eq(...)`). This file offers the same
 * builder on top of MySQL, so the routes work unchanged on either database.
 *
 * Supported: select / insert / update / delete, eq, neq, in, is, gt, gte, lt,
 * lte, or, order, limit, range, single, maybeSingle, { count: 'exact', head },
 * and the embedded to-one relations listed in RELATIONS.
 *
 * Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (and MYSQL_PORT
 * if it is not 3306). Create the tables with mysql/schema.sql.
 */
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise'
import { randomUUID } from 'crypto'

type Row = Record<string, unknown>
type DbError = { message: string; code?: string }
type Result = { data: unknown; error: DbError | null; count?: number | null }
type Runner = Pool | PoolConnection

/** What the client needs to know about each table. */
const TABLES: Record<string, { uuidId: boolean; json: string[]; createdAt: boolean; updatedAt: boolean }> = {
  profiles: { uuidId: false, json: ['health_stats'], createdAt: true, updatedAt: true },
  doctor_profiles: { uuidId: true, json: ['qualifications', 'languages'], createdAt: true, updatedAt: false },
  doctor_availability: { uuidId: true, json: [], createdAt: false, updatedAt: false },
  blocked_dates: { uuidId: true, json: [], createdAt: true, updatedAt: false },
  appointments: { uuidId: true, json: ['intake'], createdAt: true, updatedAt: true },
  reviews: { uuidId: true, json: [], createdAt: true, updatedAt: false },
  notifications: { uuidId: true, json: [], createdAt: true, updatedAt: false },
  audit_logs: { uuidId: true, json: ['metadata'], createdAt: true, updatedAt: false },
  push_tokens: { uuidId: true, json: [], createdAt: true, updatedAt: true },
}

/**
 * Tables the app creates by itself the first time they are used, so a feature
 * added to a live site needs no phpMyAdmin import. Each statement is the same
 * as in mysql/schema.sql — change both together.
 */
const CREATE_WHEN_MISSING: Record<string, string> = {
  push_tokens: `
CREATE TABLE IF NOT EXISTS push_tokens (
  id             CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id        VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token          VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,  -- ExponentPushToken[...]
  platform       VARCHAR(10)  NULL,                                            -- android, ios
  last_ticket_id VARCHAR(64)  NULL,
  last_ticket_at DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY push_tokens_token_unique (token),
  KEY push_tokens_user_idx (user_id),
  KEY push_tokens_ticket_idx (last_ticket_at),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
}
/** MySQL's error number for "table doesn't exist". */
const NO_SUCH_TABLE = 1146

/** Foreign keys used as embedded relations, e.g. `profiles!appointments_patient_id_fkey(full_name)`. */
const RELATIONS: Record<string, { column: string; table: string }> = {
  doctor_profiles_profile_id_fkey: { column: 'profile_id', table: 'profiles' },
  appointments_patient_id_fkey: { column: 'patient_id', table: 'profiles' },
  appointments_doctor_id_fkey: { column: 'doctor_id', table: 'doctor_profiles' },
  audit_logs_actor_id_fkey: { column: 'actor_id', table: 'profiles' },
}

/**
 * MySQL has no partial unique index, so "one active booking per slot" is a
 * unique `slot_key` column: filled while a visit is pending or confirmed,
 * NULL otherwise (NULLs never collide). Kept up to date on every write here.
 */
const ACTIVE = ['pending', 'confirmed']
const SLOT_KEY_SQL =
  "`slot_key` = IF(`status` IN ('pending','confirmed'), CONCAT(`doctor_id`,'|',`appointment_date`,'|',`appointment_time`), NULL)"

export function mysqlConfigured(): boolean {
  return !!(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE)
}

const globalForPool = globalThis as unknown as { __medflowMysqlPool?: Pool }

function getPool(): Pool {
  if (globalForPool.__medflowMysqlPool) return globalForPool.__medflowMysqlPool
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    // Shared hosting allows few connections per user
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE) || 5,
    waitForConnections: true,
    // Times are stored and read as UTC text; dates stay "YYYY-MM-DD"
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: true,
    typeCast(field, next) {
      // TINYINT(1) columns are booleans (is_active, is_verified, is_read, …)
      if (field.type === 'TINY' && field.length === 1) {
        const v = field.string()
        return v === null ? null : v === '1'
      }
      return next()
    },
  })
  globalForPool.__medflowMysqlPool = pool
  return pool
}

/* ── Values ─────────────────────────────────────────────────────────── */

const IDENT = /^[a-z_][a-z0-9_]*$/
function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Invalid column or table name: ${name}`)
  return `\`${name}\``
}

const ISO_UTC = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d{1,6})?Z$/

/** JS value → value MySQL accepts (ISO timestamps become "YYYY-MM-DD HH:MM:SS.mmm" in UTC). */
function toDb(v: unknown): unknown {
  if (v === undefined) return null
  if (v instanceof Date) return v.toISOString().replace('T', ' ').replace('Z', '')
  if (typeof v === 'string') {
    const m = ISO_UTC.exec(v)
    return m ? `${m[1]} ${m[2]}${m[3] ?? ''}` : v
  }
  if (v !== null && typeof v === 'object') return JSON.stringify(v)
  return v
}

/** Row from MySQL → the shape the routes expect from Supabase. */
function fromDb(table: string, row: Row): Row {
  const out: Row = {}
  const json = TABLES[table].json
  for (const [k, v] of Object.entries(row)) {
    if (k === 'slot_key') continue
    if (json.includes(k) && typeof v === 'string') {
      try {
        out[k] = JSON.parse(v)
      } catch {
        out[k] = null
      }
    } else if (k.endsWith('_at') && typeof v === 'string' && /^\d{4}-\d{2}-\d{2} /.test(v)) {
      out[k] = `${v.replace(' ', 'T')}Z` // stored in UTC
    } else {
      out[k] = v
    }
  }
  return out
}

function toError(e: unknown): DbError {
  const err = e as { errno?: number; message?: string }
  // Same codes PostgreSQL uses, which the routes already check
  if (err?.errno === 1062) return { message: 'duplicate key value violates unique constraint', code: '23505' }
  if (err?.errno === 1451 || err?.errno === 1452) return { message: 'foreign key constraint violation', code: '23503' }
  return { message: err?.message ?? 'Database error' }
}

/* ── select("a, b, rel!fk(c, d)") ───────────────────────────────────── */

type Selection = { columns: string[] | '*'; relations: { key: string; fk: string; selection: Selection }[] }

function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts.map((p) => p.trim()).filter(Boolean)
}

function parseSelect(fields: string | undefined): Selection {
  const sel: Selection = { columns: [], relations: [] }
  for (const part of splitTopLevel(fields?.trim() || '*')) {
    const rel = /^([a-z_]+)!([a-z_]+)\s*\(([\s\S]*)\)$/.exec(part)
    if (rel) {
      if (!RELATIONS[rel[2]]) throw new Error(`Unknown relation: ${rel[2]}`)
      sel.relations.push({ key: rel[1], fk: rel[2], selection: parseSelect(rel[3]) })
    } else if (part === '*') {
      sel.columns = '*'
    } else if (sel.columns !== '*') {
      sel.columns.push(part)
    }
  }
  return sel
}

async function fetchRows(db: Runner, table: string, sel: Selection, tail: string, params: unknown[]): Promise<Row[]> {
  // Fetch the foreign-key columns the relations need, even if not asked for
  const extra = sel.relations.map((r) => RELATIONS[r.fk].column)
  const cols = sel.columns === '*' ? '*' : [...new Set([...sel.columns, ...extra])].map(ident).join(', ')
  const [raw] = await db.query<RowDataPacket[]>(`SELECT ${cols} FROM ${ident(table)}${tail}`, params)
  const rows = raw.map((r) => fromDb(table, r))

  for (const rel of sel.relations) {
    const { column, table: target } = RELATIONS[rel.fk]
    const ids = [...new Set(rows.map((r) => r[column]).filter((v) => v !== null && v !== undefined))]
    const found = new Map<string, Row>()
    if (ids.length) {
      const wantsId = rel.selection.columns === '*' || rel.selection.columns.includes('id')
      const inner: Selection = wantsId
        ? rel.selection
        : { ...rel.selection, columns: [...(rel.selection.columns as string[]), 'id'] }
      for (const r of await fetchRows(db, target, inner, ' WHERE `id` IN (?)', [ids])) {
        const key = String(r.id)
        if (!wantsId) delete r.id
        found.set(key, r)
      }
    }
    for (const r of rows) r[rel.key] = found.get(String(r[column])) ?? null
  }

  if (sel.columns !== '*') {
    for (const c of extra) if (!sel.columns.includes(c)) for (const r of rows) delete r[c]
  }
  return rows
}

/* ── Query builder ──────────────────────────────────────────────────── */

type Op = 'select' | 'insert' | 'update' | 'delete'
const COMPARE: Record<string, string> = { eq: '=', neq: '<>', lt: '<', lte: '<=', gt: '>', gte: '>=' }

class Query implements PromiseLike<Result> {
  private where: string[] = []
  private params: unknown[] = []
  private sort: string[] = []
  private window: { limit: number; offset: number } | null = null
  private mode: 'many' | 'single' | 'maybeSingle' = 'many'
  private returning = false
  private problem: Error | null = null

  constructor(
    private table: string,
    private op: Op,
    private payload?: Row | Row[],
    private fields?: string,
    private options: { count?: string; head?: boolean } = {},
  ) {}

  private cond(column: string, sql: string, ...params: unknown[]) {
    try {
      this.where.push(`${ident(column)} ${sql}`)
      this.params.push(...params)
    } catch (e) {
      this.problem = e as Error
    }
    return this
  }

  eq(c: string, v: unknown) { return v === null ? this.cond(c, 'IS NULL') : this.cond(c, '= ?', toDb(v)) }
  neq(c: string, v: unknown) { return v === null ? this.cond(c, 'IS NOT NULL') : this.cond(c, '<> ?', toDb(v)) }
  gt(c: string, v: unknown) { return this.cond(c, '> ?', toDb(v)) }
  gte(c: string, v: unknown) { return this.cond(c, '>= ?', toDb(v)) }
  lt(c: string, v: unknown) { return this.cond(c, '< ?', toDb(v)) }
  lte(c: string, v: unknown) { return this.cond(c, '<= ?', toDb(v)) }
  is(c: string, v: null | boolean) { return v === null ? this.cond(c, 'IS NULL') : this.cond(c, '= ?', v) }
  in(c: string, vs: unknown[]) {
    if (!vs.length) {
      this.where.push('1 = 0')
      return this
    }
    return this.cond(c, 'IN (?)', vs.map(toDb))
  }

  /** PostgREST-style `or`, e.g. "appointment_date.lt.2026-01-01,status.in.(completed,cancelled)" */
  or(expr: string) {
    try {
      const tests: string[] = []
      for (const part of splitTopLevel(expr)) {
        const [col, op, ...rest] = part.split('.')
        const val = rest.join('.')
        if (op === 'in') {
          tests.push(`${ident(col)} IN (?)`)
          this.params.push(val.replace(/^\(|\)$/g, '').split(','))
        } else if (COMPARE[op]) {
          tests.push(`${ident(col)} ${COMPARE[op]} ?`)
          this.params.push(toDb(val))
        } else {
          throw new Error(`Unsupported filter: ${op}`)
        }
      }
      this.where.push(`(${tests.join(' OR ')})`)
    } catch (e) {
      this.problem = e as Error
    }
    return this
  }

  order(column: string, opts?: { ascending?: boolean }) {
    try {
      this.sort.push(`${ident(column)} ${opts?.ascending === false ? 'DESC' : 'ASC'}`)
    } catch (e) {
      this.problem = e as Error
    }
    return this
  }
  limit(n: number) { this.window = { limit: Math.max(0, Math.floor(n)), offset: 0 }; return this }
  range(from: number, to: number) {
    this.window = { limit: Math.max(0, Math.floor(to - from + 1)), offset: Math.max(0, Math.floor(from)) }
    return this
  }
  /** After insert/update: return the changed rows (only the listed columns, if given). */
  select(fields?: string) { this.returning = true; this.fields = fields; return this }
  single() { this.mode = 'single'; return this }
  maybeSingle() { this.mode = 'maybeSingle'; return this }

  private whereSql() {
    return this.where.length ? ` WHERE ${this.where.join(' AND ')}` : ''
  }

  private async runSelect(): Promise<{ rows: Row[]; count: number | null }> {
    const pool = getPool()
    let count: number | null = null
    if (this.options.count) {
      const [c] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM ${ident(this.table)}${this.whereSql()}`, this.params)
      count = Number(c[0]?.n ?? 0)
    }
    if (this.options.head) return { rows: [], count }

    let tail = this.whereSql()
    if (this.sort.length) tail += ` ORDER BY ${this.sort.join(', ')}`
    if (this.window) tail += ` LIMIT ${this.window.limit} OFFSET ${this.window.offset}`
    return { rows: await fetchRows(pool, this.table, parseSelect(this.fields), tail, this.params), count }
  }

  private async runInsert(): Promise<Row[]> {
    const meta = TABLES[this.table]
    const now = new Date()
    const items = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map((item) => {
      const row: Row = { ...item }
      if (meta.uuidId && !row.id) row.id = randomUUID()
      if (meta.createdAt && !row.created_at) row.created_at = now
      if (meta.updatedAt && !row.updated_at) row.updated_at = now
      if (this.table === 'appointments') {
        const time = String(row.appointment_time ?? '')
        row.slot_key = ACTIVE.includes(String(row.status ?? 'pending'))
          ? `${row.doctor_id}|${row.appointment_date}|${time.length === 5 ? `${time}:00` : time}`
          : null
      }
      return row
    })

    const conn = await getPool().getConnection()
    try {
      await conn.beginTransaction()
      for (const row of items) {
        const cols = Object.keys(row)
        await conn.query(`INSERT INTO ${ident(this.table)} (${cols.map(ident).join(', ')}) VALUES (?)`, [cols.map((c) => toDb(row[c]))])
      }
      const ids = items.map((r) => r.id).filter((v) => v !== undefined && v !== null)
      const rows = this.returning && ids.length
        ? await fetchRows(conn, this.table, parseSelect(this.fields), ' WHERE `id` IN (?)', [ids])
        : []
      await conn.commit()
      return rows
    } catch (e) {
      await conn.rollback().catch(() => {})
      throw e
    } finally {
      conn.release()
    }
  }

  private setSql(): { sql: string; params: unknown[] } {
    const values = (this.payload ?? {}) as Row
    const cols = Object.keys(values)
    if (!cols.length) throw new Error('Nothing to update')
    let sql = cols.map((c) => `${ident(c)} = ?`).join(', ')
    // After the other columns, so it sees the new status, date and time
    if (this.table === 'appointments') sql += `, ${SLOT_KEY_SQL}`
    return { sql, params: cols.map((c) => toDb(values[c])) }
  }

  private async runUpdate(): Promise<Row[]> {
    if (!this.where.length) throw new Error('Refusing to update every row: add a filter')
    const set = this.setSql()
    const table = ident(this.table)

    if (!this.returning) {
      await getPool().query<ResultSetHeader>(`UPDATE ${table} SET ${set.sql}${this.whereSql()}`, [...set.params, ...this.params])
      return []
    }

    // Lock the matching rows first, so two requests can't both "win" the same
    // change (paying, refunding, sending a reminder, confirming a visit)
    const conn = await getPool().getConnection()
    try {
      await conn.beginTransaction()
      const [locked] = await conn.query<RowDataPacket[]>(`SELECT \`id\` FROM ${table}${this.whereSql()} FOR UPDATE`, this.params)
      const ids = locked.map((r) => r.id)
      let rows: Row[] = []
      if (ids.length) {
        await conn.query(`UPDATE ${table} SET ${set.sql} WHERE \`id\` IN (?)`, [...set.params, ids])
        rows = await fetchRows(conn, this.table, parseSelect(this.fields), ' WHERE `id` IN (?)', [ids])
      }
      await conn.commit()
      return rows
    } catch (e) {
      await conn.rollback().catch(() => {})
      throw e
    } finally {
      conn.release()
    }
  }

  private async runDelete(): Promise<Row[]> {
    if (!this.where.length) throw new Error('Refusing to delete every row: add a filter')
    await getPool().query(`DELETE FROM ${ident(this.table)}${this.whereSql()}`, this.params)
    return []
  }

  private async run(): Promise<{ rows: Row[]; count: number | null }> {
    if (this.op === 'select') return this.runSelect()
    if (this.op === 'insert') return { rows: await this.runInsert(), count: null }
    if (this.op === 'update') return { rows: await this.runUpdate(), count: null }
    return { rows: await this.runDelete(), count: null }
  }

  private async execute(): Promise<Result> {
    try {
      if (this.problem) throw this.problem
      if (!TABLES[this.table]) throw new Error(`Unknown table: ${this.table}`)

      let rows: Row[]
      let count: number | null
      try {
        ;({ rows, count } = await this.run())
      } catch (e) {
        const create = CREATE_WHEN_MISSING[this.table]
        if (!create || (e as { errno?: number })?.errno !== NO_SUCH_TABLE) throw e
        await getPool().query(create)
        ;({ rows, count } = await this.run())
      }

      if (this.options.head) return { data: null, error: null, count }
      if (this.op !== 'select' && !this.returning) return { data: null, error: null, count }
      if (this.mode === 'single') {
        return rows[0]
          ? { data: rows[0], error: null, count }
          : { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count }
      }
      if (this.mode === 'maybeSingle') return { data: rows[0] ?? null, error: null, count }
      return { data: rows, error: null, count }
    } catch (e) {
      const error = toError(e)
      if (error.code !== '23505') console.error(`MySQL ${this.op} on ${this.table} failed:`, error.message)
      return { data: null, error, count: null }
    }
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createMysqlClient() {
  return {
    from(table: string) {
      return {
        select: (fields?: string, options?: { count?: string; head?: boolean }) => new Query(table, 'select', undefined, fields, options),
        insert: (values: Row | Row[]) => new Query(table, 'insert', values),
        update: (values: Row) => new Query(table, 'update', values),
        delete: () => new Query(table, 'delete'),
      }
    },
  }
}
