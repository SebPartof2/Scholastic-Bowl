import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'

export const seasonsRoutes = new Hono<{ Bindings: Env }>()

// List all seasons
seasonsRoutes.get('/', async (c) => {
  const db = getDb(c.env)
  const result = await db.execute('SELECT * FROM seasons ORDER BY name DESC')
  return c.json(result.rows)
})

// Create a season
seasonsRoutes.post('/', async (c) => {
  const body = await c.req.json<{ name: string; is_active?: boolean }>()
  const db = getDb(c.env)

  // If setting as active, deactivate all others first
  if (body.is_active) {
    await db.execute('UPDATE seasons SET is_active = 0')
  }

  const result = await db.execute({
    sql: 'INSERT INTO seasons (name, is_active) VALUES (?, ?) RETURNING *',
    args: [body.name, body.is_active ? 1 : 0],
  })

  return c.json(result.rows[0], 201)
})

// Set active season
seasonsRoutes.put('/:id/activate', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const db = getDb(c.env)
  await db.execute('UPDATE seasons SET is_active = 0')
  await db.execute({ sql: 'UPDATE seasons SET is_active = 1 WHERE id = ?', args: [id] })
  return c.json({ ok: true })
})

// Get active season
seasonsRoutes.get('/active', async (c) => {
  const db = getDb(c.env)
  const result = await db.execute('SELECT * FROM seasons WHERE is_active = 1 LIMIT 1')
  if (result.rows.length === 0) {
    return c.json({ error: 'No active season' }, 404)
  }
  return c.json(result.rows[0])
})
