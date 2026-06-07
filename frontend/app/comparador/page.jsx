'use client'

import { useState, useEffect } from 'react'
import { getVehiculosNacionales, getVehiculosImportados } from '../../lib/api'

const FUEL_LABELS = {
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  electrico: 'Eléctrico',
  hibrido: 'Híbrido',
  hibrido_enchufable: 'Híbrido Enchufable',
}

const SPECS_RENTING = [
  { key: 'marca', label: 'MARCA' },
  { key: 'modelo', label: 'MODELO' },
  { key: 'anio', label: 'AÑO' },
  {
    key: 'precio_final',
    label: 'PRECIO FINAL',
    format: v => parseFloat(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  },
  {
    key: 'kilometraje',
    label: 'KILÓMETROS',
    format: v => `${Number(v).toLocaleString('es-ES')} km`,
  },
  { key: 'combustible', label: 'COMBUSTIBLE', format: v => FUEL_LABELS[v] ?? v },
  { key: 'potencia', label: 'POTENCIA', format: v => v ? `${v} CV` : '—' },
  { key: 'tipo_cambio', label: 'CAMBIO', format: v => v ?? '—' },
  { key: 'emisiones_co2', label: 'CO₂ (G/KM)', format: v => v ?? '—' },
  { key: 'color', label: 'COLOR', format: v => v ?? '—' },
]

const SPECS_IMPORTACION = [
  { key: 'marca', label: 'MARCA' },
  { key: 'modelo', label: 'MODELO' },
  { key: 'anio', label: 'AÑO' },
  {
    key: 'precio_base',
    label: 'PRECIO ALEMANIA',
    format: v => parseFloat(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  },
  {
    key: 'precio_final',
    label: 'PRECIO LLAVE EN MANO',
    format: v => parseFloat(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  },
  {
    key: 'kilometraje',
    label: 'KILÓMETROS',
    format: v => `${Number(v).toLocaleString('es-ES')} km`,
  },
  { key: 'combustible', label: 'COMBUSTIBLE', format: v => FUEL_LABELS[v] ?? v },
  { key: 'potencia', label: 'POTENCIA', format: v => v ? `${v} CV` : '—' },
  { key: 'tipo_cambio', label: 'CAMBIO', format: v => v ?? '—' },
  { key: 'emisiones_co2', label: 'CO₂ (G/KM)', format: v => v ?? '—' },
  { key: 'plataforma_origen', label: 'PLATAFORMA', format: v => v ?? '—' },
]

const MAX_COMPARE = 2

function fmtPrecio(v) {
  return parseFloat(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export default function ComparatorPage() {
  const [nacionales, setNacionales] = useState([])
  const [importados, setImportados] = useState([])
  const [tab, setTab] = useState('renting')
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getVehiculosNacionales(), getVehiculosImportados()]).then(([nac, imp]) => {
      setNacionales(nac)
      setImportados(imp)
      setLoading(false)
    })
  }, [])

  // Al cambiar de tab, limpia la selección
  function changeTab(newTab) {
    setTab(newTab)
    setSelected([])
    setSearch('')
  }

  const vehiculos = tab === 'renting' ? nacionales : importados
  const specs = tab === 'renting' ? SPECS_RENTING : SPECS_IMPORTACION

  function toggle(vehiculo) {
    setSelected(prev => {
      if (prev.find(v => v.id === vehiculo.id)) return prev.filter(v => v.id !== vehiculo.id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, vehiculo]
    })
  }

  const filtered = vehiculos.filter(v =>
    !search || `${v.marca} ${v.modelo}`.toLowerCase().includes(search.toLowerCase()),
  )

  function highlight(spec, values) {
    if (!['precio_final', 'precio_base', 'kilometraje', 'potencia', 'emisiones_co2'].includes(spec.key)) return []
    const nums = values.map(v => parseFloat(v) || 0)
    if (nums.every(n => n === 0)) return values.map(() => '')
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    if (min === max) return values.map(() => '')
    return values.map(v => {
      const n = parseFloat(v) || 0
      if (spec.key === 'potencia') return n === max ? 'text-emerald-400' : n === min ? 'text-rose-400' : ''
      return n === min ? 'text-emerald-400' : n === max ? 'text-rose-400' : ''
    })
  }

  return (
    <main className="min-h-screen pt-20 pb-20">
      {/* Header */}
      <div className="bg-[#080C13] border-b border-[#1A2035] mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="terminal-text text-[10px] text-accent mb-1">// HERRAMIENTA</p>
          <h1 className="font-exo2 text-3xl font-bold text-white">Comparador de vehículos</h1>
          <p className="text-[#8892A4] text-sm mt-1">
            Selecciona 2 vehículos del mismo servicio para comparar.
          </p>

          {/* Tabs */}
          <div className="flex gap-0 mt-6">
            <button
              onClick={() => changeTab('renting')}
              className={`px-6 py-2.5 terminal-text text-[10px] font-bold transition-all border ${
                tab === 'renting'
                  ? 'bg-accent border-accent text-white'
                  : 'bg-transparent border-[#1A2035] text-[#8892A4] hover:text-white hover:border-accent/50'
              }`}
            >
              RENTING
            </button>
            <button
              onClick={() => changeTab('importacion')}
              className={`px-6 py-2.5 terminal-text text-[10px] font-bold transition-all border border-l-0 ${
                tab === 'importacion'
                  ? 'bg-accent border-accent text-white'
                  : 'bg-transparent border-[#1A2035] text-[#8892A4] hover:text-white hover:border-accent/50'
              }`}
            >
              IMPORTACIÓN
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle picker */}
          <div className="lg:col-span-1">
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1A2035]">
                <p className="terminal-text text-[10px] text-white">
                  {tab === 'renting' ? 'VEHÍCULOS RENTING' : 'VEHÍCULOS IMPORTADOS'}
                </p>
                <span className="terminal-text text-[9px] text-[#8892A4]">
                  {selected.length}/{MAX_COMPARE}
                </span>
              </div>

              <input
                type="text"
                placeholder="Buscar marca o modelo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#080C13] border border-[#1A2035] px-3 py-2.5 text-white font-roboto-mono text-xs placeholder-[#8892A4]/40 focus:outline-none focus:border-accent/50 transition-colors mb-4"
              />

              {loading ? (
                <div className="py-8 text-center terminal-text text-[9px] text-[#8892A4]">
                  CARGANDO…
                </div>
              ) : (
                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                  {filtered.map(v => {
                    const isSelected = selected.some(s => s.id === v.id)
                    const isFull = selected.length >= MAX_COMPARE && !isSelected
                    return (
                      <button
                        key={v.id}
                        onClick={() => !isFull && toggle(v)}
                        disabled={isFull}
                        className={`w-full text-left px-3 py-3 border transition-all duration-200 ${
                          isSelected
                            ? 'bg-accent/10 border-accent/40'
                            : isFull
                            ? 'border-transparent text-[#8892A4]/30 cursor-not-allowed'
                            : 'border-transparent hover:border-[#1A2035] text-[#8892A4] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
                              {v.marca} <span className="text-accent">{v.modelo?.split(' ')[0]}</span>
                            </p>
                            <p className="terminal-text text-[9px] text-[#8892A4] mt-0.5">
                              {v.anio} · {fmtPrecio(v.precio_final)}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="terminal-text text-[9px] text-accent font-bold">✓</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <p className="text-center terminal-text text-[9px] text-[#8892A4] py-6">
                      SIN RESULTADOS
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comparison table */}
          <div className="lg:col-span-2">
            {selected.length < 2 ? (
              <div className="glass p-16 text-center">
                <div className="w-12 h-12 border border-[#1A2035] flex items-center justify-center mx-auto mb-4">
                  <span className="terminal-text text-[9px] text-[#8892A4]">02</span>
                </div>
                <h3 className="font-exo2 text-xl font-semibold text-white mb-2">
                  Selecciona 2 vehículos
                </h3>
                <p className="text-[#8892A4] text-sm">
                  Elige los vehículos de {tab === 'renting' ? 'renting' : 'importación'} para ver la comparativa.
                </p>
              </div>
            ) : (
              <div className="glass overflow-hidden">
                {/* Vehicle headers */}
                <div
                  className="grid border-b border-[#1A2035]"
                  style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}
                >
                  <div className="p-4 bg-[#080C13]" />
                  {selected.map(v => (
                    <div key={v.id} className="p-4 border-l border-[#1A2035] bg-[#080C13]">
                      <div className="relative h-24 mb-3 bg-[#030508] overflow-hidden">
                        {v.imagen_url ? (
                          <img
                            src={v.imagen_url}
                            alt={`${v.marca} ${v.modelo}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="terminal-text text-[9px] text-[#8892A4]">{v.marca}</span>
                          </div>
                        )}
                      </div>
                      <p className="font-exo2 font-semibold text-white text-sm leading-tight line-clamp-1">
                        {v.marca} <span className="text-accent">{v.modelo?.split(' ')[0]}</span>
                      </p>
                      <p className="terminal-text text-[9px] text-[#8892A4] mt-0.5">{v.anio}</p>
                      <button
                        onClick={() => toggle(v)}
                        className="mt-2 terminal-text text-[9px] text-[#8892A4] hover:text-rose-400 transition-colors"
                      >
                        × QUITAR
                      </button>
                    </div>
                  ))}
                </div>

                {/* Spec rows */}
                {specs.map((spec, si) => {
                  const values = selected.map(v => v[spec.key])
                  const colors = highlight(spec, values)
                  return (
                    <div
                      key={spec.key}
                      className={`grid border-b border-[#1A2035]/50 ${si % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                      style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}
                    >
                      <div className="px-4 py-3 terminal-text text-[9px] text-[#8892A4] flex items-center">
                        {spec.label}
                      </div>
                      {selected.map((v, vi) => {
                        const raw = v[spec.key]
                        const display = spec.format ? spec.format(raw) : (raw ?? '—')
                        return (
                          <div
                            key={v.id}
                            className={`px-4 py-3 text-sm border-l border-[#1A2035]/50 font-roboto-mono capitalize ${
                              colors[vi] || 'text-white'
                            }`}
                          >
                            {String(display)}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                <div className="p-4 bg-[#080C13] flex items-center gap-4 border-t border-[#1A2035]">
                  <span className="flex items-center gap-1.5 terminal-text text-[9px] text-[#8892A4]">
                    <span className="text-emerald-400">●</span> MEJOR VALOR
                  </span>
                  <span className="flex items-center gap-1.5 terminal-text text-[9px] text-[#8892A4]">
                    <span className="text-rose-400">●</span> PEOR VALOR
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}