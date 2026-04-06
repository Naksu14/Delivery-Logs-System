import React, { useMemo } from 'react'

const BLOB_COUNT = 7

const BLOB_ANIMATION = `
  @keyframes kioskBlobFloat {
    0% { transform: translate3d(0, 0, 0) scale(1); }
    33% { transform: translate3d(var(--dx), calc(var(--dy) * -0.6), 0) scale(1.08); }
    66% { transform: translate3d(calc(var(--dx) * -0.45), var(--dy), 0) scale(0.94); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
  }
`

export const DEFAULT_BACKGROUND_GRADIENT = 'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)'
export const DEFAULT_BLOB_GRADIENT = 'radial-gradient(circle at 30% 30%, rgba(221,232,71,0.12), rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.02))'

/**
 * Reusable animated blobs background component for kiosk pages
 * @param {string} backgroundGradient - CSS gradient for page background
 * @param {string} blobGradient - CSS gradient for blob elements
 * @param {number} opacity - Opacity of blobs (0-1), default 0.8
 */
export default function KioskBlobsBackground({
  backgroundGradient = DEFAULT_BACKGROUND_GRADIENT,
  blobGradient = DEFAULT_BLOB_GRADIENT,
  opacity = 0.8
}) {
  const blobs = useMemo(
    () =>
      Array.from({ length: BLOB_COUNT }, (_, index) => ({
        id: `blob-${index}`,
        size: 180 + Math.floor(Math.random() * 220),
        top: Math.floor(Math.random() * 85),
        left: Math.floor(Math.random() * 85),
        dx: -60 + Math.floor(Math.random() * 120),
        dy: -60 + Math.floor(Math.random() * 120),
        duration: 8 + Math.floor(Math.random() * 6),
        delay: Math.floor(Math.random() * -8)
      })),
    []
  )

  return (
    <>
      <style>{BLOB_ANIMATION}</style>

      {/* Background */}
      <div className="fixed inset-0" style={{ background: backgroundGradient }} />

      {/* Animated Blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity }}>
        {blobs.map((blob) => (
          <span
            key={blob.id}
            className="absolute rounded-full"
            style={{
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              top: `${blob.top}%`,
              left: `${blob.left}%`,
              background: blobGradient,
              filter: 'blur(2px)',
              animation: `kioskBlobFloat ${blob.duration}s ease-out ${blob.delay}s infinite`,
              '--dx': `${blob.dx}px`,
              '--dy': `${blob.dy}px`
            }}
          />
        ))}
      </div>
    </>
  )
}
