import * as cheerio from 'cheerio'

export interface ScrapedTeam {
  iesa_id: number
  name: string
  city: string
  nickname: string
}

export interface ScrapedGame {
  team_iesa_id: number
  opponent_name: string
  team_score: number
  opponent_score: number
  won: boolean
  is_postseason: boolean
}

const BASE_URL = 'https://www.iesa.org/activities'

export async function scrapeTeamList(schoolYear?: string): Promise<ScrapedTeam[]> {
  let url = `${BASE_URL}/participants.asp?activitycode=SBowl`
  if (schoolYear) {
    url += `&SchoolYear=${encodeURIComponent(schoolYear)}`
  }

  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)

  const teams: ScrapedTeam[] = []

  // Find the data table — rows with links to memberDetail.asp
  $('table tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 4) return

    const link = $(cells[1]).find('a[href*="memberDetail"]')
    if (link.length === 0) return

    const href = link.attr('href') || ''
    const idMatch = href.match(/SchoolID=(\d+)/)
    if (!idMatch) return

    teams.push({
      iesa_id: parseInt(idMatch[1], 10),
      name: link.text().trim(),
      city: $(cells[2]).text().trim(),
      nickname: $(cells[3]).text().trim(),
    })
  })

  return teams
}

export async function scrapeTeamResults(iesaId: number, teamName: string): Promise<ScrapedGame[]> {
  const url = `${BASE_URL}/memberStats.asp?SchoolID=${iesaId}&ActivityCode=SCB`
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)

  const games: ScrapedGame[] = []
  let isPostseason = false

  $('table tr').each((_, row) => {
    const text = $(row).text()

    // Detect postseason section headers
    if (text.toLowerCase().includes('postseason') || text.toLowerCase().includes('playoff') || text.toLowerCase().includes('regional') || text.toLowerCase().includes('sectional') || text.toLowerCase().includes('state')) {
      if ($(row).find('td').length <= 2) {
        isPostseason = true
      }
    }

    const cells = $(row).find('td')
    if (cells.length < 2) return

    // Look for score patterns like "460-140"
    const scoreCell = cells.toArray().find(cell => {
      const t = $(cell).text().trim()
      return /^\d+-\d+$/.test(t)
    })
    if (!scoreCell) return

    // Skip pending games
    const hasPending = cells.toArray().some(cell =>
      $(cell).text().trim().toUpperCase() === 'PENDING'
    )
    if (hasPending) return

    // Find the result cell — contains "def." or "vs."
    const resultCell = cells.toArray().find(cell => {
      const t = $(cell).text()
      return t.includes('def.') || t.includes(' vs. ')
    })
    if (!resultCell) return

    const resultText = $(resultCell).text().trim()
    const scoreText = $(scoreCell).text().trim()
    const scoreParts = scoreText.split('-').map(s => parseInt(s.trim(), 10))
    if (scoreParts.length !== 2 || isNaN(scoreParts[0]) || isNaN(scoreParts[1])) return

    const winnerScore = scoreParts[0]
    const loserScore = scoreParts[1]

    // The bold text is the winner
    const boldText = $(resultCell).find('b, strong').first().text().trim()

    if (resultText.includes('def.')) {
      // "Winner def. Loser" pattern
      const defIndex = resultText.indexOf('def.')
      const winnerName = resultText.substring(0, defIndex).replace(/\*+/g, '').trim()
      const loserName = resultText.substring(defIndex + 4).replace(/\*+/g, '').trim()

      // Normalize team name for comparison
      const normalizedTeamName = teamName.toLowerCase().trim()
      const normalizedWinner = winnerName.toLowerCase().trim()

      const won = normalizedWinner === normalizedTeamName || boldText.toLowerCase().trim() === normalizedTeamName

      if (won) {
        games.push({
          team_iesa_id: iesaId,
          opponent_name: loserName,
          team_score: winnerScore,
          opponent_score: loserScore,
          won: true,
          is_postseason: isPostseason,
        })
      } else {
        games.push({
          team_iesa_id: iesaId,
          opponent_name: winnerName,
          team_score: loserScore,
          opponent_score: winnerScore,
          won: false,
          is_postseason: isPostseason,
        })
      }
    }
  })

  return games
}

// Run fetches in batches with concurrency limit
export async function batchFetch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 10,
  delayMs = 200,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  return results
}
