export default function SpecsGrid({ specs }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-[#1A2035]">
      {specs.map(({ label, value, color }) => (
        <div key={label} className="bg-[#080C13] p-3">
          <p className="terminal-text text-[9px] text-[#8892A4] mb-1">{label}</p>
          <p className={`font-roboto-mono text-sm font-semibold ${color || 'text-white'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
