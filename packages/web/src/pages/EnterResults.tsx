import { useState, useEffect } from 'react'
import { useApiGet, apiFetch } from '../hooks/useApi'
import { Season } from '../lib/types'

export default function EnterResults() {
  const { data: seasons } = useApiGet<Season[]>('/api/seasons')
  const [seasonId, setSeasonId] = useState<number | null>(null)
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  const [date, setDate] = useState('')
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [tournament, setTournament] = useState('')
  const [isPostseason, setIsPostseason] = useState(false)

  const [csvText, setCsvText] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (seasons && seasons.length > 0) {
      const active = seasons.find(s => s.is_active)
      setSeasonId(active?.id ?? seasons[0].id)
    }
  }, [seasons])

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!seasonId) return

    try {
      await apiFetch('/api/games', {
        method: 'POST',
        body: JSON.stringify({
          season_id: seasonId,
          date: date || undefined,
          team_a_name: teamAName,
          team_b_name: teamBName,
          score_a: parseInt(scoreA, 10),
          score_b: parseInt(scoreB, 10),
          tournament: tournament || undefined,
          is_postseason: isPostseason,
        }),
      })
      setMessage({ text: 'Game added successfully!', type: 'success' })
      setTeamAName('')
      setTeamBName('')
      setScoreA('')
      setScoreB('')
      setTournament('')
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!seasonId) return

    try {
      const lines = csvText.trim().split('\n').filter(l => l.trim())
      const games = lines.map(line => {
        const parts = line.split(',').map(s => s.trim())
        return {
          date: parts[0] || undefined,
          team_a_name: parts[1],
          team_b_name: parts[2],
          score_a: parseInt(parts[3], 10),
          score_b: parseInt(parts[4], 10),
        }
      })

      const result = await apiFetch<{ added: number }>('/api/games/bulk', {
        method: 'POST',
        body: JSON.stringify({ season_id: seasonId, games }),
      })
      setMessage({ text: `${result.added} games added!`, type: 'success' })
      setCsvText('')
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  async function handleRecalculate() {
    if (!seasonId) return
    try {
      await apiFetch(`/api/ratings/recalculate?season_id=${seasonId}`, { method: 'POST' })
      setMessage({ text: 'Ratings recalculated!', type: 'success' })
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">Enter Results</h1>
        <p className="text-gray-400 mt-1 text-sm">Add game results manually or import in bulk.</p>
      </div>

      {seasons && seasons.length > 0 && (
        <div className="mb-6">
          <label className="label">Season</label>
          <select
            className="input"
            value={seasonId ?? ''}
            onChange={(e) => setSeasonId(parseInt(e.target.value, 10))}
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border border-red-500/20 text-red-300'
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {message.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {message.text}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg mb-8 w-fit">
        <button
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'single' ? 'bg-accent-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setMode('single')}
        >
          Single Game
        </button>
        <button
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'bulk' ? 'bg-accent-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setMode('bulk')}
        >
          Bulk CSV
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Team A</label>
              <input type="text" value={teamAName} onChange={e => setTeamAName(e.target.value)} required className="input w-full" placeholder="School name" />
            </div>
            <div>
              <label className="label">Team B</label>
              <input type="text" value={teamBName} onChange={e => setTeamBName(e.target.value)} required className="input w-full" placeholder="School name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Score A</label>
              <input type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} required className="input w-full" placeholder="0" />
            </div>
            <div>
              <label className="label">Score B</label>
              <input type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} required className="input w-full" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Tournament (optional)</label>
            <input type="text" value={tournament} onChange={e => setTournament(e.target.value)} className="input w-full" placeholder="Tournament name" />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={isPostseason} onChange={e => setIsPostseason(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-accent-600 focus:ring-accent-500 focus:ring-offset-0" />
            Postseason game
          </label>
          <button type="submit" className="btn-primary">
            Add Game
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="card p-6 space-y-5">
          <div>
            <label className="label">CSV Data</label>
            <p className="text-xs text-gray-500 mb-2">Format: date, team_a, team_b, score_a, score_b (one game per line)</p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={10}
              className="input w-full font-mono text-xs"
              placeholder="2025-01-15, Springfield Christian, Lincoln, 340, 210&#10;2025-01-16, Washington, Jefferson, 280, 260"
            />
          </div>
          <button type="submit" className="btn-primary">
            Import Games
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-gray-800/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Recalculate Ratings</p>
            <p className="text-xs text-gray-500 mt-0.5">Update power ratings after entering new results.</p>
          </div>
          <button onClick={handleRecalculate} className="btn-secondary">
            Recalculate
          </button>
        </div>
      </div>
    </div>
  )
}
