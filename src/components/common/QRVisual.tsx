import { BRAND_COLORS } from '@/types'

export function QRVisual({ seed, size = 8 }: { seed: string; size?: number }) {
  const N = 21
  const cells = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => {
      // Corner finder patterns
      const tl = r < 7 && c < 7
      const tr = r < 7 && c >= N - 7
      const bl = r >= N - 7 && c < 7

      if (tl || tr || bl) {
        const fr = tl ? r : bl ? r - (N - 7) : r
        const fc = tl || bl ? c : c - (N - 7)
        if (fr === 0 || fr === 6 || fc === 0 || fc === 6) return true
        if (fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4) return true
        return false
      }

      // Timing / separator gaps
      if (r === 7 || r === N - 8 || c === 7 || c === N - 8) return false

      // Data pseudo-randomization based on seed
      const code = seed.charCodeAt((r * N + c) % (seed.length || 1)) || 65
      return (r * 37 + c * 17 + code) % 3 !== 0
    })
  )

  return (
    <div
      className="inline-block p-3.5 rounded-2xl transition-transform hover:scale-105 duration-300"
      style={{
        backgroundColor: '#fff',
        border: `2px solid rgba(55,171,165,0.35)`,
        boxShadow: `0 8px 32px rgba(55,171,165,0.18)`,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${N}, ${size}px)`,
          gap: '1px',
        }}
      >
        {cells.flat().map((on, i) => (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              backgroundColor: on ? BRAND_COLORS.darkText : '#fff',
              borderRadius: on ? '1px' : '0',
            }}
          />
        ))}
      </div>
    </div>
  )
}
export default QRVisual
