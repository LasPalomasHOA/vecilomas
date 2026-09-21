import { useState } from 'react'
import type { AuthUser, UserRole } from '@/types'
import Ico from '@/components/common/Icons'

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
    gradient: string
  }
> = {
  resident: {
    title: 'Portal de Residentes',
    subtitle: 'Ingresa con tu correo o número de departamento',
    badge: 'Residente / Inquilino',
    color: '#008080',
    gradient: 'from-teal-600 to-emerald-700',
  },
  admin: {
    title: 'Administración HOA',
    subtitle: 'Acceso para miembros de la Mesa Directiva y Staff',
    badge: 'Mesa Directiva & Staff',
    color: '#6366f1',
    gradient: 'from-indigo-600 to-violet-700',
  },
  security: {
    title: 'Caseta de Seguridad',
    subtitle: 'Acceso a validación de QR y bitácora de accesos',
    badge: 'Control de Caseta',
    color: '#0f766e',
    gradient: 'from-emerald-700 to-teal-900',
  },
}

export function LoginForm({ role, onBack, onLogin, glass = false }: LoginFormProps) {
  const config = ROLE_DETAILS[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    setTimeout(() => {
      const fallbackUser: AuthUser = {
        role,
        name: email.split('@')[0] || (role === 'admin' ? 'Administrador' : role === 'security' ? 'Guardia' : 'Residente'),
        email,
        initials: (email[0] || 'U').toUpperCase(),
        unit: role === 'resident' ? (email.includes('-') ? email : '101') : undefined,
      }
      onLogin(fallbackUser)
      setLoading(false)
    }, 200)
  }

  return (
    <div
      className={`animate-fade-in space-y-5 ${
        glass
          ? 'p-6 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/20 text-white shadow-2xl'
          : ''
      }`}
    >
      {/* Top back button & role pill */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2.5 rounded-lg cursor-pointer ${
            glass
              ? 'text-white/80 hover:text-white bg-white/10 hover:bg-white/20'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Ico n="arrowLeft" c="w-3.5 h-3.5" />
          <span>Volver a roles</span>
        </button>

        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-white shadow-sm"
          style={{ backgroundColor: config.color }}
        >
          {config.badge}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3
          className={`font-display font-extrabold text-2xl leading-tight ${
            glass ? 'text-white' : 'text-slate-900'
          }`}
        >
          {config.title}
        </h3>
        <p className={`text-xs mt-1 ${glass ? 'text-white/70' : 'text-slate-500'}`}>
          {config.subtitle}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 font-medium">
            {error}
          </div>
        )}

        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${
              glass ? 'text-white/90' : 'text-slate-700'
            }`}
          >
            {role === 'security' ? 'Usuario o Identificador de Caseta' : 'Correo Electrónico / Unidad'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={role === 'security' ? 'caseta_norte' : 'tu-correo@ejemplo.com'}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all font-medium focus:outline-none ${
                glass
                  ? 'bg-white/15 border-white/25 text-white placeholder-white/50 focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/20'
                  : 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600'
              }`}
            />
          </div>
        </div>

        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${
              glass ? 'text-white/90' : 'text-slate-700'
            }`}
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all font-medium pr-10 focus:outline-none ${
                glass
                  ? 'bg-white/15 border-white/25 text-white placeholder-white/50 focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/20'
                  : 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                glass ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Ico n={showPass ? 'eyeOff' : 'eye'} c="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl text-white font-display font-bold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            loading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]'
          }`}
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}ee 100%)`,
          }}
        >
          {loading ? (
            <span>Ingresando...</span>
          ) : (
            <>
              <span>Iniciar Sesión como {config.badge}</span>
              <Ico n="arrowLeft" c="w-4 h-4 rotate-180" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
export default LoginForm
