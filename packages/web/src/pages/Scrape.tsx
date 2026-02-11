import { useState } from 'react'
import { apiFetch } from '../hooks/useApi'
import StatCard from '../components/StatCard'
import { ScrapeResult } from '../lib/types'

export default function Scrape() {
  const [schoolYear, setSchoolYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScrape() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = schoolYear ? `?schoolYear=${encodeURIComponent(schoolYear)}` : ''
      const data = await apiFetch<ScrapeResult>(`/api/scrape${params}`, {
        method: 'POST',
      })
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scrape failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="page-title">Scrape Data</h1>
        <p className="text-gray-400 mt-1 text-sm">Pull team and match data from the IESA website.</p>
      </div>

      <div className="card p-6 space-y-5 mb-8">
        <div>
          <label className="label">School Year</label>
          <p className="text-xs text-gray-500 mb-2">Leave blank to scrape the current season.</p>
          <input
            type="text"
            value={schoolYear}
            onChange={e => setSchoolYear(e.target.value)}
            placeholder="e.g., 2024-2025"
            className="input w-full"
          />
        </div>

        <button
          onClick={handleScrape}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Scraping...
            </span>
          ) : (
            'Start Scrape'
          )}
        </button>
      </div>

      {loading && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent-500/10 flex items-center justify-center shrink-0">
              <div className="h-5 w-5 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Scraping IESA website...</p>
              <p className="text-xs text-gray-500 mt-0.5">This may take a few minutes for all teams.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-4 rounded-xl text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {result && (
        <div className="animate-slide-up space-y-6">
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-5 py-4 rounded-xl text-sm">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Scrape complete for <span className="font-semibold">{result.season}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Teams" value={result.teams_scraped} />
            <StatCard label="Games Added" value={result.games_added} colorClass="text-emerald-400" />
            <StatCard label="Skipped" value={result.games_skipped} colorClass="text-gray-400" subtitle="Duplicates" />
          </div>
        </div>
      )}
    </div>
  )
}
