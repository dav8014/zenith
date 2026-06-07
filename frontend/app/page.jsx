import Link from 'next/link'
import { getVehiculosNacionales, getVehiculosImportados } from '../lib/api'
import VehicleHighlightCard from '../components/VehicleHighlightCard'
import VehicleCard from '../components/VehicleCard'

export const metadata = {
  title: 'Zenith — Renting de Vehículos Premium',
  description:
    'Accede a una flota exclusiva de vehículos nacionales e importados en condiciones de renting inigualables.',
}

export default async function HomePage() {
  const [nacionales, importados] = await Promise.all([getVehiculosNacionales(), getVehiculosImportados()])

  const eliteVehiculos = importados.slice(0, 2)
  const directorioVehiculos = nacionales.slice(0, 9)

  return (
    <main>
      {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/hero-bg.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#030508]/90 via-[#030508]/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5 mb-8">
              <span className="pulse-dot" />
              <span className="terminal-text text-[10px] text-accent">
                SISTEMA ACTIVO · RENTING PREMIUM · ESPAÑA
              </span>
            </div>

            <h1 className="font-exo2 text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
              CONDUCE LO<br />
              MEJOR DEL<br />
              <span className="text-accent">MUNDO.</span>
            </h1>

            <p className="mt-6 text-[#8892A4] text-lg max-w-xl leading-relaxed">
              Renting de flota nacional e importación directa desde Alemania.
              Precio final con transporte e IEDMT incluidos.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/renting"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-dark text-white font-bold transition-all terminal-text text-[10px] hover:shadow-xl hover:shadow-accent/25"
              >
                VER RENTING →
              </Link>
              <Link
                href="/importacion"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#1A2035] hover:border-accent/50 text-white transition-all terminal-text text-[10px] hover:text-accent"
              >
                IMPORTACIÓN →
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-[#1A2035] mt-14">
              {[
                { value: `${nacionales.length}+`, label: 'FLOTA NACIONAL' },
                { value: `${importados.length}+`, label: 'IMPORTADOS' },
                { value: '24H', label: 'RESPUESTA' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-bg-primary px-4 py-5">
                  <p className="font-exo2 font-extrabold text-3xl text-white mb-1">{value}</p>
                  <p className="terminal-text text-[9px] text-[#8892A4]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
      </section>

      {/* ── Unidades de élite (importados) ── */}
      {eliteVehiculos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="terminal-text text-[10px] text-accent mb-2">// UNIDADES DE ÉLITE</p>
              <h2 className="font-exo2 text-3xl md:text-4xl font-bold text-white">
                Importados destacados
              </h2>
            </div>
            <Link
              href="/importacion"
              className="terminal-text text-[9px] text-[#8892A4] hover:text-white transition-colors hidden sm:block"
            >
              VER IMPORTACIÓN →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eliteVehiculos.map(v => (
              <VehicleHighlightCard key={v.id} vehiculo={v} />
            ))}
          </div>
        </section>
      )}

      {/* ── Directorio activo ── */}
      {directorioVehiculos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="terminal-text text-[10px] text-accent mb-2">// DIRECTORIO ACTIVO</p>
              <h2 className="font-exo2 text-3xl md:text-4xl font-bold text-white">
                Vehículos disponibles
              </h2>
            </div>
            <Link
              href="/renting"
              className="terminal-text text-[9px] text-[#8892A4] hover:text-white transition-colors hidden sm:block"
            >
              VER RENTING ({nacionales.length}) →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {directorioVehiculos.map(v => (
              <VehicleCard key={v.id} vehiculo={v} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/renting"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#1A2035] hover:border-accent/50 text-[#8892A4] hover:text-white terminal-text text-[9px] transition-all"
            >
              VER FLOTA NACIONAL COMPLETA →
            </Link>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="border-y border-[#1A2035] bg-[#080C13]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#1A2035]">
            {[
              {
                code: '01',
                title: 'RENTING NACIONAL',
                desc: 'Flota de vehículos nacionales con renting flexible y cuota calculada al instante.',
              },
              {
                code: '02',
                title: 'IMPORTACIÓN DIRECTA',
                desc: 'Vehículos desde Alemania con precio final: transporte e IEDMT ya incluidos.',
              },
              {
                code: '03',
                title: 'CONTRATO DIGITAL',
                desc: 'Solicita tu renting online y descarga el precontrato en PDF.',
              },
            ].map(({ code, title, desc }) => (
              <div key={code} className="bg-[#080C13] p-6">
                <p className="terminal-text text-[9px] text-accent mb-3">{code}</p>
                <h3 className="font-exo2 font-semibold text-white mb-2">{title}</h3>
                <p className="text-[#8892A4] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="terminal-text text-[10px] text-accent mb-4">// COMENZAR</p>
          <h2 className="font-exo2 text-4xl md:text-5xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-[#8892A4] mb-10 max-w-xl mx-auto leading-relaxed">
            Explora la flota nacional o consulta nuestro servicio de importación.
            Financiación online en minutos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/renting"
              className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent-dark text-white font-bold transition-all terminal-text text-[10px] hover:shadow-2xl hover:shadow-accent/30"
            >
              VER RENTING →
            </Link>
            <Link
              href="/importacion"
              className="inline-flex items-center gap-2 px-10 py-4 border border-[#1A2035] hover:border-accent/50 text-white terminal-text text-[10px] transition-all hover:text-accent"
            >
              IMPORTACIÓN →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
