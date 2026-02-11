import { Client } from '@libsql/client/web'

interface Game {
  team_a_id: number
  team_b_id: number
  score_a: number
  score_b: number
}

interface TeamStats {
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  ppg: number
  papg: number
  avgMargin: number
  sos: number
}

const ITERATIONS = 20
const SCALING_FACTOR = 50

export function computeWinProbability(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / SCALING_FACTOR))
}

export function computeExpectedScores(
  ppgA: number, papgA: number, ratingA: number,
  ppgB: number, papgB: number, ratingB: number
): { expectedA: number; expectedB: number } {
  const ratingDiff = ratingA - ratingB
  const expectedA = (ppgA + papgB) / 2 + ratingDiff / 2
  const expectedB = (ppgB + papgA) / 2 - ratingDiff / 2
  return {
    expectedA: Math.max(0, Math.round(expectedA)),
    expectedB: Math.max(0, Math.round(expectedB)),
  }
}

export async function recalculateRatings(db: Client, seasonId: number): Promise<void> {
  const gamesResult = await db.execute({
    sql: 'SELECT team_a_id, team_b_id, score_a, score_b FROM games WHERE season_id = ?',
    args: [seasonId],
  })

  const games: Game[] = gamesResult.rows.map(r => ({
    team_a_id: r.team_a_id as number,
    team_b_id: r.team_b_id as number,
    score_a: r.score_a as number,
    score_b: r.score_b as number,
  }))

  if (games.length === 0) return

  // Collect all team IDs involved in games
  const teamIds = new Set<number>()
  for (const g of games) {
    teamIds.add(g.team_a_id)
    teamIds.add(g.team_b_id)
  }

  // Build team game lists
  const teamGames = new Map<number, { margin: number; opponentId: number }[]>()
  for (const id of teamIds) {
    teamGames.set(id, [])
  }

  for (const g of games) {
    teamGames.get(g.team_a_id)!.push({
      margin: g.score_a - g.score_b,
      opponentId: g.team_b_id,
    })
    teamGames.get(g.team_b_id)!.push({
      margin: g.score_b - g.score_a,
      opponentId: g.team_a_id,
    })
  }

  // Iterative power rating
  const ratings = new Map<number, number>()
  for (const id of teamIds) {
    ratings.set(id, 0)
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const newRatings = new Map<number, number>()
    for (const id of teamIds) {
      const tGames = teamGames.get(id)!
      if (tGames.length === 0) {
        newRatings.set(id, 0)
        continue
      }
      let sum = 0
      for (const g of tGames) {
        sum += g.margin - (ratings.get(g.opponentId) ?? 0)
      }
      newRatings.set(id, sum / tGames.length)
    }
    // Copy new ratings
    for (const [id, r] of newRatings) {
      ratings.set(id, r)
    }
  }

  // Normalize so average is 0
  let total = 0
  for (const r of ratings.values()) total += r
  const avg = total / ratings.size
  for (const [id, r] of ratings) {
    ratings.set(id, r - avg)
  }

  // Compute full stats and upsert
  const now = new Date().toISOString()

  for (const id of teamIds) {
    const tGames = teamGames.get(id)!
    const gamesPlayed = tGames.length
    let wins = 0, losses = 0, totalPoints = 0, totalOppPoints = 0, totalMargin = 0, sosSum = 0

    for (const g of tGames) {
      if (g.margin > 0) wins++
      else losses++
      // Reconstruct scores from games array
      totalMargin += g.margin
      sosSum += ratings.get(g.opponentId) ?? 0
    }

    // Calculate PPG/PAPG from actual games
    for (const g of games) {
      if (g.team_a_id === id) {
        totalPoints += g.score_a
        totalOppPoints += g.score_b
      } else if (g.team_b_id === id) {
        totalPoints += g.score_b
        totalOppPoints += g.score_a
      }
    }

    const stats: TeamStats = {
      rating: ratings.get(id)!,
      gamesPlayed,
      wins,
      losses,
      ppg: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
      papg: gamesPlayed > 0 ? totalOppPoints / gamesPlayed : 0,
      avgMargin: gamesPlayed > 0 ? totalMargin / gamesPlayed : 0,
      sos: gamesPlayed > 0 ? sosSum / gamesPlayed : 0,
    }

    await db.execute({
      sql: `INSERT INTO ratings (team_id, season_id, rating, games_played, wins, losses, ppg, papg, avg_margin, sos, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(team_id, season_id) DO UPDATE SET
              rating = excluded.rating,
              games_played = excluded.games_played,
              wins = excluded.wins,
              losses = excluded.losses,
              ppg = excluded.ppg,
              papg = excluded.papg,
              avg_margin = excluded.avg_margin,
              sos = excluded.sos,
              updated_at = excluded.updated_at`,
      args: [id, seasonId, stats.rating, stats.gamesPlayed, stats.wins, stats.losses,
             stats.ppg, stats.papg, stats.avgMargin, stats.sos, now],
    })
  }
}
