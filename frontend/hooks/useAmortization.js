'use client'

import { useState, useCallback } from 'react'

export function useAmortization() {
  const [result, setResult] = useState(null)

  const calculate = useCallback((principal, interesAnualPct, plazoMeses) => {
    const r = interesAnualPct / 100 / 12

    let cuota, tabla, totalIntereses

    if (r === 0) {
      cuota = principal / plazoMeses
      totalIntereses = 0
      tabla = Array.from({ length: plazoMeses }, (_, i) => ({
        mes: i + 1,
        cuota,
        interes: 0,
        amortizacion: cuota,
        saldo: Math.max(0, principal - cuota * (i + 1)),
      }))
    } else {
      const factor = Math.pow(1 + r, plazoMeses)
      cuota = (principal * r * factor) / (factor - 1)
      let saldo = principal
      totalIntereses = 0
      tabla = []

      for (let i = 0; i < plazoMeses; i++) {
        const interes = saldo * r
        const amortizacion = cuota - interes
        saldo -= amortizacion
        totalIntereses += interes
        tabla.push({
          mes: i + 1,
          cuota,
          interes,
          amortizacion,
          saldo: Math.max(0, saldo),
        })
      }
    }

    setResult({
      cuotaMensual: cuota,
      totalIntereses,
      totalContrato: cuota * plazoMeses,
      tabla,
    })
  }, [])

  const reset = useCallback(() => setResult(null), [])

  return { result, calculate, reset }
}
