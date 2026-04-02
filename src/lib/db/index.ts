import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { runMigrations } from './migrate'

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'propreach.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  // Ensure the data directory exists
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  runMigrations(_db)

  return _db
}
