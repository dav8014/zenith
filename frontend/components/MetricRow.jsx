export default function MetricRow({ items }) {
  return (
    <div className="divide-y divide-[#1A2035]">
      {items.map(({ label, value, highlight = false }) => (
        <div key={label} className="flex items-center justify-between py-3">
          <p className="terminal-text text-[9px] text-[#8892A4]">{label}</p>
          <p className={`font-roboto-mono text-sm font-semibold ${highlight ? 'text-[#00D4FF]' : 'text-white'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
