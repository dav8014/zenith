'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { isAuthenticated, logout, getUserRole } from '../lib/auth'

const NAV = [
  { href: '/renting', label: 'RENTING' },
  { href: '/importacion', label: 'IMPORTACIÓN' },
  { href: '/comparador', label: 'COMPARADOR' },
]

export default function Header() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const accountDropdownRef = useRef(null)

  useEffect(() => {
    setAuthed(isAuthenticated())
    setIsAdmin(getUserRole() === 'admin')
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target)) {
        setAccountDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setAuthed(false)
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#1A2035]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 border border-accent flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-accent" />
            </div>
            <span className="font-exo2 font-bold text-base tracking-widest text-white">
              ZEN<span className="text-accent">ITH</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`terminal-text text-[10px] transition-colors duration-200 ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'text-accent'
                    : 'text-[#8892A4] hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {authed ? (
              <>
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      className="terminal-text text-[10px] text-[#8892A4] hover:text-white transition-colors uppercase tracking-wider"
                    >
                      PANEL ADMIN
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-1.5 border border-accent terminal-text text-[10px] text-accent hover:bg-accent hover:text-white transition-all uppercase tracking-wider"
                    >
                      CERRAR SESIÓN
                    </button>
                  </>
                ) : (
                  <div className="relative" ref={accountDropdownRef}>
                    <button
                      onClick={() => setAccountDropdownOpen(o => !o)}
                      className="terminal-text text-[10px] text-[#8892A4] hover:text-white transition-colors uppercase tracking-wider"
                    >
                      MI CUENTA ▼
                    </button>
                    {accountDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-[#080C13] border border-[#1A2035] z-50">
                        <Link
                          href="/panel/mis-contratos"
                          className="block px-4 py-3 terminal-text text-[10px] text-[#8892A4] hover:text-white hover:bg-[#1A2035] uppercase tracking-wider transition-colors"
                          onClick={() => setAccountDropdownOpen(false)}
                        >
                          MIS CONTRATOS
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 terminal-text text-[10px] text-[#8892A4] hover:text-white hover:bg-[#1A2035] uppercase tracking-wider transition-colors"
                        >
                          CERRAR SESIÓN
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="px-5 py-1.5 bg-accent hover:bg-accent-dark text-white terminal-text text-[10px] font-bold transition-all"
              >
                ACCEDER
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#8892A4] hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-[#1A2035] space-y-0.5">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block py-3 px-2 terminal-text text-[10px] transition-colors ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'text-accent'
                    : 'text-[#8892A4] hover:text-white'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t border-[#1A2035]">
              {authed ? (
                <div className="flex flex-col gap-1">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="terminal-text text-[10px] text-[#8892A4] hover:text-white py-2 uppercase tracking-wider"
                      onClick={() => setMenuOpen(false)}
                    >
                      PANEL ADMIN
                    </Link>
                  ) : (
                    <Link
                      href="/panel/mis-contratos"
                      className="terminal-text text-[10px] text-[#8892A4] hover:text-white py-2 uppercase tracking-wider"
                      onClick={() => setMenuOpen(false)}
                    >
                      MIS CONTRATOS
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-left terminal-text text-[10px] text-accent hover:text-white py-2 uppercase tracking-wider"
                  >
                    CERRAR SESIÓN
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 bg-accent hover:bg-accent-dark text-white terminal-text text-[10px] font-bold transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  ACCEDER
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
