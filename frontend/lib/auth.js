const API_BASE = 'http://localhost:8001/api/v1'

export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return { success: false, error: 'Credenciales incorrectas' }
    
    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('token_type', data.token_type)
    
    // Chivato 1: ¿Qué manda exactamente FastAPI?
    console.log("JSON completo del Login:", data)
    
    // Si el backend mandó el rol explícitamente en el JSON, lo salvamos en el acto
    if (data.rol) {
      localStorage.setItem('rol', data.rol)
    } else if (data.usuario && data.usuario.rol) {
      localStorage.setItem('rol', data.usuario.rol)
    }

    return { success: true, payload: data }
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' }
  }
}

export async function register(nombre, apellidos, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellidos, email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.detail ?? 'Error al registrarse' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' }
  }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('token_type')
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function isAuthenticated() {
  return !!getToken()
}

export function authHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getUserRole() {
  // 1. Miramos si el rol ya se guardó por fuera del token
  const localRole = localStorage.getItem('rol');
  if (localRole) return localRole;

  // 2. Si no, intentamos abrir la llave maestra (el Token)
  const token = getToken()
  if (!token) return null
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Chivato 2: ¿Qué hay dentro del token realmente?
    console.log("Entrañas del JWT:", payload)
    return payload.rol || null
  } catch {
    return null
  }
}
