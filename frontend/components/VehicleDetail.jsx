import Link from 'next/link'
import VehicleGallery from './VehicleGallery'
import RentingSimulador from './RentingSimulador'
import TarjetaImportacion from './TarjetaImportacion'

const FUEL_LABELS = {
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  electrico: 'Eléctrico',
  hibrido: 'Híbrido',
  hibrido_enchufable: 'Híbrido Enchufable',
}

const ESTADO_LABELS = {
  disponible: 'DISPONIBLE',
  reservado: 'RESERVADO',
  en_transito: 'EN TRÁNSITO',
  entregado: 'ENTREGADO',
}

const ESTADO_COLORS = {
  disponible: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  reservado: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  en_transito: 'text-blue-400 border-blue-400/40 bg-blue-500/10',
  entregado: 'text-[#8892A4] border-[#8892A4]/40',
}

function fmt(n) {
  return parseFloat(n).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

export default function VehicleDetail({ vehicle, backHref, imagenes = [], showSimulador = false }) {
  const {
    marca, modelo, anio, kilometraje, combustible,
    emisiones_co2, color, tipo_cambio, potencia, num_puertas,
    precio_final, precio_base, coste_transporte, iedmt,
    origen, imagen_url, estado_logistico, plataforma_origen, descripcion,
  } = vehicle

  const specs = [
    { label: 'AÑO DE FABRICACIÓN', value: String(anio) },
    { label: 'KILOMETRAJE', value: `${Number(kilometraje).toLocaleString('es-ES')} km` },
    { label: 'COMBUSTIBLE', value: FUEL_LABELS[combustible] ?? combustible },
    emisiones_co2 != null && { label: 'EMISIONES CO₂', value: `${emisiones_co2} g/km` },
    color && { label: 'COLOR', value: color },
    tipo_cambio && { label: 'TIPO DE CAMBIO', value: tipo_cambio },
    potencia && { label: 'POTENCIA', value: `${potencia} CV` },
    num_puertas && { label: 'NÚMERO DE PUERTAS', value: String(num_puertas) },
    origen === 'importado' && plataforma_origen && { label: 'PLATAFORMA ORIGEN', value: plataforma_origen },
  ].filter(Boolean)

  const precioParam = Math.round(parseFloat(precio_final))

  // Cálculo de Renting Optimizado: Aislado solo para vehículos nacionales
  const r = 5.5 / 12 / 100
  const n = 36
  const cuota = origen === 'nacional' 
    ? Math.round(parseFloat(precio_final) * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
    : 0

  return (
    <main className="min-h-screen pb-20">

      {/* 1 — Gallery */}
      <div className="pt-16">
        <VehicleGallery
          imagenes={imagenes}
          fallbackUrl={imagen_url}
          fallbackText={marca}
        />
      </div>

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Nuevo Grid Asimétrico 8/4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* COLUMNA IZQUIERDA: Info + Specs (Orden 2 en móvil, Orden 1 en escritorio) */}
          <div className="lg:col-span-8 flex flex-col gap-10 order-2 lg:order-1">
            
            {/* Tarjeta de Descripción */}
            <div className="glass p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 terminal-text text-[9px] border ${
                  origen === 'importado'
                    ? 'bg-accent border-accent text-white'
                    : 'border-[#1A2035] text-[#8892A4]'
                }`}>
                  {origen === 'importado' ? 'IMPORTADO' : 'NACIONAL'}
                </span>
                <span className={`px-2 py-0.5 terminal-text text-[9px] border ${
                  ESTADO_COLORS[estado_logistico] ?? 'border-[#1A2035] text-[#8892A4]'
                }`}>
                  {ESTADO_LABELS[estado_logistico] ?? estado_logistico}
                </span>
              </div>
              <h1 className="font-exo2 text-2xl md:text-3xl font-bold text-white leading-tight break-words line-clamp-2">
                {marca} <span className="text-accent">{modelo}</span>
              </h1>
              <p className="terminal-text text-[10px] text-[#8892A4] mt-3 tracking-widest">
                {anio} · {plataforma_origen}
              </p>
              {descripcion && (
                <p className="font-lato text-base text-[#8892A4] mt-6 leading-relaxed">
                  {descripcion}
                </p>
              )}
            </div>

            {/* Especificaciones Movidas Aquí */}
            <div>
              <p className="terminal-text text-[10px] tracking-widest text-[#8892A4] mb-4">ESPECIFICACIONES TÉCNICAS</p>
              <div className="grid grid-cols-2 gap-px bg-[#1A2035]">
                {specs.map(({ label, value }) => (
                  <div key={label} className="bg-[#080C13] p-5 hover:bg-[#0a0f18] transition-colors">
                    <p className="terminal-text text-[9px] text-[#5A657A] mb-2">{label}</p>
                    <p className="font-roboto-mono text-sm text-white capitalize">{value}</p>
                  </div>
                ))}
                {specs.length % 2 !== 0 && <div className="bg-[#080C13] p-5" />}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Conversión (Orden 1 en móvil, Orden 2 en escritorio) */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            {/* Anclaje Sticky */}
            <div className="sticky top-24 space-y-4">
              
              {showSimulador ? (
          <RentingSimulador vehiculoId={vehicle.id} precioFinal={precio_final} />
        ) : origen === 'importado' ? (
          <TarjetaImportacion vehicle={vehicle} />
        ) : (
          <div className="glass p-6">
            <p className="terminal-text text-[9px] text-[#8892A4] mb-1">PRECIO FINAL</p>
            <p className="font-roboto-mono text-3xl font-bold text-[#00D4FF]">{fmt(precio_final)}</p>
            
            <div className="pt-4 mt-4 border-t border-[#1A2035]">
              <p className="terminal-text text-[9px] text-[#8892A4] mb-0.5">CUOTA ESTIMADA</p>
              <p className="font-roboto-mono text-2xl font-bold text-[#00D4FF]">
                {cuota ? cuota.toLocaleString('es-ES') : '0'} € / MES
              </p>
              <p className="terminal-text text-[9px] text-[#8892A4]">ESTIMADO 36 MESES · 5.5%</p>
            </div>
          </div>
        )}
              <Link
                href={backHref}
                className="flex items-center justify-center w-full py-3 border border-[#1A2035] hover:border-accent/50 text-[#8892A4] hover:text-white terminal-text text-[9px] transition-all"
              >
                ← VOLVER
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}