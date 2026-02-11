import { useState, useRef, useEffect } from 'react'
import { Team } from '../lib/types'

interface TeamSelectorProps {
  teams: Team[]
  value: Team | null
  onChange: (team: Team | null) => void
  placeholder?: string
}

export default function TeamSelector({ teams, value, onChange, placeholder = 'Search teams...' }: TeamSelectorProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query
    ? teams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : teams

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input w-full pl-10"
          placeholder={placeholder}
          value={value ? value.name : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            onClick={() => { onChange(null); setQuery('') }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && !value && (
        <div className="absolute z-20 mt-1.5 w-full bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl shadow-black/40 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No teams found</p>
          ) : (
            filtered.slice(0, 50).map((team) => (
              <button
                key={team.id}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-800 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
                onClick={() => {
                  onChange(team)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="font-medium text-white">{team.name}</span>
                {team.city && <span className="text-gray-500 ml-2 text-xs">{team.city}</span>}
                {team.rating !== null && (
                  <span className={`float-right text-xs font-mono ${
                    (team.rating ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(team.rating ?? 0) > 0 ? '+' : ''}{team.rating?.toFixed(1)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
