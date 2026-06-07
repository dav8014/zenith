'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { descargarPDF } from '../../../lib/api'
import { getToken } from '../../../lib/auth'

const API_BASE = 'http://localhost:8001/api/v1'

const ESTADO_BADGES = {
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  en_revision: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  aceptado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/30',
}

function fmt(n) {
  return parseFloat(n).toLocaleString('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  })
}

export default function MisContratosPanel() {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingIds, setDownloadingIds] = useState(new Set())

  useEffect(() => {
    const fetchContratos = async () => {
      const token = getToken()
      if (!token) { window.location.href = '/login'; return }

      try {
        const res = await fetch(`${API_BASE}/contratos/mis-contratos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          return
        }

        if (!res.ok) throw new Error('Error al cargar los contratos')
        
        const data = await res.json()
        setContratos(data)
      } catch (err) {
        setError('No se ha podido conectar con el servidor.')
      } finally {
        setLoading(false)
      }
    }
    fetchContratos()
  }, [])

  const handleDescargar = async (contratoId) => {
    setDownloadingIds(prev => new Set(prev).add(contratoId))
    const ok = await descargarPDF(contratoId)
    if (!ok) alert('No se pudo descargar el documento.')
    setDownloadingIds(prev => { const next = new Set(prev); next.delete(contratoId); return next })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-20"><p className="font-roboto-mono text-xl text-[#00D4FF] animate-pulse">CARGANDO PANEL...</p></div>

  return (
    <main className="min-h-screen pb-20 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="font-exo2 text-3xl md:text-4xl font-bold text-white mb-2">
          MIS <span className="text-accent">CONTRATOS</span>
        </h1>
        <p className="terminal-text text-[10px] text-[#8892A4] tracking-widest">
          GESTIÓN Y SEGUIMIENTO DE SOLICITUDES DE RENTING
        </p>
      </div>

      {error ? (
        <div className="glass p-6 border-red-500/30 text-center"><p className="terminal-text text-[10px] text-red-400">{error}</p></div>
      ) : contratos.length === 0 ? (
        <div className="glass p-12 text-center flex flex-col items-center justify-center gap-4">
          <p className="terminal-text text-[10px] text-[#8892A4]">NO TIENES NINGÚN CONTRATO ACTIVO NI EN REVISIÓN</p>
          <Link href="/catalogo" className="px-6 py-3 bg-accent text-white terminal-text text-[9px] font-bold hover:bg-accent-dark transition-colors">
            VER CATÁLOGO DE VEHÍCULOS
          </Link>
        </div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A2035] bg-[#080C13]">
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal">ID / FECHA</th>
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal">VEHÍCULO</th>
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal">CONDICIONES</th>
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal text-right">CUOTA</th>
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal text-center">ESTADO</th>
                <th className="p-4 terminal-text text-[9px] text-[#5A657A] font-normal text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2035]">
              {contratos.map((c) => (
                <tr key={c.id} className="hover:bg-[#0a0f18] transition-colors">
                  <td className="p-4">
                    <p className="font-roboto-mono text-white text-sm">#{c.id}</p>
                    <p className="terminal-text text-[9px] text-[#8892A4] mt-1">
                      {new Date(c.fecha_solicitud || c.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </td>
                  <td className="p-4">
                    {/* Corrección del ID ciego: Ahora mostramos Marca y Modelo si el backend envía la info anidada */}
                    <p className="font-roboto-mono font-bold text-white text-xs">
                      {c.vehiculo ? `${c.vehiculo.marca.toUpperCase()} ${c.vehiculo.modelo.toUpperCase()}` : `VEHÍCULO ID: ${c.vehiculo_id}`}
                    </p>
                    {c.vehiculo && <p className="terminal-text text-[9px] text-[#8892A4] mt-1">REF: {c.vehiculo_id}</p>}
                  </td>
                  <td className="p-4">
                    <p className="terminal-text text-[9px] text-white">{c.plazo_meses} MESES</p>
                    <p className="terminal-text text-[9px] text-[#8892A4] mt-1">{c.km_anuales.toLocaleString('es-ES')} KM/AÑO</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-roboto-mono font-bold text-[#00D4FF] text-base">{fmt(c.cuota_mensual)}</p>
                    {c.aportacion_inicial > 0 && (
                      <p className="terminal-text text-[8px] text-[#5A657A] mt-1">Entrada: {fmt(c.aportacion_inicial)}</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 border terminal-text text-[8px] tracking-wider ${ESTADO_BADGES[c.estado] || ESTADO_BADGES.pendiente}`}>
                      {c.estado.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDescargar(c.id)}
                      disabled={downloadingIds.has(c.id)}
                      className="terminal-text text-[9px] text-accent hover:text-white transition-colors border border-accent/30 hover:bg-accent/10 px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingIds.has(c.id) ? 'DESCARGANDO...' : '↓ DESCARGAR PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}