import { useState, useEffect } from 'react'
import { useApiGet } from '../hooks/useApi'
import RankingsTable from '../components/RankingsTable'
import { Season, Rating } from '../lib/types'

export default function Rankings() {
  const { data: seasons } = useApiGet<Season[]>('/api/seasons')
  const [seasonId, setSeasonId] = useState<number | null>(null)

  useEffect(() => {
    if (seasons && seasons.length > 0) {
      const active = seasons.find(s => s.is_active)
      setSeasonId(active?.id ?? seasons[0].id)
    }
  }, [seasons])

  const { data: ratings, loading } = useApiGet<Rating[]>(
    seasonId ? `/api/ratings?season_id=${seasonId}` : null
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Power Rankings</h1>
          <p className="text-gray-400 mt-1 text-sm">Iterative power ratings based on margin of victory and strength of schedule.</p>
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

      {loading && (
        <div className="card p-12 text-center">
          <div className="h-6 w-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading ratings...</p>
        </div>
      )}
      {ratings && (
        <div className="animate-fade-in">
          {ratings.length > 0 && (
            <p className="text-xs text-gray-500 mb-3">{ratings.length} teams ranked</p>
          )}
          <RankingsTable ratings={ratings} />
        </div>
      )}
    </div>
  )
}
