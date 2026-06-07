'use client'

import { useState } from 'react'

export default function VehicleDetailImage({ src, alt, fallbackText }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative h-72 md:h-[26rem] bg-[#080C13] overflow-hidden">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="terminal-text text-2xl text-[#8892A4]">{fallbackText}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030508] via-[#030508]/50 to-transparent" />
    </div>
  )
}
