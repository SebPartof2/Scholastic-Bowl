import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'
import { recalculateRatings } from '../lib/ratings'

export const ratingsRoutes = new Hono<{ Bindings: Env }>()

// Get all ratings for a season
ratingsRoutes.get('/', async (c) => {
  const seasonId = c.req.query('season_id')
  const db = getDb(c.env)

  if (!seasonId) {
    return c.json({ error: 'season_id is required' }, 400)
  }

  const result = await db.execute({
    sql: `SELECT r.*, t.name AS team_name, t.city, t.nickname, t.iesa_id
          FROM ratings r
          JOIN teams t ON t.id = r.team_id
          WHERE r.season_id = ?
          ORDER BY r.rating DESC`,
    args: [parseInt(seasonId, 10)],
  })

  return c.json(result.rows)
})

// Trigger rating recalculation
ratingsRoutes.post('/recalculate', async (c) => {
  const seasonId = c.req.query('season_id')
  const db = getDb(c.env)

  if (!seasonId) {
    return c.json({ error: 'season_id is required' }, 400)
  }

  await recalculateRatings(db, parseInt(seasonId, 10))
  return c.json({ ok: true, message: 'Ratings recalculated' })
})
