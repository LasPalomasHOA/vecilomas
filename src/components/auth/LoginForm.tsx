import { useState } from 'react'
import type { AuthUser, UserRole } from '@/types'
import Ico from '@/components/common/Icons'
import { authenticateUser, getDemoAccountsForRole, type UserAccount } from '@/services/authService'

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
  const demoAccounts = getDemoAccountsForRole(role)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)

  function fillDemoAccount(account: UserAccount) {
    setIdentifier(account.email)
    setPassword(account.displayPassword)
    setSelectedDemoId(account.id)
    setError(null)
  }

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
          <div className="p-3 bg-red-500/15 border border-red-500/35 rounded-xl text-xs text-red-600 dark:text-red-200 font-medium flex items-start gap-2 animate-shake">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${
              glass ? 'text-white/90' : 'text-slate-700'
            }`}
          >
            {role === 'security'
              ? 'Usuario o Identificador de Caseta'
              : role === 'resident'
              ? 'Correo Electrónico o Departamento (ej. A-101)'
              : 'Correo Electrónico o Usuario'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value)
                setSelectedDemoId(null)
                if (error) setError(null)
              }}
              placeholder={
                role === 'security'
                  ? 'caseta@laspalomas.mx o caseta_norte'
                  : role === 'resident'
                  ? 'carlos.mendoza@email.com o A-101'
                  : 'admin@laspalomas.mx'
              }
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
              onChange={e => {
                setPassword(e.target.value)
                setSelectedDemoId(null)
                if (error) setError(null)
              }}
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
            <span>Validando credenciales...</span>
          ) : (
            <>
              <span>Iniciar Sesión como {config.badge}</span>
              <Ico n="arrowLeft" c="w-4 h-4 rotate-180" />
            </>
          )}
        </button>
      </form>

      {/* Demo Quick-Fill Accounts */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
            glass ? 'text-teal-200/80' : 'text-slate-500'
          }`}>
            Cuentas registradas para prueba:
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {demoAccounts.map(account => {
            const isSelected = selectedDemoId === account.id
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => fillDemoAccount(account)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  glass
                    ? isSelected
                      ? 'bg-white/25 border-white/40 text-white shadow-sm'
                      : 'bg-white/10 hover:bg-white/18 border-white/15 text-white/90'
                    : isSelected
                    ? 'bg-teal-50/90 border-teal-300 text-teal-950 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{account.name}</span>
                    {account.unit && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-100/80 text-teal-800 shrink-0">
                        {account.unit}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] font-mono truncate mt-0.5 ${
                    glass ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {account.email} · Clave: <span className="font-semibold text-teal-600 dark:text-teal-300">{account.displayPassword}</span>
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-tight ${
                  isSelected
                    ? 'bg-[#008080] text-white'
                    : glass
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700'
                }`}>
                  {isSelected ? 'Cargado ✓' : 'Usar'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default LoginForm
