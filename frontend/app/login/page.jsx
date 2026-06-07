'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, register, getUserRole } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Register form state
  const [regForm, setRegForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // 1. Disparamos la petición
    const res = await login(loginForm.email, loginForm.password)
    setLoading(false)
    
    // EL CHIVATO: ¿Qué te está devolviendo realmente el backend?
    console.log("Respuesta cruda del backend:", res);

    if (res.success) {
      // Intentamos leer el rol
      const role = getUserRole();
      console.log("Rol detectado por el frontend:", role);

      // PARCHE TÁCTICO: Evaluamos tanto el rol de la función como si viene directo en la respuesta
      const esAdmin = role === 'admin' || res.usuario?.rol === 'admin';

      if (esAdmin) {
        console.log("Redirigiendo a panel ADMIN...");
        router.push('/admin');
      } else {
        console.log("Redirigiendo a CATÁLOGO (Cliente)...");
        router.push('/');
      }
    } else {
      setError(res.error)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regForm.password !== regForm.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const res = await register(regForm.nombre, regForm.apellidos, regForm.email, regForm.password)
    setLoading(false)
    if (res.success) {
      setSuccess('Cuenta creada. Ahora puedes iniciar sesión.')
      setMode('login')
      setLoginForm(f => ({ ...f, email: regForm.email }))
    } else {
      setError(res.error)
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-20 flex items-center grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-primary/95 to-bg-secondary pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-exo2 text-3xl font-bold text-white tracking-widest">
              ZEN<span className="text-accent">ITH</span>
            </span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-8">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors mt-2"
              >
                {loading ? 'Entrando…' : 'Iniciar sesión'}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.nombre}
                    onChange={e => setRegForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Juan"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.apellidos}
                    onChange={e => setRegForm(f => ({ ...f, apellidos: e.target.value }))}
                    placeholder="García López"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={regForm.confirmPassword}
                  onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repite la contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors mt-2"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  )
}
