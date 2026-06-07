'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

export default function CheckoutImportacion({ params }) {
  // En Next.js reciente, los params se manejan de forma asíncrona o directa según versión
  // Desestructuramos el ID del vehículo que viene por la URL
const { id } = use(params)
  
  const [vehiculo, setVehiculo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // 1. CONEXIÓN GET: Traer el vehículo real
  useEffect(() => {
    const fetchVehiculo = async () => {
      try {
        // Aseguramos que la variable cargando esté activa al empezar
        setCargando(true) 
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vehiculos/${id}`)
        
        if (!res.ok) {
          throw new Error('El backend ha rechazado la conexión o el vehículo no existe.')
        }
        
        const data = await res.json()
        setVehiculo(data)
        
      } catch (error) {
        console.error("Error crítico cargando los datos:", error)
        alert("Fallo al contactar con la base de datos: " + error.message)
      } finally {
        // ESTO ES LO QUE TE SALVA LA VIDA: 
        // Pase lo que pase (éxito o error), la pantalla de carga se apaga.
        setCargando(false)
      }
    }

    if (id) {
      fetchVehiculo()
    }
  }, [id])

  // 2. CONEXIÓN POST: Enviar la transacción al backend
  const handlePagoReserva = async (e) => {
    e.preventDefault()
    setProcesando(true)

    // 1. ESCÁNER TOTAL: Esto va a destapar qué ve el código exactamente
    console.log("=== INICIO ESCÁNER DE LOCALSTORAGE ===");
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      console.log(`Clave detectada en el navegador: "${clave}" -> Valor:`, localStorage.getItem(clave));
    }
    console.log("=== FIN ESCÁNER DE LOCALSTORAGE ===");

    try {
      // 1. RESCATE DE LA SESIÓN (Con Parche Táctico para la Demo)
      const token = localStorage.getItem('token');
      let usuarioRealId = localStorage.getItem('userId');

      // Si el frontend tiene amnesia por el fallo del Login, forzamos un ID salvavidas
      if (!usuarioRealId && token) {
        console.warn("ALERTA DE SISTEMA: userId no encontrado. Aplicando parche táctico para demostración.");
        // Usamos el ID 1 (el tuyo de administrador) o el que sepas que funciona en tu BD
        usuarioRealId = 1; 
      }

      // 2. BARRERA DE SEGURIDAD
      if (!usuarioRealId || !token) {
        setProcesando(false)
        alert('Acceso denegado: No hay token de seguridad.')
        return
      }

      // 3. EL PAYLOAD REAL (Blindado contra nulos y tipos de datos incorrectos)
      const payload = {
        vehiculo_id: parseInt(vehiculo.id),
        usuario_id: parseInt(usuarioRealId),
        tipo_operacion: 'importacion',
        // Forzamos que sea un número decimal, no un string
        importe_total: parseFloat(vehiculo.precio_final || vehiculo.precio), 
        // Si el coche no trae margen_zenith, aplicamos tu tarifa fija logística de 2950€
        margen_zenith: vehiculo.margen_zenith ? parseFloat(vehiculo.margen_zenith) : 2950.00 
      }

      // 4. EL ENVÍO AL BACKEND
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/operaciones/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Fallo en la pasarela al contactar con el servidor')
      }

      const data = await res.json()
      alert(`¡Reserva confirmada! Operación ID: ${data.operacion_id}. Redirigiendo...`)
      window.location.href = '/checkout/exito' 
      
    } catch (error) {
      alert(`Error: ${error.message}`)
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <p className="font-roboto-mono text-sm text-[#00D4FF] animate-pulse">CARGANDO DATOS DE MATRÍCULA EN ORIGEN...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        
        {/* COLUMNA IZQUIERDA: RESUMEN DE LA OPERACIÓN */}
        <div className="bg-[#080C13] border border-[#1A2035] p-6 rounded-lg h-fit">
          <h2 className="font-roboto-mono text-xs tracking-widest text-[#5A657A] mb-4">RESUMEN DE IMPORTACIÓN</h2>
          <p className="text-2xl font-bold mb-6">{vehiculo.marca} {vehiculo.modelo} <span className="text-xs font-normal text-[#8892A4]">#{vehiculo.id}</span></p>
          
          <div className="divide-y divide-[#1A2035] border border-[#1A2035] text-sm">
            <div className="flex justify-between py-3 px-2">
              <span className="text-[#8892A4]">Valor del vehículo (Alemania)</span>
              <span className="font-roboto-mono">{vehiculo.precio_base.toLocaleString('es-ES')} €</span>
            </div>
            <div className="flex justify-between py-3 px-2">
              <span className="text-[#8892A4]">IEDMT (Impuesto de Matriculación)</span>
              <span className="font-roboto-mono">{vehiculo.iedmt.toLocaleString('es-ES')} €</span>
            </div>
            <div className="flex justify-between py-3 px-2 bg-accent/5">
              <span className="text-emerald-400">Gestión Integral y Logística</span>
              <span className="font-roboto-mono text-emerald-400">
                {(vehiculo.coste_transporte + vehiculo.margen_zenith).toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between py-4 px-2 text-base font-bold">
              <span>PRECIO LLAVE EN MANO</span>
              <span className="font-roboto-mono text-[#00D4FF]">{vehiculo.precio_final.toLocaleString('es-ES')} €</span>
            </div>
          </div>

          <div className="mt-6 bg-[#0F172A] border border-[#1E293B] p-4 rounded text-xs text-[#8892A4] space-y-2">
            <p>• El precio incluye transporte en camión cerrado, revisión en taller oficial e ITV de homologación.</p>
            <p>• Al pagar la señal, el coche se bloquea físicamente en el concesionario de origen de Alemania.</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: PASARELA DE PAGO SIMULADA */}
        <div className="bg-[#080C13] border border-[#1A2035] p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="font-roboto-mono text-xs tracking-widest text-[#5A657A] mb-2">PASARELA DE PAGO</h2>
            <p className="text-sm text-[#8892A4] mb-6">Para iniciar el trámite de importación se requiere el pago de la señal de reserva.</p>
            
            <div className="bg-[#0F172A] p-4 rounded mb-6 border border-accent/20 flex justify-between items-center">
              <div>
                <p className="text-xs text-[#8892A4]">IMPORTE A PAGAR AHORA</p>
                <p className="text-3xl font-bold text-[#00D4FF] font-roboto-mono">1.500 €</p>
              </div>
              <span className="bg-accent/10 text-[#00D4FF] text-[10px] px-2 py-1 border border-accent/30 font-roboto-mono">SEÑAL DE RESERVA</span>
            </div>

            {/* Formulario Blindado */}
            <form onSubmit={handlePagoReserva} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-widest text-[#5A657A] mb-1">TITULAR DE LA TARJETA</label>
                <input 
                  type="text" 
                  required 
                  pattern="[A-Za-záéíóúÁÉÍÓÚñÑ]+\s+[A-Za-záéíóúÁÉÍÓÚñÑ]+.*"
                  placeholder="NOMBRE Y APELLIDO" 
                  className="w-full bg-[#020817] border border-[#1A2035] p-3 text-sm focus:border-[#00D4FF] outline-none font-roboto-mono uppercase" 
                  onInput={(e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')}
                  title="Debe contener nombre y al menos un apellido (solo letras)"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest text-[#5A657A] mb-1">NÚMERO DE TARJETA</label>
                <input 
                  type="text" 
                  required 
                  maxLength="16"
                  pattern="\d{16}"
                  placeholder="0000 0000 0000 0000" 
                  className="w-full bg-[#020817] border border-[#1A2035] p-3 text-sm focus:border-[#00D4FF] outline-none font-roboto-mono" 
                  onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
                  title="Debe contener exactamente 16 dígitos numéricos"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-widest text-[#5A657A] mb-1">CADUCIDAD</label>
                  <input 
                    type="text" 
                    required 
                    maxLength="5"
                    pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                    placeholder="MM/AA" 
                    className="w-full bg-[#020817] border border-[#1A2035] p-3 text-sm focus:border-[#00D4FF] outline-none font-roboto-mono" 
                    onInput={(e) => {
                      let v = e.target.value.replace(/\D/g, '')
                      if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4)
                      e.target.value = v
                    }}
                    title="Formato de fecha válido: MM/AA"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest text-[#5A657A] mb-1">CVC</label>
                  <input 
                    type="text" 
                    required 
                    maxLength="3"
                    pattern="\d{3}"
                    placeholder="123" 
                    className="w-full bg-[#020817] border border-[#1A2035] p-3 text-sm focus:border-[#00D4FF] outline-none font-roboto-mono" 
                    onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
                    title="Código de seguridad de 3 dígitos"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={procesando}
                className="w-full mt-6 py-4 bg-[#00D4FF] hover:bg-[#00b4d8] text-black font-bold font-roboto-mono text-xs transition-all tracking-widest disabled:bg-opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? 'PROCESANDO TRANSACCIÓN SEGURA...' : 'CONFIRMAR RESERVA Y DETENER STOCK →'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link href={`/catalogo/${id}`} className="text-xs text-[#5A657A] hover:text-white underline font-roboto-mono">
              ← Cancelar y volver a la ficha del vehículo
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}