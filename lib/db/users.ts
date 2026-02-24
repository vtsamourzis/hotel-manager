import { db } from "../db"

export function getUserByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: number; name: string; email: string; password_hash: string }
    | undefined
}

export function isSetupComplete(): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
  return row.count > 0
}

export function createUser(name: string, email: string, passwordHash: string) {
  return db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, passwordHash)
}
