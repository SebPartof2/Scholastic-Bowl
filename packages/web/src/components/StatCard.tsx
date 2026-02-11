interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  colorClass?: string
}

export default function StatCard({ label, value, subtitle, colorClass }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${colorClass || 'text-white'}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>}
    </div>
  )
}
