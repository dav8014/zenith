import Link from 'next/link'

const LINKS = [
  {
    group: 'FLOTA',
    items: [
      { href: '/catalogo', label: 'Catálogo' },
      { href: '/catalogo?origen=importado', label: 'Importados' },
      { href: '/comparador', label: 'Comparador' },
    ],
  },
  {
    group: 'SERVICIOS',
    items: [
      { href: '/login', label: 'Área Cliente' },
      { href: '/admin', label: 'Panel Admin' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#080C13] border-t border-[#1A2035] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 border border-[#0066FF] flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-[#0066FF]" />
              </div>
              <span className="font-exo2 font-bold text-base tracking-widest text-white">
                ZEN<span className="text-[#0066FF]">ITH</span>
              </span>
            </div>
            <p className="text-[#8892A4] text-sm leading-relaxed max-w-xs">
              Renting de vehículos premium. Flota nacional e importada con financiación online.
            </p>
          </div>

          {/* Link groups */}
          {LINKS.map(({ group, items }) => (
            <div key={group}>
              <p className="terminal-text text-[10px] text-[#8892A4] mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-[#8892A4] hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#1A2035] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <span className="pulse-dot" />
            <p className="terminal-text text-[10px] text-[#8892A4]">SISTEMA OPERATIVO</p>
          </div>
          <p className="text-[#8892A4] text-xs">
            © {new Date().getFullYear()} Zenith. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
