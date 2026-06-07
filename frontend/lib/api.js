import { getToken } from './auth'

const API_BASE = 'http://localhost:8001/api/v1'

export async function getVehiculosNacionales() {
  try {
    const res = await fetch(`${API_BASE}/vehiculos/nacionales`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getVehiculosImportados() {
  try {
    const res = await fetch(`${API_BASE}/vehiculos/importados`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getVehiculoById(id) {
  try {
    const res = await fetch(`${API_BASE}/vehiculos/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getVehiculoImagenes(id) {
  try {
    const res = await fetch(`${API_BASE}/vehiculos/${id}/imagenes`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getContratos(token) {
  try {
    const res = await fetch(`${API_BASE}/contratos`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function updateEstadoContrato(id, estado, token) {
  try {
    const res = await fetch(`${API_BASE}/contratos/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function descargarPDF(contratoId) {
  try {
    const token = getToken()
    const res = await fetch(`${API_BASE}/contratos/${contratoId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return false

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precontrato-zenith-${contratoId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export async function crearContrato(vehiculoId, plazoMeses, token) {
  try {
    const res = await fetch(`${API_BASE}/contratos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vehiculo_id: vehiculoId, plazo_meses: plazoMeses }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
