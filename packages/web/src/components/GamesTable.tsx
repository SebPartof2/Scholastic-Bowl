import { Link } from 'react-router-dom'
import { Game } from '../lib/types'

interface GamesTableProps {
  games: Game[]
  highlightTeamId?: number
}

export default function GamesTable({ games, highlightTeamId }: GamesTableProps) {
  if (games.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">No games found.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-800/80">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Matchup</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {games.map((game, i) => {
              const isTeamA = highlightTeamId === game.team_a_id
              const won = highlightTeamId
                ? isTeamA
                  ? game.score_a > game.score_b
                  : game.score_b > game.score_a
                : null

              return (
                <tr key={game.id} className={`transition-colors hover:bg-gray-800/30 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{game.date || '—'}</td>
                  <td className="px-5 py-3">
                    <Link to={`/teams/${game.team_a_id}`} className={`hover:text-accent-400 transition-colors ${highlightTeamId === game.team_a_id ? 'font-semibold text-white' : 'text-gray-300'}`}>
                      {game.team_a_name}
                    </Link>
                    <span className="text-gray-600 mx-2">vs</span>
                    <Link to={`/teams/${game.team_b_id}`} className={`hover:text-accent-400 transition-colors ${highlightTeamId === game.team_b_id ? 'font-semibold text-white' : 'text-gray-300'}`}>
                      {game.team_b_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums text-gray-200">
                    {game.score_a}–{game.score_b}
                  </td>
                  <td className="px-5 py-3">
                    {won !== null && (
                      <span className={won ? 'badge-green' : 'badge-red'}>
                        {won ? 'W' : 'L'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
