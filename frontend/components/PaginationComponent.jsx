'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function PaginationComponent({ currentPage, totalPages, baseParams = '' }) {
  const router = useRouter()
  const pathname = usePathname()

  if (totalPages <= 1) return null

  function goTo(page) {
    const params = new URLSearchParams(baseParams)
    params.set('page', page)
    router.push(`${pathname}?${params.toString()}`)
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter(
    p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
  )

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Paginación">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-4 py-2 border border-[#1A2035] terminal-text text-[9px] text-[#8892A4] hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ← ANTERIOR
      </button>

      <div className="flex items-center gap-1 mx-1">
        {visible.map((page, i) => {
          const prev = visible[i - 1]
          const ellipsis = prev && page - prev > 1
          return (
            <span key={page} className="flex items-center gap-1">
              {ellipsis && (
                <span className="w-8 h-8 flex items-center justify-center text-[#8892A4] terminal-text text-[9px]">
                  …
                </span>
              )}
              <button
                onClick={() => goTo(page)}
                className={`w-8 h-8 terminal-text text-[9px] font-bold transition-all duration-200 border ${
                  currentPage === page
                    ? 'bg-accent border-accent text-white'
                    : 'border-[#1A2035] text-[#8892A4] hover:text-white hover:border-accent/50'
                }`}
              >
                {page}
              </button>
            </span>
          )
        })}
      </div>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 px-4 py-2 border border-[#1A2035] terminal-text text-[9px] text-[#8892A4] hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        SIGUIENTE →
      </button>
    </nav>
  )
}
