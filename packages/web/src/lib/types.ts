export interface Season {
  id: number
  name: string
  is_active: number
}

export interface Team {
  id: number
  iesa_id: number | null
  name: string
  school: string | null
  city: string | null
  nickname: string | null
  season_id: number
  rating: number | null
  wins: number | null
  losses: number | null
  games_played: number | null
  ppg: number | null
  papg: number | null
  avg_margin: number | null
  sos: number | null
}

export interface Game {
  id: number
  season_id: number
  date: string | null
  team_a_id: number
  team_b_id: number
  score_a: number
  score_b: number
  is_postseason: number
  tournament: string | null
  team_a_name: string
  team_b_name: string
  team_a_rating?: number | null
  team_b_rating?: number | null
}

export interface Rating {
  id: number
  team_id: number
  season_id: number
  rating: number
  games_played: number
  wins: number
  losses: number
  ppg: number
  papg: number
  avg_margin: number
  sos: number
  updated_at: string
  team_name: string
  city: string | null
  nickname: string | null
  iesa_id: number | null
}

export interface MatchupResult {
  team_a: Team
  team_b: Team
  win_probability_a: number
  win_probability_b: number
  expected_score_a: number
  expected_score_b: number
  head_to_head: Game[]
  common_opponents_count: number
  low_confidence: boolean
}

export interface ScrapeResult {
  season: string
  season_id: number
  teams_scraped: number
  games_added: number
  games_skipped: number
}
