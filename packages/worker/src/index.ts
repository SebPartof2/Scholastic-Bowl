import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { seasonsRoutes } from './routes/seasons'
import { teamsRoutes } from './routes/teams'
import { gamesRoutes } from './routes/games'
import { ratingsRoutes } from './routes/ratings'
import { matchupRoutes } from './routes/matchup'
import { scrapeRoutes } from './routes/scrape'
import { Env, getDb, migrate } from './lib/db'

type Bindings = Env

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors({
  origin: (origin, c) => {
    const allowed = c.env.CORS_ORIGIN
    // Allow localhost in dev and the configured production origin
    if (origin === 'http://localhost:5173' || origin === allowed) {
      return origin
    }
    return allowed
  },
}))

app.post('/api/migrate', async (c) => {
  const db = getDb(c.env)
  await migrate(db)
  return c.json({ ok: true, message: 'Migration complete' })
})

app.route('/api/seasons', seasonsRoutes)
app.route('/api/teams', teamsRoutes)
app.route('/api/games', gamesRoutes)
app.route('/api/ratings', ratingsRoutes)
app.route('/api/matchup', matchupRoutes)
app.route('/api/scrape', scrapeRoutes)

app.get('/', (c) => c.json({ status: 'Scholastic Bowl API is running' }))

export default app
