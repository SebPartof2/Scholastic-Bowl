import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'
import { computeWinProbability, computeExpectedScores } from '../lib/ratings'

export const matchupRoutes = new Hono<{ Bindings: Env }>()

matchupRoutes.get('/', async (c) => {
  const teamAId = c.req.query('team_a')
  const teamBId = c.req.query('team_b')
  const db = getDb(c.env)

  if (!teamAId || !teamBId) {
    return c.json({ error: 'team_a and team_b query params are required' }, 400)
  }

  const idA = parseInt(teamAId, 10)
  const idB = parseInt(teamBId, 10)

  // Get ratings for both teams (LEFT JOIN so teams without ratings still return)
  const [teamAResult, teamBResult] = await Promise.all([
    db.execute({
      sql: `SELECT t.*, r.rating, r.wins, r.losses, r.games_played, r.ppg, r.papg, r.avg_margin, r.sos
            FROM teams t
            LEFT JOIN ratings r ON r.team_id = t.id AND r.season_id = t.season_id
            WHERE t.id = ?`,
      args: [idA],
    }),
    db.execute({
      sql: `SELECT t.*, r.rating, r.wins, r.losses, r.games_played, r.ppg, r.papg, r.avg_margin, r.sos
            FROM teams t
            LEFT JOIN ratings r ON r.team_id = t.id AND r.season_id = t.season_id
            WHERE t.id = ?`,
      args: [idB],
    }),
  ])

  if (teamAResult.rows.length === 0 || teamBResult.rows.length === 0) {
    return c.json({ error: 'One or both teams not found' }, 404)
  }

  const a = teamAResult.rows[0]
  const b = teamBResult.rows[0]

  const ratingA = (a.rating as number) ?? 0
  const ratingB = (b.rating as number) ?? 0
  const winProbA = computeWinProbability(ratingA, ratingB)

  const { expectedA, expectedB } = computeExpectedScores(
    (a.ppg as number) ?? 0, (a.papg as number) ?? 0, ratingA,
    (b.ppg as number) ?? 0, (b.papg as number) ?? 0, ratingB,
  )

  // Head-to-head history
  const h2hResult = await db.execute({
    sql: `SELECT g.*, ta.name AS team_a_name, tb.name AS team_b_name
          FROM games g
          JOIN teams ta ON ta.id = g.team_a_id
          JOIN teams tb ON tb.id = g.team_b_id
          WHERE (g.team_a_id = ? AND g.team_b_id = ?) OR (g.team_a_id = ? AND g.team_b_id = ?)
          ORDER BY g.date DESC`,
    args: [idA, idB, idB, idA],
  })

  // Common opponents
  const commonResult = await db.execute({
    sql: `SELECT DISTINCT
            CASE WHEN g1.team_a_id NOT IN (?, ?) THEN g1.team_a_id ELSE g1.team_b_id END AS opp_id
          FROM games g1
          WHERE (g1.team_a_id = ? OR g1.team_b_id = ?)
          AND CASE WHEN g1.team_a_id NOT IN (?, ?) THEN g1.team_a_id ELSE g1.team_b_id END IN (
            SELECT CASE WHEN g2.team_a_id NOT IN (?, ?) THEN g2.team_a_id ELSE g2.team_b_id END
            FROM games g2
            WHERE g2.team_a_id = ? OR g2.team_b_id = ?
          )`,
    args: [idA, idB, idA, idA, idA, idB, idA, idB, idB, idB],
  })

  const lowConfidence = ((a.games_played as number) ?? 0) < 5 || ((b.games_played as number) ?? 0) < 5

  return c.json({
    team_a: a,
    team_b: b,
    win_probability_a: winProbA,
    win_probability_b: 1 - winProbA,
    expected_score_a: expectedA,
    expected_score_b: expectedB,
    head_to_head: h2hResult.rows,
    common_opponents_count: commonResult.rows.length,
    low_confidence: lowConfidence,
  })
})
