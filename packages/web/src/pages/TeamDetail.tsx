import { useParams, Link } from 'react-router-dom'
import { useApiGet } from '../hooks/useApi'
import StatCard from '../components/StatCard'
import GamesTable from '../components/GamesTable'
import { Team, Game } from '../lib/types'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, loading } = useApiGet<{ team: Team; games: Game[] }>(
    id ? `/api/teams/${id}` : null
  )

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="h-6 w-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-400 text-lg">Team not found.</p>
      </div>
    )
  }

  const { team, games } = data

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/teams" className="text-sm text-gray-500 hover:text-accent-400 transition-colors">
          &larr; All Teams
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">{team.name}</h1>
          <p className="text-gray-400 mt-1">
            {team.city}{team.nickname ? ` \u00B7 ${team.nickname}` : ''}
          </p>
        </div>
        {team.rating !== null && (
          <div className="text-right">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Power Rating</p>
            <p className={`text-4xl font-black mt-1 ${
              (team.rating ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(team.rating ?? 0) > 0 ? '+' : ''}{team.rating?.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        <StatCard label="Record" value={`${team.wins ?? 0}–${team.losses ?? 0}`} subtitle={`${team.games_played ?? 0} games`} />
        <StatCard label="PPG" value={team.ppg ?? 0} subtitle="Points per game" />
        <StatCard label="PAPG" value={team.papg ?? 0} subtitle="Opp. points per game" />
        <StatCard label="Avg Margin" value={team.avg_margin ?? 0} colorClass={
          (team.avg_margin ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
        } />
        <StatCard label="SOS" value={team.sos ?? 0} subtitle="Strength of schedule" />
      </div>

      {/* Game Log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Game Log</h2>
          <span className="text-xs text-gray-500">{games.length} game{games.length !== 1 ? 's' : ''}</span>
        </div>
        <GamesTable games={games} highlightTeamId={parseInt(id!, 10)} />
      </div>
    </div>
  )
}
