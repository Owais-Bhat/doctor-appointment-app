/**
 * CSV for the admin exports. A cell that starts with = + - @ (or a tab/CR) is
 * read as a formula by spreadsheet programs, so it is prefixed with a quote:
 * an exported name can never run something when the file is opened.
 * Plain numbers and phone numbers (digits, spaces, + - ( ) .) are left alone.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s = value instanceof Date ? value.toISOString() : String(value)
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: unknown[][]): string {
  // A BOM makes Excel read the file as UTF-8
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
