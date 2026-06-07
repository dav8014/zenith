'use client'

import Link from 'next/link';
import { useState } from 'react'

function fmt(n) {
  return parseFloat(n).toLocaleString('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  })
}

export default function TarjetaImportacion({ vehicle }) {
  const [verDesglose, setVerDesglose] = useState(false)

  // Extracción blindada con valores por defecto si el backend falla
  const {
    precio_base = 0,
    iedmt = 0,
    coste_transporte = 1200, // Paracaídas: 1200€ por defecto
    margen_zenith = 1750,    // Paracaídas: 1750€ por defecto
    precio_final = 0,
    emisiones_co2 = 0
  } = vehicle

  // Agrupación estratégica para ocultar el beneficio neto
  const logistica_y_honorarios = parseFloat(coste_transporte) + parseFloat(margen_zenith)

  return (
    <div className="glass p-6">
      
      {/* 1. EL PRECIO ENGAÑOSO (El problema del cliente) */}
      <div className="mb-4 pb-4 border-b border-[#1A2035]">
        <p className="terminal-text text-[9px] tracking-widest text-[#5A657A] mb-1">PRECIO ORIGEN (ALEMANIA)</p>
        <div className="flex items-center gap-3">
          <p className="font-roboto-mono text-xl text-[#5A657A] line-through decoration-red-500/50">
            {fmt(precio_base)}
          </p>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 terminal-text text-[8px]">
            SIN IMPUESTOS NI PORTES
          </span>
        </div>
      </div>

      {/* 2. EL PRECIO REAL (La solución de ZENITH) */}
      <div className="mb-6">
        <p className="terminal-text text-[10px] tracking-widest text-accent mb-2">PRECIO LLAVE EN MANO</p>
        <p className="font-roboto-mono text-4xl font-bold text-[#00D4FF]">{fmt(precio_final)}</p>
        <p className="terminal-text text-[9px] text-emerald-400 mt-2">
          ✓ Vehículo puesto en Madrid. Matriculación y aduanas incluidas.
        </p>
      </div>

      {/* 3. EL BOTÓN DE TRANSPARENCIA */}
      <button
        onClick={() => setVerDesglose(!verDesglose)}
        className="w-full py-3 mb-4 border border-[#1A2035] hover:border-accent/50 text-[#8892A4] hover:text-white terminal-text text-[9px] transition-all flex justify-between items-center px-4"
      >
        <span>DESGLOSE DE IMPUESTOS Y COSTES</span>
        <span>{verDesglose ? '▲' : '▼'}</span>
      </button>

      {/* EL DESGLOSE MATEMÁTICAMENTE PERFECTO */}
      {verDesglose && (
        <div className="divide-y divide-[#1A2035] border border-[#1A2035] bg-[#080C13] mb-6">
          
          <div className="flex justify-between items-center px-4 py-3">
            <p className="terminal-text text-[9px] text-[#5A657A]">VALOR VEHÍCULO (ALEMANIA)</p>
            <p className="font-roboto-mono text-xs text-white">{fmt(precio_base)}</p>
          </div>

          <div className="flex justify-between items-center px-4 py-3">
            <div>
              <p className="terminal-text text-[9px] text-[#5A657A]">IEDMT (IMPUESTO ESTATAL)</p>
              {emisiones_co2 > 0 && (
                <p className="terminal-text text-[8px] text-[#8892A4] mt-1">Tramo por emisiones: {emisiones_co2} g/km</p>
              )}
            </div>
            <p className="font-roboto-mono text-xs text-white">{fmt(iedmt)}</p>
          </div>

          <div className="flex justify-between items-center px-4 py-3 bg-accent/5">
            <div>
              <p className="terminal-text text-[9px] text-emerald-400">GESTIÓN INTEGRAL Y LOGÍSTICA</p>
              <p className="terminal-text text-[8px] text-[#8892A4] mt-1">Grúa Int., Trámites DGT, ITV y Honorarios</p>
            </div>
            {/* El bloque verde de tu HTML */}
            <p className="font-roboto-mono text-xs text-emerald-400">
              {fmt(logistica_y_honorarios)}
            </p>
          </div>

        </div>
      )}

      {/* CTA de Reserva (Hito 1) - AHORA SÍ NAVEGA */}
      <Link 
        href={`/checkout/importacion/${vehicle.id}`}
        className="w-full py-4 bg-accent hover:bg-accent-dark text-white terminal-text text-[10px] font-bold transition-all hover:shadow-lg hover:shadow-accent/25 flex justify-between items-center px-6"
      >
        <span>RESERVAR VEHÍCULO EN ORIGEN</span>
        <span>→</span>
      </Link>
    </div>
  )
}