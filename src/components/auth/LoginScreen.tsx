import { useState, useEffect } from 'react'
import type { AuthUser, UserRole } from '@/types'
import { BRAND_COLORS } from '@/types'
import { MOCK_USERS } from '@/data/mockData'
import RoleCards from '@/components/auth/RoleCards'
import loginImg0 from '@/imports/image.png'
import loginImg1 from '@/imports/image-1.png'
import loginImg2 from '@/imports/image-2.png'

const LOGIN_SLIDES = [
  { src: loginImg0, caption: 'Tu hogar frente al mar' },
  { src: loginImg1, caption: 'Atardeceres únicos en el Mar de Cortés' },
  { src: loginImg2, caption: 'Amenidades de clase mundial' },
]

export function LoginScreen({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [slide, setSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % LOGIN_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const DEFAULT_USERS: Record<UserRole, AuthUser> = {
    admin: MOCK_USERS['admin@laspalomas.mx'].user,
    resident: MOCK_USERS['carlos.mendoza@email.com'].user,
    security: MOCK_USERS['guardia01'].user,
  }

  return (
    <div className="fixed inset-0 flex">
      {/* Carousel: left panel on desktop, full-screen bg on mobile */}
      <div className="absolute inset-0 md:relative md:w-[65%] lg:w-[70%] overflow-hidden flex-shrink-0">
        {/* Photos with crossfade */}
        <div className="absolute inset-0 scale-110 md:scale-100 carousel-imgs">
          {LOGIN_SLIDES.map((s, i) => (
            <img
              key={i}
              src={s.src}
              alt={s.caption}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: slide === i ? 1 : 0, transition: 'opacity 1.2s ease' }}
            />
          ))}
        </div>

        {/* Mobile: dark atmospheric gradient */}
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{
            background:
              'linear-gradient(to bottom, rgba(8,20,30,0.3) 0%, rgba(8,20,30,0.15) 35%, rgba(8,20,30,0.65) 100%)',
          }}
        />

        {/* Desktop: subtle frosted haze */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
        {/* Desktop: vignette bottom */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            background:
              'linear-gradient(to top, rgba(10,30,28,0.78) 0%, rgba(10,30,28,0.18) 40%, transparent 65%)',
          }}
        />
        {/* Desktop: vignette right-edge */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            background:
              'linear-gradient(to right, transparent 75%, rgba(248,250,252,0.55) 100%)',
          }}
        />
        {/* Desktop: vignette soft edges */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            boxShadow:
              'inset 30px 30px 60px rgba(255,255,255,0.12), inset -0px 30px 60px rgba(255,255,255,0.05)',
          }}
        />

        {/* Desktop: bottom branding */}
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10 pointer-events-none hidden md:block">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-white/15 border border-white/30"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <span className="font-display font-bold text-lg text-white z-10 relative">P</span>
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none drop-shadow">
                Las Palomas
              </p>
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest mt-0.5">
                Portal Residencial HOA
              </p>
            </div>
          </div>
          <p className="text-white/90 text-base font-medium drop-shadow-sm mb-5">
            {LOGIN_SLIDES[slide].caption}
          </p>
          <div className="flex items-center gap-2 pointer-events-auto">
            {LOGIN_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className="rounded-full transition-all duration-400 cursor-pointer"
                style={{
                  height: 5,
                  width: slide === i ? 28 : 8,
                  backgroundColor: slide === i ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: role selection */}
      <div className="relative z-10 flex-1 flex flex-col md:bg-white overflow-hidden">
        {/* Desktop: teal glow accents */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none hidden md:block"
          style={{
            background: `radial-gradient(circle, ${BRAND_COLORS.primary}12 0%, transparent 70%)`,
            transform: 'translate(35%,-35%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none hidden md:block"
          style={{
            background: `radial-gradient(circle, ${BRAND_COLORS.primary}0e 0%, transparent 70%)`,
            transform: 'translate(-35%,35%)',
          }}
        />

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-7 md:px-8 lg:px-12 py-8 overflow-y-auto">
          <div className="w-full max-w-[360px] animate-fade-in">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="h-px flex-1"
                style={{
                  background: isMobile
                    ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.35))'
                    : `linear-gradient(to right, transparent, ${BRAND_COLORS.primary}40)`,
                }}
              />
              <span
                className="text-[11px] font-mono font-semibold uppercase tracking-widest"
                style={{ color: isMobile ? 'rgba(255,255,255,0.75)' : BRAND_COLORS.primary }}
              >
                Acceso al portal
              </span>
              <div
                className="h-px flex-1"
                style={{
                  background: isMobile
                    ? 'linear-gradient(to left, transparent, rgba(255,255,255,0.35))'
                    : `linear-gradient(to left, transparent, ${BRAND_COLORS.primary}40)`,
                }}
              />
            </div>

            {/* Heading */}
            <h1
              className="font-display font-bold leading-tight mb-2"
              style={{ fontSize: '2rem', color: isMobile ? '#fff' : '#0f172a' }}
            >
              Bienvenido
            </h1>
            <p
              className="text-sm mb-7 leading-relaxed"
              style={{ color: isMobile ? 'rgba(255,255,255,0.65)' : '#94a3b8' }}
            >
              Selecciona tu rol para acceder al portal residencial de Las Palomas.
            </p>

            {/* Role cards */}
            <RoleCards onLogin={onLogin} users={DEFAULT_USERS} glass={isMobile} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 md:px-8 lg:px-12 pb-6 flex-shrink-0 text-center md:hidden">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © 2026 Condominios Las Palomas
          </p>
        </div>
        <div className="hidden md:block px-8 lg:px-12 pb-7 flex-shrink-0 text-center">
          <p className="text-[11px] text-slate-400">
            © 2026 Condominios Las Palomas · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
export default LoginScreen
