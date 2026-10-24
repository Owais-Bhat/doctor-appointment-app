/**
 * Local-development stand-in for Supabase, backed by db.json.
 * Never used in production (see supabase-admin.ts).
 *
 * Supports the subset of the query builder the app uses:
 *   select / insert / upsert / update / delete
 *   eq, neq, in, gt, gte, lt, lte, order, limit, range
 *   single, maybeSingle, { count: 'exact', head: true }
 * Embedded relations (e.g. `profiles!fk(...)`) are not resolved.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

type Row = Record<string, unknown>;
type Db = Record<string, Row[]>;
type Result = { data: unknown; error: { message: string; code?: string } | null; count?: number | null };

const DB_FILE = path.join(process.cwd(), 'db.json');
const EMPTY_DB: Db = {
  profiles: [],
  doctor_profiles: [],
  doctor_availability: [],
  blocked_dates: [],
  appointments: [],
  reviews: [],
  notifications: [],
  audit_logs: [],
};

function readDb(): Db {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
  try {
    return { ...EMPTY_DB, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return { ...EMPTY_DB };
  }
}

function writeDb(db: Db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

type Filter = (row: Row) => boolean;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private sort: { column: string; ascending: boolean }[] = [];
  private window: { from: number; to: number } | null = null;
  private mode: 'many' | 'single' | 'maybeSingle' = 'many';
  private returning = false;

  constructor(
    private table: string,
    private op: 'select' | 'insert' | 'upsert' | 'update' | 'delete',
    private payload?: Row | Row[],
    private options: { count?: string; head?: boolean; onConflict?: string } = {},
  ) {}

  eq(c: string, v: unknown) { this.filters.push((r) => str(r[c]) === str(v)); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => str(r[c]) !== str(v)); return this; }
  in(c: string, vs: unknown[]) { const s = new Set(vs.map(str)); this.filters.push((r) => s.has(str(r[c]))); return this; }
  gt(c: string, v: unknown) { this.filters.push((r) => str(r[c]) > str(v)); return this; }
  gte(c: string, v: unknown) { this.filters.push((r) => str(r[c]) >= str(v)); return this; }
  lt(c: string, v: unknown) { this.filters.push((r) => str(r[c]) < str(v)); return this; }
  lte(c: string, v: unknown) { this.filters.push((r) => str(r[c]) <= str(v)); return this; }
  /** PostgREST-style `or`, e.g. "date.lt.2026-01-01,status.in.(completed,cancelled)" */
  or(expr: string) {
    const parts: string[] = [];
    let depth = 0, cur = '';
    for (const ch of expr) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) parts.push(cur);
    const tests = parts.map((p) => {
      const [col, op, ...rest] = p.split('.');
      const val = rest.join('.');
      return (r: Row) => {
        const v = str(r[col]);
        switch (op) {
          case 'eq': return v === val;
          case 'neq': return v !== val;
          case 'lt': return v < val;
          case 'lte': return v <= val;
          case 'gt': return v > val;
          case 'gte': return v >= val;
          case 'in': return val.replace(/^\(|\)$/g, '').split(',').includes(v);
          default: return false;
        }
      };
    });
    this.filters.push((r) => tests.some((t) => t(r)));
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) { this.sort.push({ column, ascending: opts?.ascending !== false }); return this; }
  limit(n: number) { this.window = { from: 0, to: n - 1 }; return this; }
  range(from: number, to: number) { this.window = { from, to }; return this; }
  select() { this.returning = true; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybeSingle'; return this; }

  private matches = (row: Row) => this.filters.every((f) => f(row));

  private execute(): Result {
    const db = readDb();
    const rows = (db[this.table] ??= []);
    let out: Row[] = [];

    if (this.op === 'select') {
      out = rows.filter(this.matches);
    } else if (this.op === 'insert' || this.op === 'upsert') {
      const items: Row[] = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map((item) => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...item,
      }));
      const key = this.options.onConflict ?? 'id';
      for (const item of items) {
        const idx = this.op === 'upsert' ? rows.findIndex((r) => str(r[key]) === str(item[key])) : -1;
        if (idx > -1) rows[idx] = { ...rows[idx], ...item };
        else rows.push(item);
      }
      out = items;
      writeDb(db);
    } else if (this.op === 'update') {
      for (const row of rows) if (this.matches(row)) { Object.assign(row, this.payload); out.push(row); }
      writeDb(db);
    } else if (this.op === 'delete') {
      out = rows.filter(this.matches);
      db[this.table] = rows.filter((r) => !this.matches(r));
      writeDb(db);
    }

    for (const { column, ascending } of [...this.sort].reverse()) {
      out = [...out].sort((a, b) => (str(a[column]) < str(b[column]) ? -1 : str(a[column]) > str(b[column]) ? 1 : 0) * (ascending ? 1 : -1));
    }
    const count = this.options.count ? out.length : null;
    if (this.window) out = out.slice(this.window.from, this.window.to + 1);
    if (this.options.head) return { data: null, error: null, count };
    if (this.op !== 'select' && !this.returning) return { data: null, error: null, count };

    if (this.mode === 'single') {
      return out[0]
        ? { data: out[0], error: null, count }
        : { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count };
    }
    if (this.mode === 'maybeSingle') return { data: out[0] ?? null, error: null, count };
    return { data: out, error: null, count };
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve().then(() => this.execute()).then(onfulfilled, onrejected);
  }
}

export function createMockClient() {
  return {
    from(table: string) {
      return {
        select: (_fields?: string, options?: { count?: string; head?: boolean }) => new Query(table, 'select', undefined, options),
        insert: (values: Row | Row[]) => new Query(table, 'insert', values),
        upsert: (values: Row | Row[], options?: { onConflict?: string }) => new Query(table, 'upsert', values, options),
        update: (values: Row) => new Query(table, 'update', values),
        delete: () => new Query(table, 'delete'),
      };
    },
  };
}
