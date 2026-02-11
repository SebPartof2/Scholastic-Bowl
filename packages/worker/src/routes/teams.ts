import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'

export const teamsRoutes = new Hono<{ Bindings: Env }>()

// List teams for a season
teamsRoutes.get('/', async (c) => {
  const seasonId = c.req.query('season_id')
  const db = getDb(c.env)

  if (!seasonId) {
    return c.json({ error: 'season_id is required' }, 400)
  }

  const result = await db.execute({
    sql: `SELECT t.*, r.rating, r.wins, r.losses, r.games_played, r.ppg, r.papg, r.avg_margin, r.sos
          FROM teams t
          LEFT JOIN ratings r ON r.team_id = t.id AND r.season_id = t.season_id
          WHERE t.season_id = ?
          ORDER BY t.name`,
    args: [parseInt(seasonId, 10)],
  })

  return c.json(result.rows)
})

// Team detail with games
teamsRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const db = getDb(c.env)

  const teamResult = await db.execute({
    sql: `SELECT t.*, r.rating, r.wins, r.losses, r.games_played, r.ppg, r.papg, r.avg_margin, r.sos
          FROM teams t
          LEFT JOIN ratings r ON r.team_id = t.id AND r.season_id = t.season_id
          WHERE t.id = ?`,
    args: [id],
  })

  if (teamResult.rows.length === 0) {
    return c.json({ error: 'Team not found' }, 404)
  }

  const team = teamResult.rows[0]

  const gamesResult = await db.execute({
    sql: `SELECT g.*,
            ta.name AS team_a_name, tb.name AS team_b_name,
            ra.rating AS team_a_rating, rb.rating AS team_b_rating
          FROM games g
          JOIN teams ta ON ta.id = g.team_a_id
          JOIN teams tb ON tb.id = g.team_b_id
          LEFT JOIN ratings ra ON ra.team_id = g.team_a_id AND ra.season_id = g.season_id
          LEFT JOIN ratings rb ON rb.team_id = g.team_b_id AND rb.season_id = g.season_id
          WHERE g.team_a_id = ? OR g.team_b_id = ?
          ORDER BY g.date DESC, g.id DESC`,
    args: [id, id],
  })

  return c.json({ team, games: gamesResult.rows })
})
