import { useState, useEffect } from 'react'
import { useApiGet, apiFetch } from '../hooks/useApi'
import TeamSelector from '../components/TeamSelector'
import WinProbabilityBar from '../components/WinProbabilityBar'
import StatCard from '../components/StatCard'
import GamesTable from '../components/GamesTable'
import { Season, Team, MatchupResult } from '../lib/types'

export default function Matchup() {
  const { data: seasons } = useApiGet<Season[]>('/api/seasons')
  const [seasonId, setSeasonId] = useState<number | null>(null)

  useEffect(() => {
    if (seasons && seasons.length > 0) {
      const active = seasons.find(s => s.is_active)
      setSeasonId(active?.id ?? seasons[0].id)
    }
  }, [seasons])

  const { data: teams } = useApiGet<Team[]>(
    seasonId ? `/api/teams?season_id=${seasonId}` : null
  )

  const [teamA, setTeamA] = useState<Team | null>(null)
  const [teamB, setTeamB] = useState<Team | null>(null)
  const [matchup, setMatchup] = useState<MatchupResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!teamA || !teamB) {
      setMatchup(null)
      return
    }

    setLoading(true)
    apiFetch<MatchupResult>(`/api/matchup?team_a=${teamA.id}&team_b=${teamB.id}`)
      .then(setMatchup)
      .catch(() => setMatchup(null))
      .finally(() => setLoading(false))
  }, [teamA, teamB])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="page-title">Matchup Predictor</h1>
        <p className="text-gray-400 mt-2">Select two teams to see win probability and head-to-head analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div>
          <label className="label">Team A</label>
          <TeamSelector
            teams={teams ?? []}
            value={teamA}
            onChange={setTeamA}
            placeholder="Select first team..."
          />
        </div>
        <div>
          <label className="label">Team B</label>
          <TeamSelector
            teams={teams ?? []}
            value={teamB}
            onChange={setTeamB}
            placeholder="Select second team..."
          />
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center">
          <div className="h-6 w-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Calculating matchup...</p>
        </div>
      )}

      {matchup && (
        <div className="space-y-8 animate-slide-up">
          {matchup.low_confidence && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-5 py-4 rounded-xl text-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Low confidence — one or both teams have fewer than 5 games played.</span>
            </div>
          )}

          {/* Win Probability Card */}
          <div className="card p-8">
            <WinProbabilityBar
              probA={matchup.win_probability_a}
              probB={matchup.win_probability_b}
              nameA={matchup.team_a.name}
              nameB={matchup.team_b.name}
              scoreA={matchup.expected_score_a}
              scoreB={matchup.expected_score_b}
            />
          </div>

          {/* Side-by-side stat comparison */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <h3 className="section-title text-accent-400">{matchup.team_a.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Rating" value={matchup.team_a.rating ?? 0} colorClass={
                  (matchup.team_a.rating ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                } />
                <StatCard label="Record" value={`${matchup.team_a.wins ?? 0}–${matchup.team_a.losses ?? 0}`} />
                <StatCard label="PPG" value={matchup.team_a.ppg ?? 0} />
                <StatCard label="SOS" value={matchup.team_a.sos ?? 0} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <h3 className="section-title text-orange-400">{matchup.team_b.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Rating" value={matchup.team_b.rating ?? 0} colorClass={
                  (matchup.team_b.rating ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                } />
                <StatCard label="Record" value={`${matchup.team_b.wins ?? 0}–${matchup.team_b.losses ?? 0}`} />
                <StatCard label="PPG" value={matchup.team_b.ppg ?? 0} />
                <StatCard label="SOS" value={matchup.team_b.sos ?? 0} />
              </div>
            </div>
          </div>

          {/* Head-to-head */}
          {matchup.head_to_head.length > 0 && (
            <div>
              <h2 className="section-title mb-4">Head-to-Head History</h2>
              <GamesTable games={matchup.head_to_head} />
            </div>
          )}

          {matchup.common_opponents_count > 0 && (
            <div className="card p-4 text-center">
              <span className="badge-blue">{matchup.common_opponents_count} common opponent{matchup.common_opponents_count > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {!loading && !matchup && teamA && teamB && (
        <div className="card p-12 text-center">
          <p className="text-gray-400">Unable to load matchup data.</p>
        </div>
      )}
    </div>
  )
}
