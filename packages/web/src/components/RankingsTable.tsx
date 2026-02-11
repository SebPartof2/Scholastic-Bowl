import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Rating } from '../lib/types'

type SortKey = 'rating' | 'wins' | 'losses' | 'ppg' | 'papg' | 'avg_margin' | 'sos' | 'games_played'

interface RankingsTableProps {
  ratings: Rating[]
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  if (!active) return <span className="text-gray-700 ml-1">&#8597;</span>
  return <span className="text-accent-400 ml-1">{asc ? '&#9650;' : '&#9660;'}</span>
}

export default function RankingsTable({ ratings }: RankingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rating')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...ratings].sort((a, b) => {
    const va = a[sortKey] ?? 0
    const vb = b[sortKey] ?? 0
    return sortAsc ? va - vb : vb - va
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function ratingColor(rating: number): string {
    if (rating > 50) return 'text-emerald-400'
    if (rating > 20) return 'text-emerald-300'
    if (rating > 0) return 'text-gray-200'
    if (rating > -20) return 'text-orange-300'
    return 'text-red-400'
  }

  function ratingBg(rating: number): string {
    if (rating > 50) return 'bg-emerald-500/10'
    if (rating > 20) return 'bg-emerald-500/5'
    if (rating > -20) return ''
    return 'bg-red-500/5'
  }

  const SortHeader = ({ label, field, align }: { label: string; field: SortKey; align?: string }) => (
    <th
      className={`px-4 py-3 cursor-pointer hover:text-white select-none transition-colors group ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon active={sortKey === field} asc={sortAsc} />
      </span>
    </th>
  )

  if (ratings.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">No ratings available</p>
        <p className="text-gray-500 text-sm">Run a scrape or enter game results to generate power ratings.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-800/80">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Team</th>
              <SortHeader label="W-L" field="wins" />
              <SortHeader label="GP" field="games_played" />
              <SortHeader label="PPG" field="ppg" align="right" />
              <SortHeader label="PAPG" field="papg" align="right" />
              <SortHeader label="Margin" field="avg_margin" align="right" />
              <SortHeader label="SOS" field="sos" align="right" />
              <SortHeader label="Rating" field="rating" align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {sorted.map((r, i) => (
              <tr key={r.team_id} className={`transition-colors hover:bg-gray-800/30 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                <td className="px-4 py-3">
                  <span className="text-gray-500 font-mono text-xs">{i + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/teams/${r.team_id}`} className="font-semibold hover:text-accent-400 transition-colors">
                    {r.team_name}
                  </Link>
                  {r.city && <span className="text-gray-500 text-xs ml-2 hidden sm:inline">{r.city}</span>}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.wins}–{r.losses}</td>
                <td className="px-4 py-3 text-gray-400">{r.games_played}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{r.ppg.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-400">{r.papg.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  <span className={r.avg_margin > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {r.avg_margin > 0 ? '+' : ''}{r.avg_margin.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-400">
                  {r.sos > 0 ? '+' : ''}{r.sos.toFixed(1)}
                </td>
                <td className={`px-4 py-3 text-right font-mono tabular-nums font-bold ${ratingColor(r.rating)} ${ratingBg(r.rating)}`}>
                  {r.rating > 0 ? '+' : ''}{r.rating.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
