import { useState } from 'react'
import { useApiGet, apiFetch } from '../hooks/useApi'
import { Season } from '../lib/types'

export default function Seasons() {
  const { data: seasons, refetch } = useApiGet<Season[]>('/api/seasons')
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      await apiFetch('/api/seasons', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), is_active: true }),
      })
      setNewName('')
      setMessage({ text: 'Season created!', type: 'success' })
      refetch()
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  async function handleActivate(id: number) {
    try {
      await apiFetch(`/api/seasons/${id}/activate`, { method: 'PUT' })
      setMessage({ text: 'Active season updated.', type: 'success' })
      refetch()
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  async function handleMigrate() {
    try {
      await apiFetch('/api/migrate', { method: 'POST' })
      setMessage({ text: 'Database migrated successfully!', type: 'success' })
    } catch (e) {
      setMessage({ text: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, type: 'error' })
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="page-title">Seasons</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage seasons and database setup.</p>
      </div>

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

      {/* Database setup */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Database Migration</p>
            <p className="text-xs text-gray-500 mt-0.5">Create or update database tables. Safe to run multiple times.</p>
          </div>
          <button onClick={handleMigrate} className="btn-secondary">
            Run Migration
          </button>
        </div>
      </div>

      {/* Create season */}
      <div className="card p-5 mb-8">
        <p className="text-sm font-medium text-gray-300 mb-3">New Season</p>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g., 2025-2026"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">
            Create
          </button>
        </form>
      </div>

      {/* Season list */}
      {seasons && seasons.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-400 mb-3">{seasons.length} season{seasons.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {seasons.map(s => (
              <div key={s.id} className="card-hover flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{s.name}</span>
                  {s.is_active ? <span className="badge-green">Active</span> : null}
                </div>
                {!s.is_active && (
                  <button
                    onClick={() => handleActivate(s.id)}
                    className="text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
