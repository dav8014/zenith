'use client'

import { useState, useEffect } from 'react'

export default function VehicleGallery({ imagenes = [], fallbackUrl = null, fallbackText = '' }) {
  const urls = imagenes.length > 0
    ? imagenes.map(i => i.imagen_url)
    : fallbackUrl ? [fallbackUrl] : []

  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  function prev() { setIndex(i => Math.max(0, i - 1)); setFailed(false) }
  function next() { setIndex(i => Math.min(urls.length - 1, i + 1)); setFailed(false) }

  function openLightbox() { if (urls[index] && !failed) setLightbox(true) }
  function closeLightbox() { setLightbox(false) }

  // Close on Escape
  useEffect(() => {
    if (!lightbox) return
    function onKey(e) { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const arrowStyle = (disabled) => ({
    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
    width: 36, height: 36, fontSize: 20,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  return (
    <>
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 24 }}>

        {/* Main image */}
        <div style={{ position: 'relative', height: 400, background: '#080C13', display: 'flex', alignItems: 'center' }}>
          {urls[index] && !failed ? (
            <img
              key={index}
              src={urls[index]}
              alt={`${fallbackText} ${index + 1}`}
              onClick={openLightbox}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', cursor: 'zoom-in' }}
              onError={() => setFailed(true)}
            />
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span className="terminal-text text-2xl text-[#8892A4]">{fallbackText}</span>
            </div>
          )}

          {urls.length > 1 && (
            <>
              <button onClick={prev} disabled={index === 0} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', ...arrowStyle(index === 0) }}>‹</button>
              <button onClick={next} disabled={index === urls.length - 1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...arrowStyle(index === urls.length - 1) }}>›</button>
            </>
          )}
        </div>

        {/* Counter */}
        {urls.length > 1 && (
          <p className="font-roboto-mono" style={{ textAlign: 'center', fontSize: 12, color: '#8892A4', marginTop: 8 }}>
            {index + 1} / {urls.length}
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#fff', width: 40, height: 40, fontSize: 20,
              cursor: 'pointer', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Cerrar"
          >✕</button>

          {/* Image — stop propagation so clicking it doesn't close */}
          <img
            src={urls[index]}
            alt={`${fallbackText} ${index + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', display: 'block',
            }}
          />

          {/* Arrows */}
          {urls.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                disabled={index === 0}
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', ...arrowStyle(index === 0) }}
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                disabled={index === urls.length - 1}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', ...arrowStyle(index === urls.length - 1) }}
              >›</button>
            </>
          )}

          {/* Counter */}
          {urls.length > 1 && (
            <p
              onClick={e => e.stopPropagation()}
              className="font-roboto-mono"
              style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#8892A4' }}
            >
              {index + 1} / {urls.length}
            </p>
          )}
        </div>
      )}
    </>
  )
}
