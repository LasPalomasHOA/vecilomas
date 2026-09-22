import { useState } from 'react'
import type { UserRole } from '@/types'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'
import { generateSecurePassword } from '@/utils/passwordGenerator'

const ROLES_OVERVIEW: {
  role: UserRole
  title: string
  color: string
  bgLight: string
  desc: string
  features: string[]
}[] = [
  {
    role: 'admin',
    title: 'Administrador HOA',
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    desc: 'Acceso total y gobierno de la plataforma',
    features: [
      'Gestión de propiedades, propietarios e inquilinos',
      'Configuración de amenidades y aprobación de reservas',
      'Control financiero de cuotas y estados de cuenta',
      'Publicación de avisos oficiales y subida de documentos',
      'Supervisión de caseta y bitácora en tiempo real',
      'Asignación y seguimiento de tickets de mantenimiento',
    ],
  },
  {
    role: 'resident',
    title: 'Residente / Inquilino',
    color: 'text-teal-600',
    bgLight: 'bg-teal-50 text-teal-600 border border-teal-100',
    desc: 'Portal de autoservicio para el condómino',
    features: [
      'Generación de pases QR para invitados con vigencia',
      'Reservación de amenidades y calendario interactivo',
      'Consulta de estado de cuenta e historial de pagos',
      'Reporte de fallas e incidencias en áreas comunes',
      'Lectura de comunicados y descarga de reglamentos',
    ],
  },
  {
    role: 'security',
    title: 'Personal de Caseta / Seguridad',
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    desc: 'Operación ágil para control de accesos',
    features: [
      'Escáner y verificación rápida de códigos QR',
      'Registro de ingresos y salidas en bitácora digital',
      'Identificación de anfitrión, unidad y vehículo',
      'Alerta inmediata en códigos inválidos o expirados',
    ],
  },
]

export function UserRoleControl() {
  const { userPermissions, addUserPermission, deleteUserPermission } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'admin' as UserRole,
    unit: '',
    password: '',
  })

  function handleOpenModal() {
    const initialPass = generateSecurePassword('LP-', 10)
    setForm({
      name: '',
      email: '',
      role: 'admin',
      unit: '',
      password: initialPass,
    })
    setShowPassword(true)
    setModalOpen(true)
  }

  function handleGeneratePassword() {
    const newPass = generateSecurePassword('LP-', 10)
    setForm(f => ({ ...f, password: newPass }))
    setShowPassword(true)
    setToastMessage(`⚡ Contraseña generada: "${newPass}"`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  function handleCopyPassword() {
    if (!form.password) return
    navigator.clipboard.writeText(form.password)
    setCopiedPass(true)
    setToastMessage('✓ Contraseña copiada al portapapeles.')
    setTimeout(() => {
      setCopiedPass(false)
      setToastMessage(null)
    }, 3000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) return

    setSaving(true)
    const roleConfig = ROLES_OVERVIEW.find(r => r.role === form.role)

    try {
      await addUserPermission({
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password,
        unit: form.role === 'resident' ? form.unit || 'A-101' : undefined,
        status: 'Activo',
        permissions: roleConfig?.features.slice(0, 3) || ['Acceso general'],
      })
      setToastMessage(`✓ Usuario "${form.name}" con rol "${form.role}" registrado en PostgreSQL.`)
      setTimeout(() => setToastMessage(null), 4500)
      setModalOpen(false)
      setForm({ name: '', email: '', role: 'admin', unit: '', password: '' })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Ico n="check" c="w-5 h-5 text-teal-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 Role Definition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES_OVERVIEW.map(r => (
          <GCard key={r.role} className="hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${r.bgLight}`}
              >
                <Ico n={r.role === 'admin' ? 'building' : r.role === 'resident' ? 'home' : 'shield'} c="w-5 h-5" />
              </span>
              <Badge text={r.role} />
            </div>
            <h4 className="font-display font-semibold text-slate-900 text-lg">{r.title}</h4>
            <p className="text-xs text-slate-500 mb-4">{r.desc}</p>
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Permisos Principales:
              </p>
              {r.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <Ico n="check" c="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </GCard>
        ))}
      </div>

      {/* User Accounts Table */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-lg">
              Usuarios y Credenciales del Sistema
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Niveles de acceso y roles asignados a administradores, condóminos y guardias sincronizados con PostgreSQL.
            </p>
          </div>
          <Btn onClick={handleOpenModal} className="shrink-0 whitespace-nowrap font-semibold shadow-xs">
            <Ico n="plus" c="w-4 h-4" />
            Asignar Nuevo Rol
          </Btn>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['ID', 'Nombre', 'Correo / Usuario', 'Rol Asignado', 'Unidad', 'Estatus', 'Permisos', 'Acción'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userPermissions.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400 font-semibold whitespace-nowrap">{u.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{u.name}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{u.email}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge text={u.role} />
                  </td>
                  <td className="px-5 py-3.5 font-display text-xs text-teal-700 font-bold whitespace-nowrap">{u.unit || '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge text={u.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate whitespace-nowrap">
                    {Array.isArray(u.permissions) ? u.permissions.join(', ') : ''}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button
                      onClick={() => deleteUserPermission(u.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar rol"
                    >
                      <Ico n="trash" c="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Acceso de Usuario"
        subtitle="Otorga credenciales con nivel de acceso diferenciado y contraseña encriptada en PostgreSQL."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Nombre Completo *
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Lic. Roberto Gómez"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Correo Electrónico / Identificador *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="roberto.gomez@laspalomas.mx"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Nivel de Acceso / Rol *
              </label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-semibold text-slate-800"
              >
                <option value="admin">Administrador HOA (Control Total)</option>
                <option value="security">Personal de Seguridad / Caseta</option>
                <option value="resident">Residente / Inquilino</option>
              </select>
            </div>
            {form.role === 'resident' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                  Unidad Asignada
                </label>
                <input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="Ej. B-201"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Sección de Contraseña */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Ico n="shield" c="w-4 h-4 text-teal-600" />
                <span>Contraseña de Acceso</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-100 hover:bg-teal-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                title="Genera una clave aleatoria que empieza con LP-"
              >
                <span>⚡ Generar (LP-...)</span>
              </button>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Ej. LP-8xK9m2Q"
                  className="w-full pl-3.5 pr-20 py-2.5 text-sm rounded-xl bg-white border border-slate-200 focus:border-teal-500 focus:outline-none transition-all font-mono font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>

              {form.password && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    copiedPass
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                  title="Copiar contraseña"
                >
                  <Ico n="check" c={`w-3.5 h-3.5 ${copiedPass ? 'text-white' : 'text-slate-500'}`} />
                  <span>{copiedPass ? 'Copiada' : 'Copiar'}</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              El usuario podrá iniciar sesión con su correo (<span className="text-teal-700 font-bold">{form.email || 'correo@ejemplo.com'}</span>) seleccionando el rol correspondiente.
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" disabled={saving} className="flex-1 font-bold">
              {saving ? 'Guardando en BD...' : 'Crear Usuario y Guardar'}
            </Btn>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default UserRoleControl

