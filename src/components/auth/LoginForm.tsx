import { useState } from 'react'
import type { AuthUser, UserRole } from '@/types'
import Ico from '@/components/common/Icons'
import { authenticateUser } from '@/services/authService'

interface LoginFormProps {
  role: UserRole
  onBack: () => void
  onLogin: (u: AuthUser) => void
  glass?: boolean
}

const ROLE_DETAILS: Record<
  UserRole,
  {
    title: string
    subtitle: string
    badge: string
    color: string
    glowColor: string
    ringColor: string
    iconName: 'home' | 'building' | 'shield'
  }
> = {
  resident: {
    title: 'Portal de Residentes',
    subtitle: 'Ingresa con tu correo o número de departamento',
    badge: 'Residente / Inquilino',
    color: '#008080',
    glowColor: 'rgba(0, 128, 128, 0.28)',
    ringColor: 'focus:ring-teal-500/25 focus:border-teal-600',
    iconName: 'home',
  },
  admin: {
    title: 'Administración HOA',
    subtitle: 'Acceso para miembros de la Mesa Directiva y Staff',
    badge: 'Mesa Directiva & Staff',
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.28)',
    ringColor: 'focus:ring-indigo-500/25 focus:border-indigo-600',
    iconName: 'building',
  },
  security: {
    title: 'Caseta de Seguridad',
    subtitle: 'Acceso a validación de QR y bitácora de accesos',
    badge: 'Control de Caseta',
    color: '#0f766e',
    glowColor: 'rgba(15, 118, 110, 0.28)',
    ringColor: 'focus:ring-emerald-500/25 focus:border-emerald-600',
    iconName: 'shield',
  },
}

export function LoginForm({ role, onBack, onLogin, glass = false }: LoginFormProps) {
  const config = ROLE_DETAILS[role]

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authenticateUser(identifier, password, role)

      if (!result.success || !result.user) {
        setError(result.error || 'Credenciales inválidas. Por favor verifica tus datos.')
        setLoading(false)
        return
      }

      onLogin(result.user)
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con el servidor de autenticación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`animate-fade-in space-y-6 ${
        glass
          ? 'p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]'
          : 'p-2'
      }`}
    >
      {/* Top back button & role pill */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className={`group flex items-center gap-2 text-xs font-bold transition-all py-1.5 px-3 rounded-xl cursor-pointer ${
            glass
              ? 'text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/60'
          }`}
        >
          <Ico n="arrowLeft" c="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver a roles</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white shadow-xs flex items-center gap-1.5"
            style={{ backgroundColor: config.color }}
          >
            <Ico n={config.iconName} c="w-3 h-3" />
            <span>{config.badge}</span>
          </span>
        </div>
      </div>

      {/* Header Title & Subtitle */}
      <div>
        <h3
          className={`font-display font-black text-2xl sm:text-3xl leading-tight tracking-tight ${
            glass ? 'text-white' : 'text-slate-900'
          }`}
        >
          {config.title}
        </h3>
        <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${glass ? 'text-white/75' : 'text-slate-500'}`}>
          {config.subtitle}
        </p>
      </div>

      {/* Error Banner with High-Contrast Design */}
      {error && (
        <div
          role="alert"
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3 animate-shake ${
            glass
              ? 'bg-rose-950/85 backdrop-blur-md border-rose-500/50 text-rose-100 shadow-[0_4px_20px_rgba(225,29,72,0.25)]'
              : 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-sm'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Ico n="alertTriangle" c="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-black uppercase tracking-wider ${glass ? 'text-rose-300' : 'text-rose-800'}`}>
              Acceso Denegado
            </p>
            <p className={`text-xs mt-0.5 font-medium leading-snug ${glass ? 'text-rose-100' : 'text-rose-900'}`}>
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              glass ? 'text-rose-300 hover:text-white hover:bg-white/10' : 'text-rose-400 hover:text-rose-800 hover:bg-rose-100'
            }`}
            title="Cerrar aviso"
          >
            <Ico n="x" c="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Input */}
        <div>
          <label
            className={`block text-xs font-bold mb-1.5 tracking-wide ${
              glass ? 'text-white/90' : 'text-slate-700'
            }`}
          >
            {role === 'security'
              ? 'Usuario de Caseta o Correo'
              : role === 'resident'
              ? 'Correo Electrónico o Departamento (ej. A-101)'
              : 'Correo Electrónico o Usuario'}
          </label>
          <div className="relative">
            <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              glass ? 'text-white/50' : 'text-slate-400'
            }`}>
              <Ico n={role === 'resident' ? 'home' : role === 'security' ? 'shield' : 'user'} c="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value)
                if (error) setError(null)
              }}
              placeholder={
                role === 'security'
                  ? 'caseta@laspalomas.mx o caseta'
                  : role === 'resident'
                  ? 'carlos.mendoza@email.com o A-101'
                  : 'admin@laspalomas.mx'
              }
              className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-sm transition-all duration-200 font-medium focus:outline-none ${
                glass
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white focus:bg-white/18 focus:ring-4 focus:ring-white/15'
                  : `bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 ${config.ringColor} shadow-2xs`
              }`}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className={`block text-xs font-bold tracking-wide ${
                glass ? 'text-white/90' : 'text-slate-700'
              }`}
            >
              Contraseña
            </label>
          </div>
          <div className="relative">
            <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              glass ? 'text-white/50' : 'text-slate-400'
            }`}>
              <Ico n="lock" c="w-4 h-4" />
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              placeholder="••••••••••••"
              className={`w-full pl-10 pr-11 py-3 border rounded-2xl text-sm transition-all duration-200 font-medium focus:outline-none ${
                glass
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white focus:bg-white/18 focus:ring-4 focus:ring-white/15'
                  : `bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 ${config.ringColor} shadow-2xs`
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg transition-colors ${
                glass ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              <Ico n={showPass ? 'eyeOff' : 'eye'} c="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 px-5 rounded-2xl text-white font-display font-extrabold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer mt-2 ${
            loading
              ? 'opacity-80 cursor-wait'
              : 'hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]'
          }`}
          style={{
            backgroundColor: config.color,
            boxShadow: `0 8px 24px -4px ${config.glowColor}`,
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Verificando en base de datos...</span>
            </div>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <Ico n="arrowLeft" c="w-4 h-4 rotate-180" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
export default LoginForm
