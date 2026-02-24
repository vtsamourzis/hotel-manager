import Database from "better-sqlite3"
import path from "path"
import { runMigrations } from "./db/migrations"

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "hotel.db")

declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof Database> | undefined
}

function getDb() {
  if (!global._db) {
    global._db = new Database(DB_PATH)
    global._db.pragma("journal_mode = WAL")
    global._db.pragma("foreign_keys = ON")
    runMigrations(global._db)
  }
  return global._db
}

export const db = getDb()
