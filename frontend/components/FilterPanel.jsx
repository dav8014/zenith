'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const COMBUSTIBLE_OPTIONS = [
  { value: '', label: 'TODOS' },
  { value: 'gasolina', label: 'GASOLINA' },
  { value: 'diesel', label: 'DIESEL' },
  { value: 'electrico', label: 'ELECTRICO' },
  { value: 'hibrido', label: 'HIBRIDO' },
  { value: 'hibrido_enchufable', label: 'PLUG-IN' },
]

const ORIGEN_OPTIONS = [
  { value: '', label: 'TODOS' },
  { value: 'nacional', label: 'NACIONAL' },
  { value: 'importado', label: 'IMPORTADO' },
]

const SORT_OPTIONS = [
  { value: 'precio_asc', label: 'Precio: menor primero' },
  { value: 'precio_desc', label: 'Precio: mayor primero' },
  { value: 'anio_desc', label: 'Año: más reciente' },
  { value: 'km_asc', label: 'Kilómetros: menor' },
]

const DEFAULT_FILTERS = {
  search: '',
  combustible: '',
  origen: '',
  precioMax: 200000,
  sort: 'precio_asc',
}

function RadioOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors border ${
        selected
          ? 'bg-accent/10 border-accent/40'
          : 'border-transparent hover:border-[#1A2035]'
      }`}
    >
      <span className={`w-2.5 h-2.5 border flex-shrink-0 flex items-center justify-center ${
        selected ? 'border-accent bg-accent' : 'border-[#8892A4]'
      }`}>
        {selected && <span className="w-1 h-1 bg-white" />}
      </span>
      <span className={`terminal-text text-[9px] ${selected ? 'text-white' : 'text-[#8892A4]'}`}>
        {label}
      </span>
    </button>
  )
}

export default function FilterPanel({ initialFilters = DEFAULT_FILTERS, showOrigen = true }) {
  const router = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters })

  function pushFilters(updated) {
    setFilters(updated)
    const params = new URLSearchParams()
    if (updated.search) params.set('search', updated.search)
    if (updated.combustible) params.set('combustible', updated.combustible)
    if (showOrigen && updated.origen) params.set('origen', updated.origen)
    if (updated.precioMax < 200000) params.set('precioMax', updated.precioMax)
    if (updated.sort !== 'precio_asc') params.set('sort', updated.sort)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  function reset() { pushFilters({ ...DEFAULT_FILTERS }) }

  return (
    <aside className="glass p-5 space-y-6 sticky top-20">
      <div className="flex items-center justify-between pb-4 border-b border-[#1A2035]">
        <p className="terminal-text text-[10px] text-white">FILTROS</p>
        <button
          onClick={reset}
          className="terminal-text text-[9px] text-[#8892A4] hover:text-accent transition-colors"
        >
          LIMPIAR
        </button>
      </div>

      {/* Search */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">BUSCAR</p>
        <input
          type="text"
          placeholder="Marca o modelo..."
          value={filters.search}
          onChange={e => pushFilters({ ...filters, search: e.target.value })}
          className="w-full bg-[#080C13] border border-[#1A2035] px-3 py-2.5 text-white font-roboto-mono text-xs placeholder-[#8892A4]/40 focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Combustible */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-3">COMBUSTIBLE</p>
        <div className="space-y-1">
          {COMBUSTIBLE_OPTIONS.map(opt => (
            <RadioOption
              key={opt.value}
              label={opt.label}
              selected={filters.combustible === opt.value}
              onClick={() => pushFilters({ ...filters, combustible: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Origen — hidden on single-origin pages */}
      {showOrigen && (
        <div>
          <p className="terminal-text text-[9px] text-[#8892A4] mb-3">ORIGEN</p>
          <div className="space-y-1">
            {ORIGEN_OPTIONS.map(opt => (
              <RadioOption
                key={opt.value}
                label={opt.label}
                selected={filters.origen === opt.value}
                onClick={() => pushFilters({ ...filters, origen: opt.value })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">PRECIO MÁXIMO</p>
        <p className="font-roboto-mono text-sm text-white mb-3">
          {filters.precioMax >= 200000
            ? 'Sin límite'
            : filters.precioMax.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })}
        </p>
        <input
          type="range"
          min="5000"
          max="200000"
          step="5000"
          value={filters.precioMax}
          onChange={e => setFilters(f => ({ ...f, precioMax: Number(e.target.value) }))}
          onMouseUp={e => pushFilters({ ...filters, precioMax: Number(e.target.value) })}
          onTouchEnd={e => pushFilters({ ...filters, precioMax: Number(e.target.value) })}
          className="w-full cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="terminal-text text-[9px] text-[#8892A4]">5K €</span>
          <span className="terminal-text text-[9px] text-[#8892A4]">200K €</span>
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">ORDENAR</p>
        <select
          value={filters.sort}
          onChange={e => pushFilters({ ...filters, sort: e.target.value })}
          className="w-full bg-[#080C13] border border-[#1A2035] px-3 py-2.5 text-white text-xs focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </aside>
  )
}
