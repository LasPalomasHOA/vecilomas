import { useState } from 'react'
import type { AuthUser, UserRole } from '@/types'
import { MOCK_USERS } from '@/data/mockData'
import Ico from '@/components/common/Icons'

interface LoginFormProps {
  role: UserRole
  onBack: () => void
  onLogin: (u: AuthUser) => void
}

const ROLE_DETAILS: Record<
  UserRole,
  {
    title: string
    subtitle: string
    badge: string
    color: string
    gradient: string
    defaultEmail: string
    defaultPass: string
    quickUsers: { name: string; email: string; unit?: string; role: UserRole }[]
  }
> = {
  resident: {
    title: 'Portal de Residentes',
    subtitle: 'Ingresa con tu correo o número de departamento',
    badge: 'Residente / Inquilino',
    color: '#008080',
    gradient: 'from-teal-600 to-emerald-700',
    defaultEmail: 'carlos.mendoza@email.com',
    defaultPass: 'vecino123',
    quickUsers: [
      { name: 'Carlos Mendoza Ruiz', email: 'carlos.mendoza@email.com', unit: 'A-101', role: 'resident' },
      { name: 'Patricia Vega Soto', email: 'p.vega@email.com', unit: 'A-102', role: 'resident' },
    ],
  },
  admin: {
    title: 'Administración HOA',
    subtitle: 'Acceso para miembros de la Mesa Directiva y Staff',
    badge: 'Mesa Directiva & Staff',
    color: '#6366f1',
    gradient: 'from-indigo-600 to-violet-700',
    defaultEmail: 'admin@laspalomas.mx',
    defaultPass: 'admin123',
    quickUsers: [
      { name: 'Administrador General', email: 'admin@laspalomas.mx', role: 'admin' },
    ],
  },
  security: {
    title: 'Caseta de Seguridad',
    subtitle: 'Acceso a tablet de validación de QR y bitácora',
    badge: 'Control de Caseta',
    color: '#0f766e',
    gradient: 'from-emerald-700 to-teal-900',
    defaultEmail: 'guardia01',
    defaultPass: 'guardia123',
    quickUsers: [
      { name: 'Jorge Hernández (Guardia 1)', email: 'guardia01', role: 'security' },
    ],
  },
}

export function LoginForm({ role, onBack, onLogin }: LoginFormProps) {
  const config = ROLE_DETAILS[role]
  const [email, setEmail] = useState(config.defaultEmail)
  const [password, setPassword] = useState(config.defaultPass)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    setTimeout(() => {
      // Find matching mock user or fallback
      const found = Object.values(MOCK_USERS).find(
        m => m.user.email.toLowerCase() === email.toLowerCase() || (m.user.unit && m.user.unit.toLowerCase() === email.toLowerCase())
      )

      if (found) {
        onLogin(found.user)
      } else {
        // Create custom session with chosen role
        const fallbackUser: AuthUser = {
          role,
          name: email.split('@')[0] || 'Usuario',
          email,
          initials: (email[0] || 'U').toUpperCase(),
          unit: role === 'resident' ? 'A-101' : undefined,
        }
        onLogin(fallbackUser)
      }
      setLoading(false)
    }, 450)
  }

  function handleSelectQuickUser(u: { name: string; email: string; unit?: string; role: UserRole }) {
    setEmail(u.email)
    setPassword(config.defaultPass)
    setError(null)
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Top back button & role pill */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer"
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
        <h3 className="font-display font-extrabold text-2xl text-slate-900 leading-tight">
          {config.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {config.subtitle}
        </p>
      </div>

      {/* Quick Demo selector */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Ico n="tag" c="w-3 h-3 text-slate-500" />
          <span>Cuentas de demostración disponibles:</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {config.quickUsers.map(qu => {
            const isSelected = email === qu.email
            return (
              <button
                key={qu.email}
                type="button"
                onClick={() => handleSelectQuickUser(qu)}
                className={`text-xs py-1 px-2.5 rounded-lg font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-teal-600 shadow-sm font-semibold ring-1 ring-teal-600/30'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                }`}
              >
                {qu.name} {qu.unit ? `(${qu.unit})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {role === 'security' ? 'ID o Usuario de Caseta' : 'Correo Electrónico / Unidad'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={role === 'security' ? 'guardia01' : 'tu-correo@ejemplo.com'}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all font-medium pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
            <span>Ingresando al portal...</span>
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
