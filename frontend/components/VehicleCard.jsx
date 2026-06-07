'use client'

import Link from 'next/link'

const FUEL_LABELS = {
  gasolina: 'GASOLINA',
  diesel: 'DIESEL',
  electrico: 'ELECTRICO',
  hibrido: 'HIBRIDO',
  hibrido_enchufable: 'PLUG-IN',
}

const ESTADO_COLORS = {
  disponible: 'text-emerald-400 border-emerald-500/40',
  reservado: 'text-amber-400 border-amber-500/40',
  en_transito: 'text-blue-400 border-blue-400/40',
  entregado: 'text-[#8892A4] border-[#8892A4]/40',
}

export default function VehicleCard({ vehiculo }) {
  const {
    id, marca, modelo, anio, kilometraje, combustible,
    precio_base,
    precio_final, origen, imagen_url, estado_logistico, potencia,
  } = vehiculo

  const disponible = estado_logistico === 'disponible'
  const imageSrc = imagen_url || null
  const detailHref = origen === 'importado' ? `/importacion/${id}` : `/renting/${id}`

  const r = 5.5 / 12 / 100
  const n = 36
  const cuota = Math.round(parseFloat(precio_final) * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))

  return (
    <article className="glass flex flex-col hover:border-accent/40 transition-colors duration-300 group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden flex-shrink-0 bg-[#080C13]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${marca} ${modelo}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ display: imageSrc ? 'none' : 'flex' }}
        >
          <span className="terminal-text text-xs text-[#8892A4]">{marca}</span>
        </div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {origen === 'importado' && (
            <span className="px-2 py-0.5 terminal-text text-[9px] bg-accent text-white">
              IMPORT
            </span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className={`px-2 py-0.5 terminal-text text-[9px] border ${ESTADO_COLORS[estado_logistico] ?? 'text-[#8892A4] border-[#8892A4]/40'}`}>
            {estado_logistico?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 
            className="font-exo2 font-semibold text-white text-base leading-snug line-clamp-2 min-h-[2.5rem]"
            title={`${marca} ${modelo}`}
          >
            {marca} <span className="text-accent">{modelo}</span>
          </h3>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
            <span className="terminal-text text-[9px] text-[#8892A4]">{anio}</span>
            <span className="text-[#1A2035]">·</span>
            <span className="terminal-text text-[9px] text-[#8892A4]">{kilometraje?.toLocaleString('es-ES')} KM</span>
            <span className="text-[#1A2035]">·</span>
            <span className="terminal-text text-[9px] text-[#8892A4]">{FUEL_LABELS[combustible] ?? combustible}</span>
            {potencia && (
              <>
                <span className="text-[#1A2035]">·</span>
                <span className="terminal-text text-[9px] text-[#8892A4]">{potencia} CV</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-[#1A2035] flex items-end justify-between">
          <div className="flex-1">
            
            {/* --- NEGOCIO 1: RENTING (Coches Nacionales) --- */}
            {/* --- NEGOCIO 1: RENTING (Coches Nacionales) --- */}
            {origen === 'nacional' ? (
              <div className="flex flex-col">
                <p className="terminal-text text-[9px] text-[#8892A4] uppercase tracking-widest mb-1">
                  Cuota mensual desde
                </p>
                <p className="font-roboto-mono text-xl font-bold text-[#00D4FF]">
                  {cuota.toLocaleString('es-ES')} €/MES
                </p>
                <p className="terminal-text text-[8px] text-[#5A657A] mt-1">
                  Todo incluido (Seguro, Mant.)
                </p>
              </div>
            ) : (
            /* --- NEGOCIO 2: IMPORTACIÓN (Coches Alemanes) --- */
              <div className="flex flex-col justify-between">
                <div className="mb-2">
                  <p className="terminal-text text-[8px] tracking-wider text-[#8892A4] mb-0.5">
                    VALOR ALEMANIA (BRUTO)
                  </p>
                  <p className="font-roboto-mono text-base text-[#5A657A] line-through decoration-red-500/50">
                    {parseFloat(precio_base).toLocaleString('es-ES', {
                      style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div>
                  <p className="terminal-text text-[9px] tracking-wider text-emerald-400 mb-0.5">
                    LLAVE EN MANO (TODO INC.)
                  </p>
                  <p className="font-roboto-mono text-xl font-bold text-[#00D4FF]">
                    {parseFloat(precio_final).toLocaleString('es-ES', {
                      style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            )}

          </div>

          <Link
            href={detailHref}
            className={`px-3 py-2 terminal-text text-[9px] font-bold transition-all duration-200 border whitespace-nowrap ml-2 ${
              disponible
                ? 'bg-accent border-accent text-white hover:bg-accent-dark'
                : 'border-[#1A2035] text-[#8892A4] cursor-default'
            }`}
          >
            {disponible ? 'VER FICHA →' : 'NO DISP.'}
          </Link>
        </div>
      </div>
    </article>
  )
}
