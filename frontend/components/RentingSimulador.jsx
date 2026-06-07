'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation' // IMPORTANTE: Importamos useRouter para la redirección

const API_BASE = 'http://localhost:8001/api/v1'

const PLAZOS = [36, 48, 60]
const KMS = [10000, 15000, 20000]

function fmt(n) {
  return parseFloat(n).toLocaleString('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  })
}

function BtnSelector({ options, active, onSelect, label: labelFn }) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="flex-1 py-2 terminal-text text-[9px] font-bold transition-all border"
          style={{
            background: opt === active ? '#0066FF' : '#1A2035',
            borderColor: opt === active ? '#0066FF' : '#1A2035',
            color: '#fff',
          }}
        >
          {labelFn(opt)}
        </button>
      ))}
    </div>
  )
}

export default function RentingSimulador({ vehiculoId, precioFinal }) {
  const router = useRouter() // Instanciamos el router de Next.js

  const [plazo, setPlazo] = useState(36)
  const [km, setKm] = useState(15000)
  const [aportacionInput, setAportacionInput] = useState('')
  const [aportacion, setAportacion] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [desglose, setDesglose] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [solicitadoOk, setSolicitadoOk] = useState(false)
  const [solicitadoError, setSolicitadoError] = useState('')

  const simular = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`${API_BASE}/vehiculos/${vehiculoId}/simular-renting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plazo_meses: plazo,
          km_anuales: km,
          aportacion_inicial: aportacion,
        }),
      })
      if (!res.ok) throw new Error()
      setResultado(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [vehiculoId, plazo, km, aportacion])

  // EL CORTAFUEGOS (Debounce)
  useEffect(() => {
    const temporizador = setTimeout(() => {
      simular()
    }, 400)
    return () => clearTimeout(temporizador)
  }, [simular])

  // REGLA DE NEGOCIO: Bloqueo del límite legal
  function handleAportacionBlur() {
    let val = parseFloat(aportacionInput.replace(',', '.')) || 0
    const MAX_APORTACION = precioFinal * 0.30

    if (val < 0) val = 0
    if (val > MAX_APORTACION) val = MAX_APORTACION

    setAportacionInput(val.toString())
    setAportacion(val)
  }

  // EL PAYLOAD Y LA REDIRECCIÓN
  async function solicitar() {
    const token = localStorage.getItem('token')
    if (!token) { window.location.href = '/login'; return }
    setSolicitando(true)
    setSolicitadoError('')
    try {
      const res = await fetch(`${API_BASE}/contratos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vehiculo_id: vehiculoId,
          plazo_meses: plazo,
          km_anuales: km,
          aportacion_inicial: aportacion,
          cuota_mensual_fijada: resultado ? resultado.cuota_mensual : 0 
        }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) { setSolicitadoError('Error al procesar la solicitud'); return }
      
      setSolicitadoOk(true)
      
      // LA REDIRECCIÓN AUTOMÁTICA
      setTimeout(() => {
        // Asegúrate de que esta ruta '/panel/mis-contratos' existe en tu app de Next.js
        router.push('/panel/mis-contratos') 
      }, 2000)

    } catch {
      setSolicitadoError('Error de conexión')
    } finally {
      setSolicitando(false)
    }
  }

  return (
    <div className="glass p-5 space-y-5">

      {/* Duration selector */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">DURACIÓN DEL CONTRATO</p>
        <BtnSelector
          options={PLAZOS}
          active={plazo}
          onSelect={p => { setPlazo(p); setSolicitadoOk(false) }}
          label={p => `${p} MESES`}
        />
      </div>

      {/* KM selector */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">KILOMETRAJE ANUAL</p>
        <BtnSelector
          options={KMS}
          active={km}
          onSelect={k => { setKm(k); setSolicitadoOk(false) }}
          label={k => `${k.toLocaleString('es-ES')} KM`}
        />
      </div>

      {/* Initial contribution */}
      <div>
        <p className="terminal-text text-[9px] text-[#8892A4] mb-2">APORTACIÓN INICIAL (€)</p>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={aportacionInput}
          onChange={e => { setAportacionInput(e.target.value); setSolicitadoOk(false) }}
          onBlur={handleAportacionBlur}
          className="w-full font-roboto-mono text-sm text-white px-3 py-2 border border-[#1A2035] focus:border-accent focus:outline-none"
          style={{ background: '#030508' }}
        />
        {/* Feedback visual del límite */}
        {aportacion === precioFinal * 0.30 && (
          <p className="text-accent text-[9px] mt-1 terminal-text">Límite legal del 30% alcanzado.</p>
        )}
      </div>

      {/* Monthly payment result */}
      <div className="pt-4 border-t border-[#1A2035]">
        <p className="terminal-text text-[9px] text-[#8892A4] mb-1">CUOTA MENSUAL ESTIMADA</p>
        {loading ? (
          <p className="font-roboto-mono text-2xl font-bold text-[#00D4FF] animate-pulse">...</p>
        ) : error ? (
          <p className="font-roboto-mono text-lg text-[#8892A4]">No disponible</p>
        ) : (
          <p className="font-roboto-mono text-2xl font-bold text-[#00D4FF]">
            {resultado ? `${Math.round(resultado.cuota_mensual).toLocaleString('es-ES')} €/MES` : '—'}
          </p>
        )}
        <p className="terminal-text text-[9px] text-[#8892A4] mt-1">
          {plazo} meses · {km.toLocaleString('es-ES')} km/año
        </p>
      </div>

      {/* Desglose toggle */}
      {resultado && !error && (
        <div>
          <button
            onClick={() => setDesglose(d => !d)}
            className="terminal-text text-[9px] text-accent hover:text-white transition-colors"
          >
            {desglose ? '▲ Ocultar desglose' : '▼ Ver desglose'}
          </button>

          {desglose && (
            <div className="mt-3 divide-y divide-[#1A2035] border border-[#1A2035]">
              {[
                { label: 'VALOR RESIDUAL', value: fmt(resultado.valor_residual) },
                { label: 'DEPRECIACIÓN', value: fmt(resultado.depreciacion) },
                { label: 'COSTES OPERATIVOS', value: fmt(resultado.costes_operativos) },
                { label: 'MARGEN ZENITH', value: fmt(resultado.margen_zenith) },
                { label: 'TOTAL CONTRATO', value: fmt(resultado.total_contrato) },
                { label: 'APORTACIÓN INICIAL', value: fmt(aportacion) },
                { label: 'A PAGAR EN CUOTAS', value: fmt(resultado.a_pagar) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-3 py-2.5">
                  <p className="terminal-text text-[9px] text-[#8892A4]">{label}</p>
                  <p className="font-roboto-mono text-xs text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {solicitadoOk ? (
        <div className="py-4 text-center border border-emerald-500/40 bg-emerald-500/10 flex flex-col items-center justify-center gap-2">
          <p className="terminal-text text-[9px] text-emerald-400">SOLICITUD ENVIADA CORRECTAMENTE</p>
          <p className="terminal-text text-[8px] text-[#8892A4]">Redirigiendo a tu panel...</p>
        </div>
      ) : (
        <button
          onClick={solicitar}
          disabled={solicitando || loading || error || !resultado}
          className="w-full py-4 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-white terminal-text text-[10px] font-bold transition-all hover:shadow-lg hover:shadow-accent/25"
        >
          {solicitando ? 'PROCESANDO...' : 'SOLICITAR RENTING →'}
        </button>
      )}

      {solicitadoError && (
        <p className="terminal-text text-[9px] text-red-400 text-center">{solicitadoError}</p>
      )}
    </div>
  )
}