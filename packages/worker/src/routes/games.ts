import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'

export const gamesRoutes = new Hono<{ Bindings: Env }>()

// List games with optional filters
gamesRoutes.get('/', async (c) => {
  const seasonId = c.req.query('season_id')
  const teamId = c.req.query('team_id')
  const db = getDb(c.env)

  let sql = `SELECT g.*, ta.name AS team_a_name, tb.name AS team_b_name
             FROM games g
             JOIN teams ta ON ta.id = g.team_a_id
             JOIN teams tb ON tb.id = g.team_b_id
             WHERE 1=1`
  const args: (string | number)[] = []

  if (seasonId) {
    sql += ' AND g.season_id = ?'
    args.push(parseInt(seasonId, 10))
  }
  if (teamId) {
    sql += ' AND (g.team_a_id = ? OR g.team_b_id = ?)'
    const tid = parseInt(teamId, 10)
    args.push(tid, tid)
  }

  sql += ' ORDER BY g.date DESC, g.id DESC'

  const result = await db.execute({ sql, args })
  return c.json(result.rows)
})

// Add a single game
gamesRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    season_id: number
    date?: string
    team_a_name: string
    team_b_name: string
    score_a: number
    score_b: number
    is_postseason?: boolean
    tournament?: string
  }>()

  const db = getDb(c.env)

  // Find or create teams
  const teamA = await findOrCreateTeam(db, body.team_a_name, body.season_id)
  const teamB = await findOrCreateTeam(db, body.team_b_name, body.season_id)

  const result = await db.execute({
    sql: `INSERT INTO games (season_id, date, team_a_id, team_b_id, score_a, score_b, is_postseason, tournament)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [body.season_id, body.date || null, teamA, teamB, body.score_a, body.score_b,
           body.is_postseason ? 1 : 0, body.tournament || null],
  })

  return c.json(result.rows[0], 201)
})

// Bulk import games
gamesRoutes.post('/bulk', async (c) => {
  const body = await c.req.json<{
    season_id: number
    games: Array<{
      date?: string
      team_a_name: string
      team_b_name: string
      score_a: number
      score_b: number
      is_postseason?: boolean
      tournament?: string
    }>
  }>()

  const db = getDb(c.env)
  let added = 0

  for (const game of body.games) {
    const teamA = await findOrCreateTeam(db, game.team_a_name, body.season_id)
    const teamB = await findOrCreateTeam(db, game.team_b_name, body.season_id)

    await db.execute({
      sql: `INSERT INTO games (season_id, date, team_a_id, team_b_id, score_a, score_b, is_postseason, tournament)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [body.season_id, game.date || null, teamA, teamB, game.score_a, game.score_b,
             game.is_postseason ? 1 : 0, game.tournament || null],
    })
    added++
  }

  return c.json({ added })
})

// Delete a game
gamesRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const db = getDb(c.env)
  await db.execute({ sql: 'DELETE FROM games WHERE id = ?', args: [id] })
  return c.json({ ok: true })
})

async function findOrCreateTeam(db: any, name: string, seasonId: number): Promise<number> {
  // Normalize name for matching
  const normalized = name.trim()

  const existing = await db.execute({
    sql: 'SELECT id FROM teams WHERE LOWER(name) = LOWER(?) AND season_id = ?',
    args: [normalized, seasonId],
  })

  if (existing.rows.length > 0) {
    return existing.rows[0].id as number
  }

  const result = await db.execute({
    sql: 'INSERT INTO teams (name, season_id) VALUES (?, ?) RETURNING id',
    args: [normalized, seasonId],
  })

  return result.rows[0].id as number
}
