'use client'

import Link from 'next/link'

const FUEL_LABELS = {
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  electrico: 'Electrico',
  hibrido: 'Hibrido',
  hibrido_enchufable: 'Plug-In',
}

export default function VehicleHighlightCard({ vehiculo }) {
  const {
    marca, modelo, anio, kilometraje, combustible,
    precio_final, imagen_url, potencia, tipo_cambio, emisiones_co2,
  } = vehiculo

  const imageSrc = imagen_url || null

  const r = 5.5 / 12 / 100
  const n = 36
  const cuota = Math.round(parseFloat(precio_final) * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))

  return (
    <article className="glass hover:border-accent/40 transition-colors duration-500 group overflow-hidden">
      {/* Hero image */}
      <div className="relative h-56">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${marca} ${modelo}`}
            className="w-full h-full object-cover"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center bg-[#080C13]"
          style={{ display: imageSrc ? 'none' : 'flex' }}
        >
          <span className="terminal-text text-sm text-[#8892A4]">{marca}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C13] via-[#080C13]/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="pulse-dot" />
          <span className="terminal-text text-[9px] text-white bg-accent px-2 py-0.5">
            IMPORTADO
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-exo2 text-xl font-bold text-white">{marca}</h3>
            <p className="text-accent font-exo2 text-base font-semibold">{modelo}</p>
            <p className="terminal-text text-[9px] text-[#8892A4] mt-1">{anio}</p>
          </div>
          <div className="text-right">
            <p className="terminal-text text-[9px] text-[#8892A4] mb-1">PRECIO FINAL</p>
            <p className="font-roboto-mono text-xl font-bold text-[#00D4FF]">
              {parseFloat(precio_final).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="terminal-text text-[9px] text-[#8892A4] mt-1.5">DESDE</p>
            <p className="font-roboto-mono text-sm font-semibold text-[#0066FF]">
              {cuota.toLocaleString('es-ES')} €/MES
            </p>
            <p className="terminal-text text-[9px] text-[#8892A4]">estimado 36 meses · 5.5%</p>
          </div>
        </div>

        {/* 2×2 Specs grid */}
        <div className="grid grid-cols-2 gap-px bg-[#1A2035] mb-4">
          {[
            { label: 'PWR', value: potencia ? `${potencia} CV` : '—' },
            { label: 'KM', value: kilometraje ? `${kilometraje.toLocaleString('es-ES')} km` : '—' },
            { label: 'TYPE', value: FUEL_LABELS[combustible] ?? combustible },
            { label: 'CAMBIO', value: tipo_cambio ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#080C13] p-3">
              <p className="terminal-text text-[9px] text-[#8892A4] mb-1">{label}</p>
              <p className="font-roboto-mono text-sm text-white">{value}</p>
            </div>
          ))}
        </div>

        {emisiones_co2 && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#1A2035]">
            <span className="text-emerald-500 text-xs">●</span>
            <span className="terminal-text text-[9px] text-[#8892A4]">CO₂ {emisiones_co2} G/KM</span>
          </div>
        )}

        <Link
          href="/catalogo"
          className="block w-full text-center py-2.5 bg-accent hover:bg-accent-dark text-white terminal-text text-[9px] font-bold transition-colors"
        >
          VER EN CATÁLOGO →
        </Link>
      </div>
    </article>
  )
}
