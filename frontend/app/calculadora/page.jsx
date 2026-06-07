'use client'

import { useState, useEffect } from 'react'
import { useAmortization } from '../../hooks/useAmortization'
import MetricRow from '../../components/MetricRow'

const PLAZO_OPTIONS = [12, 24, 36, 48, 60]

function fmt(n, decimals = 2) {
  return Number(n).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function CalculatorPage() {
  const [form, setForm] = useState({
    precio: '',
    entrada: '',
    interes: '7.5',
    plazo: 36,
  })
  const [showTable, setShowTable] = useState(false)
  const { result, calculate, reset } = useAmortization()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const precioParam = params.get('precio')
    if (precioParam && !isNaN(parseFloat(precioParam))) {
      setForm(f => ({ ...f, precio: precioParam }))
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const precio = parseFloat(form.precio)
    const entrada = parseFloat(form.entrada) || 0
    const interes = parseFloat(form.interes)
    const plazo = Number(form.plazo)
    if (!precio || precio <= 0) return
    const principal = precio - entrada
    if (principal <= 0) return
    calculate(principal, interes, plazo)
    setShowTable(false)
  }

  function handleReset() {
    setForm({ precio: '', entrada: '', interes: '7.5', plazo: 36 })
    reset()
    setShowTable(false)
  }

  const capitalFinanciado = parseFloat(form.precio || 0) - parseFloat(form.entrada || 0)

  return (
    <main className="min-h-screen pt-20 pb-20">
      {/* Header */}
      <div className="bg-[#080C13] border-b border-[#1A2035] mb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="terminal-text text-[10px] text-accent mb-1">// HERRAMIENTA</p>
          <h1 className="font-exo2 text-3xl font-bold text-white">Calculadora de cuotas</h1>
          <p className="text-[#8892A4] text-sm mt-1">
            Simula tu cuota mensual de renting con amortización francesa.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="glass p-6">
            <p className="terminal-text text-[10px] text-[#8892A4] mb-6">PARÁMETROS DEL PRÉSTAMO</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block terminal-text text-[9px] text-[#8892A4] mb-2">
                  PRECIO DEL VEHÍCULO (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  placeholder="Ej: 35000"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  required
                  className="w-full bg-[#080C13] border border-[#1A2035] px-4 py-3 text-white font-roboto-mono text-sm placeholder-[#8892A4]/30 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="block terminal-text text-[9px] text-[#8892A4] mb-2">
                  ENTRADA INICIAL (€) <span className="normal-case text-[#8892A4]/50">— opcional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ej: 5000"
                  value={form.entrada}
                  onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))}
                  className="w-full bg-[#080C13] border border-[#1A2035] px-4 py-3 text-white font-roboto-mono text-sm placeholder-[#8892A4]/30 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="block terminal-text text-[9px] text-[#8892A4] mb-2">
                  INTERÉS ANUAL (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={form.interes}
                  onChange={e => setForm(f => ({ ...f, interes: e.target.value }))}
                  required
                  className="w-full bg-[#080C13] border border-[#1A2035] px-4 py-3 text-white font-roboto-mono text-sm focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="block terminal-text text-[9px] text-[#8892A4] mb-3">
                  PLAZO EN MESES
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PLAZO_OPTIONS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, plazo: p }))}
                      className={`flex-1 py-2.5 border terminal-text text-[9px] font-bold transition-all duration-200 ${
                        form.plazo === p
                          ? 'bg-accent border-accent text-white'
                          : 'border-[#1A2035] text-[#8892A4] hover:text-white hover:border-accent/50'
                      }`}
                    >
                      {p}M
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-accent hover:bg-accent-dark text-white font-bold terminal-text text-[9px] transition-colors"
                >
                  CALCULAR CUOTA →
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3.5 border border-[#1A2035] hover:border-accent/50 text-[#8892A4] hover:text-white terminal-text text-[9px] transition-all"
                >
                  LIMPIAR
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-5">
            {result ? (
              <>
                <div className="glass p-6">
                  <p className="terminal-text text-[10px] text-[#8892A4] mb-5">RESULTADO</p>

                  {/* Cuota destacada */}
                  <div className="pb-5 mb-5 border-b border-[#1A2035] text-center">
                    <p className="terminal-text text-[9px] text-[#8892A4] mb-2">CUOTA MENSUAL</p>
                    <p className="font-roboto-mono text-4xl font-bold text-[#00D4FF]">
                      {fmt(result.cuotaMensual)}
                    </p>
                  </div>

                  <MetricRow
                    items={[
                      { label: 'CAPITAL FINANCIADO', value: fmt(capitalFinanciado) },
                      { label: 'TOTAL INTERESES', value: fmt(result.totalIntereses) },
                      { label: 'TOTAL A PAGAR', value: fmt(result.totalContrato), highlight: false },
                    ]}
                  />
                </div>

                {/* Composition bar */}
                <div className="glass p-5">
                  <p className="terminal-text text-[9px] text-[#8892A4] mb-3">COMPOSICIÓN</p>
                  <div className="flex h-2 bg-[#1A2035] mb-3 overflow-hidden">
                    <div
                      className="bg-accent transition-all duration-500"
                      style={{
                        width: `${(100 * capitalFinanciado) / result.totalContrato}%`,
                      }}
                    />
                    <div className="bg-amber-500 flex-1" />
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 terminal-text text-[9px] text-[#8892A4]">
                      <span className="w-2 h-2 bg-accent inline-block" />
                      CAPITAL
                    </span>
                    <span className="flex items-center gap-1.5 terminal-text text-[9px] text-[#8892A4]">
                      <span className="w-2 h-2 bg-amber-500 inline-block" />
                      INTERESES
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowTable(s => !s)}
                  className="w-full py-3 border border-[#1A2035] hover:border-accent/50 text-[#8892A4] hover:text-white terminal-text text-[9px] transition-all"
                >
                  {showTable ? 'OCULTAR' : 'VER'} TABLA DE AMORTIZACIÓN ({form.plazo} CUOTAS)
                </button>
              </>
            ) : (
              <div className="glass p-12 text-center">
                <div className="w-12 h-12 border border-[#1A2035] flex items-center justify-center mx-auto mb-4">
                  <span className="terminal-text text-[9px] text-[#8892A4]">01</span>
                </div>
                <h3 className="font-exo2 text-lg font-semibold text-white mb-2">
                  Introduce los datos
                </h3>
                <p className="text-[#8892A4] text-sm">
                  Completa el formulario y pulsa CALCULAR CUOTA para ver el resultado.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Amortization table */}
        {result && showTable && (
          <div className="mt-8 glass overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1A2035]">
              <p className="terminal-text text-[10px] text-white">TABLA DE AMORTIZACIÓN</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A2035]">
                    {['MES', 'CUOTA', 'CAPITAL', 'INTERÉS', 'SALDO'].map(h => (
                      <th key={h} className="px-6 py-3 text-left terminal-text text-[9px] text-[#8892A4]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.tabla.map(row => (
                    <tr
                      key={row.mes}
                      className="border-b border-[#1A2035]/50 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-6 py-3 terminal-text text-[9px] text-[#8892A4]">{row.mes}</td>
                      <td className="px-6 py-3 font-roboto-mono text-xs text-white">{fmt(row.cuota)}</td>
                      <td className="px-6 py-3 font-roboto-mono text-xs text-accent">{fmt(row.amortizacion)}</td>
                      <td className="px-6 py-3 font-roboto-mono text-xs text-amber-400">{fmt(row.interes)}</td>
                      <td className="px-6 py-3 font-roboto-mono text-xs text-[#8892A4]">{fmt(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
