import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApiGet } from '../hooks/useApi'
import { Season, Team } from '../lib/types'

export default function Teams() {
  const { data: seasons } = useApiGet<Season[]>('/api/seasons')
  const [seasonId, setSeasonId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (seasons && seasons.length > 0) {
      const active = seasons.find(s => s.is_active)
      setSeasonId(active?.id ?? seasons[0].id)
    }
  }, [seasons])

  const { data: teams, loading } = useApiGet<Team[]>(
    seasonId ? `/api/teams?season_id=${seasonId}` : null
  )

  const filtered = teams?.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.city && t.city.toLowerCase().includes(search.toLowerCase())) ||
    (t.nickname && t.nickname.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {teams ? `${teams.length} teams this season` : 'Loading...'}
          </p>
        </div>
        {seasons && seasons.length > 0 && (
          <select
            className="input"
            value={seasonId ?? ''}
            onChange={(e) => setSeasonId(parseInt(e.target.value, 10))}
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="relative max-w-md mb-8">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, or nickname..."
          className="input w-full pl-10"
        />
      </div>

      {loading && (
        <div className="card p-12 text-center">
          <div className="h-6 w-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400">No teams found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(team => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="card-hover p-5 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold group-hover:text-accent-400 transition-colors">{team.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {team.city}{team.nickname ? ` \u00B7 ${team.nickname}` : ''}
                </p>
              </div>
              {team.rating !== null && (
                <span className={`font-mono text-sm font-bold ${
                  (team.rating ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(team.rating ?? 0) > 0 ? '+' : ''}{team.rating?.toFixed(1)}
                </span>
              )}
            </div>
            {team.wins !== null && (
              <div className="flex gap-3 mt-3 text-xs">
                <span className="badge-green">{team.wins}W</span>
                <span className="badge-red">{team.losses}L</span>
                {team.ppg !== null && (
                  <span className="text-gray-500">{team.ppg?.toFixed(0)} PPG</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
