export function AnimatedBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 0 }}>
      {/* Subtle Micro-Grid Texture */}
      <div className="absolute inset-0 luxury-grid-bg opacity-70" />

      {/* Layered Ambient Light Orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 128, 128, 0.45) 0%, rgba(0, 76, 76, 0.1) 70%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(0, 128, 128, 0.1) 70%, transparent 100%)',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(0, 128, 128, 0.1) 60%, transparent 100%)',
        }}
      />
    </div>
  )
}
export default AnimatedBg


