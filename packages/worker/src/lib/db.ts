import { createClient, Client } from '@libsql/client/web'

export type Env = {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  CORS_ORIGIN: string
}

export function getDb(env: Env): Client {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })
}

export async function migrate(db: Client): Promise<void> {
  await db.execute(`CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 0
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iesa_id INTEGER,
    name TEXT NOT NULL,
    school TEXT,
    city TEXT,
    nickname TEXT,
    season_id INTEGER REFERENCES seasons(id),
    UNIQUE(iesa_id, season_id)
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER REFERENCES seasons(id),
    date TEXT,
    team_a_id INTEGER REFERENCES teams(id),
    team_b_id INTEGER REFERENCES teams(id),
    score_a INTEGER NOT NULL,
    score_b INTEGER NOT NULL,
    is_postseason INTEGER DEFAULT 0,
    tournament TEXT
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER REFERENCES teams(id),
    season_id INTEGER REFERENCES seasons(id),
    rating REAL NOT NULL,
    games_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    ppg REAL,
    papg REAL,
    avg_margin REAL,
    sos REAL,
    updated_at TEXT,
    UNIQUE(team_id, season_id)
  )`)
}
