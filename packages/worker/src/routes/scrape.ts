import { Hono } from 'hono'
import { Env, getDb } from '../lib/db'
import { scrapeTeamList, scrapeTeamResults, batchFetch, ScrapedTeam } from '../lib/scraper'
import { recalculateRatings } from '../lib/ratings'

export const scrapeRoutes = new Hono<{ Bindings: Env }>()

// Trigger full scrape
scrapeRoutes.post('/', async (c) => {
  const schoolYear = c.req.query('schoolYear')
  const db = getDb(c.env)

  // Get or create the season
  const seasonName = schoolYear || getCurrentSeasonName()
  let seasonResult = await db.execute({
    sql: 'SELECT * FROM seasons WHERE name = ?',
    args: [seasonName],
  })

  let seasonId: number
  if (seasonResult.rows.length === 0) {
    const insert = await db.execute({
      sql: 'INSERT INTO seasons (name, is_active) VALUES (?, 1) RETURNING id',
      args: [seasonName],
    })
    seasonId = insert.rows[0].id as number
  } else {
    seasonId = seasonResult.rows[0].id as number
  }

  // Step 1: Scrape team list
  const scrapedTeams = await scrapeTeamList(schoolYear)

  // Step 2: Upsert teams
  const teamMap = new Map<number, number>() // iesa_id -> db id
  const nameMap = new Map<string, number>()  // lowercase name -> db id

  for (const team of scrapedTeams) {
    const result = await db.execute({
      sql: `INSERT INTO teams (iesa_id, name, city, nickname, season_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(iesa_id, season_id) DO UPDATE SET
              name = excluded.name, city = excluded.city, nickname = excluded.nickname
            RETURNING id`,
      args: [team.iesa_id, team.name, team.city, team.nickname, seasonId],
    })
    const dbId = result.rows[0].id as number
    teamMap.set(team.iesa_id, dbId)
    nameMap.set(team.name.toLowerCase(), dbId)
  }

  // Step 3: Scrape match results for each team
  const allResults = await batchFetch(
    scrapedTeams,
    async (team: ScrapedTeam) => {
      try {
        return { team, games: await scrapeTeamResults(team.iesa_id, team.name) }
      } catch {
        return { team, games: [] }
      }
    },
    10,
    200,
  )

  // Step 4: Deduplicate in memory before inserting
  // Normalize each game to a canonical key: sorted team IDs + scores
  interface ResolvedGame {
    teamAId: number
    teamBId: number
    scoreA: number
    scoreB: number
    isPostseason: boolean
  }

  const seen = new Set<string>()
  const uniqueGames: ResolvedGame[] = []

  for (const { team, games } of allResults) {
    const teamDbId = teamMap.get(team.iesa_id)
    if (!teamDbId) continue

    for (const game of games) {
      const oppName = game.opponent_name.toLowerCase().trim()
      let oppDbId = nameMap.get(oppName)

      if (!oppDbId) {
        for (const [name, id] of nameMap) {
          if (name.includes(oppName) || oppName.includes(name)) {
            oppDbId = id
            break
          }
        }
      }

      if (!oppDbId) continue

      // Always store with the lower ID first for a canonical key
      const id1 = Math.min(teamDbId, oppDbId)
      const id2 = Math.max(teamDbId, oppDbId)
      const s1 = teamDbId === id1 ? game.team_score : game.opponent_score
      const s2 = teamDbId === id1 ? game.opponent_score : game.team_score
      const key = `${id1}-${id2}-${s1}-${s2}`

      if (seen.has(key)) continue
      seen.add(key)

      // Store with winner as team_a
      const teamAId = game.won ? teamDbId : oppDbId
      const teamBId = game.won ? oppDbId : teamDbId
      const scoreA = game.won ? game.team_score : game.opponent_score
      const scoreB = game.won ? game.opponent_score : game.team_score

      uniqueGames.push({ teamAId, teamBId, scoreA, scoreB, isPostseason: game.is_postseason })
    }
  }

  // Step 5: Insert only unique games, checking DB for pre-existing ones
  let gamesAdded = 0
  let gamesSkipped = 0

  for (const game of uniqueGames) {
    const existing = await db.execute({
      sql: `SELECT id FROM games
            WHERE season_id = ? AND (
              (team_a_id = ? AND team_b_id = ? AND score_a = ? AND score_b = ?)
              OR (team_a_id = ? AND team_b_id = ? AND score_a = ? AND score_b = ?)
            )`,
      args: [seasonId, game.teamAId, game.teamBId, game.scoreA, game.scoreB,
             game.teamBId, game.teamAId, game.scoreB, game.scoreA],
    })

    if (existing.rows.length > 0) {
      gamesSkipped++
      continue
    }

    await db.execute({
      sql: `INSERT INTO games (season_id, team_a_id, team_b_id, score_a, score_b, is_postseason)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [seasonId, game.teamAId, game.teamBId, game.scoreA, game.scoreB, game.isPostseason ? 1 : 0],
    })
    gamesAdded++
  }

  // Step 4: Recalculate ratings
  await recalculateRatings(db, seasonId)

  return c.json({
    season: seasonName,
    season_id: seasonId,
    teams_scraped: scrapedTeams.length,
    games_added: gamesAdded,
    games_skipped: gamesSkipped,
  })
})

// Check scrape status (simple implementation)
scrapeRoutes.get('/status', async (c) => {
  return c.json({ status: 'idle' })
})

function getCurrentSeasonName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // School year starts in August
  if (month >= 8) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}
