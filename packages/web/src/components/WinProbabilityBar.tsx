interface WinProbabilityBarProps {
  probA: number
  probB: number
  nameA: string
  nameB: string
  scoreA?: number
  scoreB?: number
}

export default function WinProbabilityBar({ probA, probB, nameA, nameB, scoreA, scoreB }: WinProbabilityBarProps) {
  const pctA = Math.round(probA * 100)
  const pctB = Math.round(probB * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{nameA}</p>
          <p className="text-5xl font-black tabular-nums text-accent-400">{pctA}<span className="text-2xl">%</span></p>
          {scoreA !== undefined && (
            <p className="text-sm text-gray-500 mt-1">Expected: <span className="text-white font-semibold">{scoreA}</span></p>
          )}
        </div>
        <div className="text-center pb-2">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">vs</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-400 mb-1">{nameB}</p>
          <p className="text-5xl font-black tabular-nums text-orange-400">{pctB}<span className="text-2xl">%</span></p>
          {scoreB !== undefined && (
            <p className="text-sm text-gray-500 mt-1">Expected: <span className="text-white font-semibold">{scoreB}</span></p>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full overflow-hidden flex bg-gray-800/50">
          <div
            className="bg-gradient-to-r from-accent-600 to-accent-400 transition-all duration-700 ease-out rounded-l-full"
            style={{ width: `${pctA}%` }}
          />
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out rounded-r-full"
            style={{ width: `${pctB}%` }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-600" />
      </div>
    </div>
  )
}
