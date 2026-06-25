/**
 * CSV-style flat-file storage layer.
 *
 * Browsers can't write real .txt/.csv files to disk, so each "file" is a
 * CSV-formatted string persisted in localStorage. The API mimics a real
 * file system: read("users.csv") -> parse -> mutate -> write("users.csv").
 */

const NS = "bitepass:fs:";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function readFile(name: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NS + name) ?? "";
}
export function writeFile(name: string, content: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NS + name, content);
}

export function readTable<T = Record<string, string>>(name: string): T[] {
  return parseCSV(readFile(name)) as T[];
}
export function writeTable(name: string, rows: Record<string, unknown>[]): void {
  writeFile(name, toCSV(rows));
}
export function appendRow(name: string, row: Record<string, unknown>): void {
  const rows = readTable(name) as Record<string, unknown>[];
  rows.push(row);
  writeTable(name, rows);
}
export function updateRow(
  name: string,
  match: (r: Record<string, string>) => boolean,
  patch: Record<string, unknown>,
): void {
  const rows = readTable(name);
  const next = rows.map((r) => (match(r) ? { ...r, ...patch } : r));
  writeTable(name, next as Record<string, unknown>[]);
}
export function deleteRow(name: string, match: (r: Record<string, string>) => boolean): void {
  const rows = readTable(name);
  writeTable(name, rows.filter((r) => !match(r)) as Record<string, unknown>[]);
}

export const FILES = {
  users: "users.csv",
  restaurants: "restaurants.csv",
  meals: "meals.csv",
  reviews: "reviews.csv",
  feedback: "feedback.csv",
  platformStats: "platform-stats.csv",
  orders: "orders.csv",
  discounts: "discounts.csv",
  session: "session.txt",
} as const;
