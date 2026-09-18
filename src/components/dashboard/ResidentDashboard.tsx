import { useState } from 'react'
import type { AuthUser, Module } from '@/types'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import Modal from '@/components/common/Modal'
import loginImg0 from '@/imports/image.png'

interface ResidentDashboardProps {
  user: AuthUser
  onNav: (m: Module) => void
}

export function ResidentDashboard({ user, onNav }: ResidentDashboardProps) {
  const { fees, bookings, tickets, notices, accessPasses, addAccessPass } = useData()
  const [showExpressQR, setShowExpressQR] = useState(false)
  const [expressVisitor, setExpressVisitor] = useState('')
  const [expressType, setExpressType] = useState<'delivery' | 'visit'>('delivery')
  const [createdExpressCode, setCreatedExpressCode] = useState<string | null>(null)
  const [showContactsModal, setShowContactsModal] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const myFee = fees.find(f => f.unit === user.unit)
  const myBookings = bookings.filter(
    b =>
      (b.unit === user.unit ||
        b.resident.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())) &&
      b.status !== 'Cancelada'
  )
  const myTickets = tickets.filter(
    t =>
      t.reporter.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
      t.unit === user.unit
  )
  const myPasses = accessPasses.filter(
    p =>
      (p.unit === user.unit ||
        p.host.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())) &&
      p.status === 'Activo'
  )
  const firstName = user.name.split(' ')[0]

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const stats = [
    {
      label: 'Estado de Cuenta',
      value: myFee?.status === 'Pagada' ? 'Al Corriente' : 'Adeudo',
      sub: myFee?.status === 'Pagada' ? 'Cuota liquidada sin recargos' : `$${myFee?.amount.toLocaleString()} por liquidar`,
      badge: myFee?.status === 'Pagada' ? 'Sin Adeudo' : 'Vencido',
      badgeStyle: myFee?.status === 'Pagada' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-red-50 text-red-800 border-red-200/80',
      icon: <Ico n="creditCard" c="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />,
      iconBoxStyle: 'bg-emerald-50 border-emerald-200/80 text-emerald-800 shadow-2xs',
      accentColor: '#059669',
      onClick: () => onNav('myaccount'),
    },
    {
      label: 'Pases de Visita',
      value: String(myPasses.length),
      sub: myPasses.length > 0 ? `Último: ${myPasses[0].visitor}` : 'Sin visitas activas',
      badge: myPasses.length > 0 ? `${myPasses.length} Activo(s)` : 'Disponible',
      badgeStyle: myPasses.length > 0 ? 'bg-teal-50 text-teal-800 border-teal-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="qr" c="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />,
      iconBoxStyle: 'bg-teal-50 border-teal-200/80 text-teal-800 shadow-2xs',
      accentColor: '#008080',
      onClick: () => onNav('qr'),
    },
    {
      label: 'Reservaciones',
      value: String(myBookings.length),
      sub: myBookings.length > 0 ? `${myBookings[0]?.amenity}` : 'Espacios libres hoy',
      badge: myBookings.length > 0 ? 'Agendada' : 'Disponible',
      badgeStyle: myBookings.length > 0 ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="calendar" c="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700" />,
      iconBoxStyle: 'bg-indigo-50 border-indigo-200/80 text-indigo-800 shadow-2xs',
      accentColor: '#6366f1',
      onClick: () => onNav('res-amenities'),
    },
    {
      label: 'Reportes de Servicio',
      value: String(myTickets.filter(t => t.status !== 'Resuelto').length),
      sub: myTickets.length > 0 ? 'Personal asignado' : 'Todo en orden',
      badge: myTickets.some(t => t.priority === 'Alta') ? 'En Atención' : 'Al día',
      badgeStyle: myTickets.some(t => t.priority === 'Alta') ? 'bg-amber-50 text-amber-800 border-amber-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="tool" c="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />,
      iconBoxStyle: 'bg-amber-50 border-amber-200/80 text-amber-800 shadow-2xs',
      accentColor: '#d97706',
      onClick: () => onNav('myaccount-tickets'),
    },
  ]

  const quickActions = [
    {
      label: 'Generar Pase QR',
      m: 'qr' as Module,
      desc: 'Invitaciones digitales para visitantes y familiares',
      icon: <Ico n="qr" c="w-5 h-5 text-[#008080]" />,
      iconBoxStyle: 'bg-teal-50 border-teal-200/80 text-teal-800',
      accentColor: '#008080',
    },
    {
      label: 'Reservar Amenidad',
      m: 'res-amenities' as Module,
      desc: 'Albercas, canchas de tenis, asadores y salón',
      icon: <Ico n="calendar" c="w-5 h-5 text-indigo-600" />,
      iconBoxStyle: 'bg-indigo-50 border-indigo-200/80 text-indigo-800',
      accentColor: '#6366f1',
    },
    {
      label: 'Reportar Falla o Servicio',
      m: 'myaccount-tickets' as Module,
      desc: 'Mantenimiento preventivo e incidencias en condominio',
      icon: <Ico n="tool" c="w-5 h-5 text-amber-600" />,
      iconBoxStyle: 'bg-amber-50 border-amber-200/80 text-amber-800',
      accentColor: '#f59e0b',
    },
    {
      label: 'Estado de Cuenta y Pago SPEI',
      m: 'myaccount' as Module,
      desc: 'Historial de pagos, recibos fiscales y CLABE interbancaria',
      icon: <Ico n="creditCard" c="w-5 h-5 text-emerald-600" />,
      iconBoxStyle: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
      accentColor: '#10b981',
    },
  ]

  function handleCreateExpressQR(e: React.FormEvent) {
    e.preventDefault()
    const name = expressVisitor.trim() || (expressType === 'delivery' ? 'Repartidor / Uber Eats' : 'Visita Express')
    const code = `LP-${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date()
    const validDate = now.toISOString().split('T')[0]
    const validTime = `${String(now.getHours() + 2).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    addAccessPass({
      code,
      visitor: name,
      host: user.name,
      unit: user.unit || 'A-101',
      validDate,
      validTime,
      status: 'Activo',
      visitType: expressType === 'delivery' ? 'Proveedor' : 'Visita',
      vehiclePlate: '',
    })

    setCreatedExpressCode(code)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 3000)
  }

  function handleShareWhatsApp(code: string) {
    const text = `¡Hola! Te comparto tu Pase de Acceso Rápido para Las Palomas Resort:\n\nCódigo de Caseta: ${code}\nUnidad: ${user.unit || 'A-101'} (${user.name})\nVálido para hoy por caseta principal.`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Cinematic Hero Banner */}
      <div
        className="rounded-2xl relative overflow-hidden shadow-md border border-teal-900/30"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 51, 51, 0.97) 0%, rgba(0, 76, 76, 0.92) 50%, rgba(15, 23, 42, 0.96) 100%)',
        }}
      >
        {/* Coastal Background Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <img
            src={loginImg0}
            alt="Las Palomas Resort"
            className="w-full h-full object-cover filter blur-[4px] opacity-30"
          />
        </div>

        {/* Ambient Highlights */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            {/* Top Bar: Weather & Resort Badge */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold text-teal-200 bg-teal-950/70 border border-teal-400/30 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Residencial Las Palomas
              </span>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-200 bg-white/10 border border-white/15 backdrop-blur-md">
                <Ico n="sun" c="w-3.5 h-3.5 text-amber-300" />
                <span>Puerto Peñasco · 28°C Soleado</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-tight truncate">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm mt-1 text-slate-200/90 font-normal max-w-xl leading-relaxed">
              Administra tus accesos, amenidades y pagos residenciales desde tu panel central.
            </p>

            <div className="flex items-center gap-2.5 mt-3 sm:mt-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-xs">
                <Ico n="home" c="w-3.5 h-3.5 text-teal-300" />
                <span>Unidad: <strong className="font-extrabold text-white">{user.unit || 'A-101'}</strong></span>
              </div>

              {myFee && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold backdrop-blur-md border whitespace-nowrap shadow-xs ${
                    myFee.status === 'Pagada'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                      : 'bg-red-500/20 text-red-200 border-red-400/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      myFee.status === 'Pagada' ? 'bg-emerald-300' : 'bg-red-400'
                    }`}
                  />
                  Cuota: {myFee.status}
                </div>
              )}

              {/* Express 1-Click QR Button */}
              <button
                onClick={() => {
                  setCreatedExpressCode(null)
                  setExpressVisitor('')
                  setShowExpressQR(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-teal-500 text-teal-950 font-bold text-[11px] sm:text-xs shadow-sm hover:bg-teal-400 active:scale-95 transition-all cursor-pointer"
              >
                <Ico n="qr" c="w-3.5 h-3.5 text-teal-950" />
                <span>+ Pase Express (1-Clic)</span>
              </button>
            </div>
          </div>

          {/* Desktop Right Side: Contacts & Notice Badge */}
          <div className="hidden md:flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowContactsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
                <Ico n="phone" c="w-3.5 h-3.5 text-teal-300" />
                <span>Directorio de Caseta</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">Seguridad 24/7 y Concierge</p>
            </button>

            <button
              onClick={() => onNav('notices')}
              className="p-3 rounded-xl bg-black/25 hover:bg-black/35 border border-white/15 backdrop-blur-md text-center transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-mono text-teal-300 uppercase font-semibold">Comunicados</p>
                  <p className="text-xs text-slate-300">Vigentes hoy</p>
                </div>
                <span className="text-xl font-display font-extrabold text-white font-mono bg-teal-900/60 px-2 py-0.5 rounded-lg border border-teal-500/30">
                  {notices.length}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Symmetrical 2x2 KPI Cards on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            onClick={s.onClick}
            className="p-3.5 sm:p-5 rounded-2xl bg-white border border-teal-950/[0.08] shadow-[0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)] hover:shadow-[0_12px_28px_rgba(0,51,51,0.08)] hover:border-teal-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-[0.98]"
          >
            <div
              className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ backgroundColor: s.accentColor }}
            />

            <div>
              <div className="flex items-center justify-between gap-1 mb-2.5 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${s.iconBoxStyle}`}>
                  {s.icon}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 max-w-[85px] sm:max-w-none truncate ${s.badgeStyle}`}>
                  {s.badge}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate leading-tight">
                {s.label}
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-display font-extrabold text-slate-900 mt-0.5 tracking-tight truncate leading-tight">
                {s.value}
              </p>
            </div>

            <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 group-hover:text-[#008080] transition-colors">
              <span className="font-medium truncate">{s.sub}</span>
              <span className="font-bold group-hover:translate-x-1 transition-transform shrink-0 ml-1">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Notice Board + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Notices Board */}
        <GCard className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-teal-950/[0.06] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#008080]" />
                <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Tablón de Avisos y Comunicados
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Noticias y circulares emitidas por la administración</p>
            </div>
            <button
              onClick={() => onNav('notices')}
              className="text-xs font-bold text-[#008080] hover:text-[#004c4c] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap self-start sm:self-auto shrink-0 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 hover:bg-teal-100/60"
            >
              Ver todos ({notices.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.slice(0, 3).map(n => (
              <div
                key={n.id}
                onClick={() => onNav('notices')}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  n.urgent
                    ? 'bg-red-50/60 border-red-200/80 hover:bg-white hover:shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/70 hover:bg-white hover:border-teal-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <Badge text={n.type} />
                    {n.urgent && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.2 rounded-full whitespace-nowrap shrink-0">
                        Aviso Urgente
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap shrink-0">{n.date}</span>
                </div>

                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {n.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        </GCard>

        {/* Quick Actions */}
        <GCard>
          <div className="mb-4 pb-3 border-b border-teal-950/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                Autoservicio Rápido
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Accesos directos para residentes</p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={() => onNav(qa.m)}
                className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-teal-500/40 hover:shadow-sm focus:outline-none group cursor-pointer relative overflow-hidden active:scale-[0.99]"
              >
                <div
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: qa.accentColor }}
                />

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${qa.iconBoxStyle}`}
                >
                  {qa.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm group-hover:text-[#008080] leading-snug truncate">
                    {qa.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate font-normal">
                    {qa.desc}
                  </p>
                </div>
                <Ico
                  n="chevron"
                  c="w-4 h-4 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-1 transition-all shrink-0"
                />
              </button>
            ))}
          </div>

          {/* Direct Emergency Call Button */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowContactsModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold hover:bg-teal-100/70 transition-colors cursor-pointer"
            >
              <Ico n="phone" c="w-3.5 h-3.5 text-teal-700" />
              <span>Teléfonos de Caseta y Seguridad 24/7</span>
            </button>
          </div>
        </GCard>
      </div>

      {/* Modal: Express 1-Click QR */}
      <Modal
        isOpen={showExpressQR}
        onClose={() => setShowExpressQR(false)}
        maxWidth="max-w-md"
        title="Pase Rápido de Caseta"
        subtitle="Vigencia automática de 2 horas para hoy"
      >
        {createdExpressCode ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-center">
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Código de Acceso Digital</p>
              <p className="text-3xl font-mono font-black text-teal-950 my-2 tracking-widest">{createdExpressCode}</p>
              <p className="text-xs text-teal-700">Unidad {user.unit || 'A-101'} · Válido para caseta de entrada</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCopy(createdExpressCode)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Ico n="copy" c="w-4 h-4" />
                <span>{copiedText === createdExpressCode ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(createdExpressCode)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Ico n="whatsapp" c="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => setShowExpressQR(false)}
              className="w-full py-2.5 text-center text-slate-500 text-xs font-semibold hover:text-slate-800 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateExpressQR} className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setExpressType('delivery')
                  setExpressVisitor('Repartidor / Uber Eats')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  expressType === 'delivery'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛵 Repartidor / Delivery
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpressType('visit')
                  setExpressVisitor('')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  expressType === 'visit'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚗 Visita / Familiar
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre o Empresa del Visitante</label>
              <input
                type="text"
                required
                value={expressVisitor}
                onChange={e => setExpressVisitor(e.target.value)}
                placeholder={expressType === 'delivery' ? 'Ej. Uber Eats / Amazon / Didi' : 'Ej. Juan Pérez'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-600 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Unidad anfitriona:</span>
                <strong className="text-slate-800">{user.unit || 'A-101'} ({user.name})</strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Vigencia estimada:</span>
                <strong className="text-teal-700">Hoy (2 horas a partir de ahora)</strong>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpressQR(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Generar Pase Ahora
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Directory / Caseta Contacts */}
      <Modal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        maxWidth="max-w-md"
        title="Directorio de Atención"
        subtitle="Contactos oficiales de Las Palomas Resort"
      >
        <div className="space-y-3 py-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Caseta Principal (Seguridad 24/7)</p>
              <p className="text-xs text-slate-500">Control vehicular y pases de acceso</p>
            </div>
            <a
              href="tel:+526383828000"
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Ico n="phone" c="w-3.5 h-3.5" />
              <span>Ext. 101</span>
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Administración HOA / Concierge</p>
              <p className="text-xs text-slate-500">Cuotas, estados de cuenta y trámites</p>
            </div>
            <a
              href="tel:+526383828000"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Ico n="phone" c="w-3.5 h-3.5" />
              <span>Ext. 200</span>
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Mantenimiento de Guardia</p>
              <p className="text-xs text-slate-500">Fallas de agua, elevadores o electricidad</p>
            </div>
            <a
              href="tel:+526383828000"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Ico n="phone" c="w-3.5 h-3.5" />
              <span>Ext. 300</span>
            </a>
          </div>
        </div>

        <button
          onClick={() => setShowContactsModal(false)}
          className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          Cerrar Directorio
        </button>
      </Modal>
    </div>
  )
}

export default ResidentDashboard
