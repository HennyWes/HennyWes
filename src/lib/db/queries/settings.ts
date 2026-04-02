import { getDb } from '../index'
import type { AppSettings, SettingKey } from '@/types/settings'

export function getSetting(key: SettingKey): string | null {
  const db = getDb()
  const row = db.prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?').get(key)
  return row?.value ?? null
}

export function setSetting(key: SettingKey, value: string): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()
  `).run(key, value)
}

export function getSettings(keys: SettingKey[]): Partial<AppSettings> {
  const db = getDb()
  const rows = db.prepare<[], { key: string; value: string }>('SELECT key, value FROM settings').all()
  const all = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<AppSettings>
  const result: Partial<AppSettings> = {}
  for (const key of keys) {
    if (all[key] !== undefined) result[key] = all[key]
  }
  return result
}

export function setSettings(updates: Partial<AppSettings>): void {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()
  `)
  const insertMany = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) stmt.run(k, v)
  })
  insertMany(Object.entries(updates) as [string, string][])
}
