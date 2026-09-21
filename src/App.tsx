import { useState } from 'react'
import type { AuthUser, Module, NavItem, UserRole } from '@/types'
import { DataProvider } from '@/context/DataContext'
import AnimatedBg from '@/components/common/AnimatedBg'
import Ico from '@/components/common/Icons'
import LoginScreen from '@/components/auth/LoginScreen'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'

// Dashboards
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import ResidentDashboard from '@/components/dashboard/ResidentDashboard'

// Module A: HOA y Propiedades
import HOAModule from '@/modules/hoa/HOAModule'
import ResidentNoticesView from '@/modules/hoa/ResidentNoticesView'

// Module B: Reservación de Áreas Comunes (Amenidades)
import AmenitiesModule from '@/modules/amenities/AmenitiesModule'
import ResidentAmenitiesView from '@/modules/amenities/ResidentAmenitiesView'

// Module C: Control de Accesos e Invitados (Visitas)
import AccessModule from '@/modules/access/AccessModule'
import ResidentQRView from '@/modules/access/ResidentQRView'
import SecurityCasetaView from '@/modules/access/SecurityCasetaView'

// Module D: Finanzas y Mantenimiento (Soporte Residencial)
import FinanceModule from '@/modules/finance/FinanceModule'
import ResidentMyAccountView from '@/modules/finance/ResidentMyAccountView'

function getNavItems(role: UserRole): NavItem[] {
  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Inicio', shortLabel: 'Inicio', icon: <Ico n="home" c="w-4 h-4" /> },
      { id: 'hoa', label: 'Administración HOA', shortLabel: 'HOA', icon: <Ico n="building" c="w-4 h-4" /> },
      { id: 'amenities', label: 'Amenidades', shortLabel: 'Amenidades', icon: <Ico n="calendar" c="w-4 h-4" /> },
      { id: 'access', label: 'Accesos e Invitados', shortLabel: 'Accesos', icon: <Ico n="shield" c="w-4 h-4" /> },
      { id: 'finance', label: 'Finanzas y Mantenimiento', shortLabel: 'Finanzas', icon: <Ico n="dollar" c="w-4 h-4" /> },
    ]
  }

  if (role === 'resident') {
    return [
      { id: 'res-home', label: 'Inicio', shortLabel: 'Inicio', icon: <Ico n="home" c="w-4 h-4" /> },
      { id: 'notices', label: 'Comunicados', shortLabel: 'Avisos', icon: <Ico n="bell" c="w-4 h-4" /> },
      { id: 'res-amenities', label: 'Amenidades', shortLabel: 'Amenidades', icon: <Ico n="calendar" c="w-4 h-4" /> },
      { id: 'qr', label: 'Pases QR', shortLabel: 'Pases QR', icon: <Ico n="qr" c="w-4 h-4" /> },
      { id: 'myaccount', label: 'Mi Cuenta', shortLabel: 'Mi Cuenta', icon: <Ico n="dollar" c="w-4 h-4" /> },
    ]
  }

  // Security
  return [
    { id: 'validation', label: 'Caseta Tablet', shortLabel: 'Caseta', icon: <Ico n="shield" c="w-4 h-4" /> },
    { id: 'bitacora', label: 'Bitácora Digital', shortLabel: 'Bitácora', icon: <Ico n="book" c="w-4 h-4" /> },
  ]
}

const DEEP_TO_BASE: Partial<Record<Module, Module>> = {
  'hoa-board': 'hoa',
  'finance-tickets': 'finance',
  'myaccount-tickets': 'myaccount',
}

function MainApp() {
  const [auth, setAuth] = useState<AuthUser | null>(null)
  const [active, setActive] = useState<Module>('dashboard')

  function handleLogin(user: AuthUser) {
    setAuth(user)
    if (user.role === 'resident') setActive('res-home')
    else if (user.role === 'security') setActive('validation')
    else setActive('dashboard')
  }

  function handleLogout() {
    setAuth(null)
    setActive('dashboard')
  }

  if (!auth) {
    return (
      <div className="flex flex-col h-full font-body">
        <LoginScreen onLogin={handleLogin} />
      </div>
    )
  }

  const navItems = getNavItems(auth.role)
  const navActive = (id: Module) => active === id || DEEP_TO_BASE[active] === id

  function renderModule() {
    if (!auth) return null

    // ── Admin Views ────────────────────────────────────────────────────────
    if (auth.role === 'admin') {
      if (active === 'dashboard') return <AdminDashboard user={auth} onNav={setActive} />
      if (active === 'hoa' || active === 'hoa-board') {
        return <HOAModule defaultTab={active === 'hoa-board' ? 'board' : 'directory'} />
      }
      if (active === 'amenities') return <AmenitiesModule />
      if (active === 'access') return <AccessModule />
      if (active === 'finance' || active === 'finance-tickets') {
        return <FinanceModule defaultTab={active === 'finance-tickets' ? 'tickets' : 'fees'} />
      }
    }

    // ── Resident Views ─────────────────────────────────────────────────────
    if (auth.role === 'resident') {
      if (active === 'res-home') return <ResidentDashboard user={auth} onNav={setActive} />
      if (active === 'notices') return <ResidentNoticesView unit={auth.unit || 'A-101'} name={auth.name} />
      if (active === 'res-amenities') {
        return <ResidentAmenitiesView unit={auth.unit || 'A-101'} name={auth.name} />
      }
      if (active === 'qr') return <ResidentQRView user={auth} />
      if (active === 'myaccount' || active === 'myaccount-tickets') {
        return (
          <ResidentMyAccountView
            unit={auth.unit || 'A-101'}
            name={auth.name}
            defaultTab={active === 'myaccount-tickets' ? 'tickets' : 'statement'}
          />
        )
      }
    }

    // ── Security Views ─────────────────────────────────────────────────────
    if (auth.role === 'security') {
      if (active === 'validation' || active === 'bitacora') {
        return <SecurityCasetaView defaultTab={active === 'bitacora' ? 'log' : 'tablet'} />
      }
    }

    return null
  }

  return (
    <div className="flex flex-col h-full font-body bg-slate-50 relative overflow-hidden">
      <AnimatedBg />
      <div className="flex flex-col h-full relative" style={{ zIndex: 1 }}>
        <TopNav
          active={active}
          onSelect={setActive}
          user={auth}
          onLogout={handleLogout}
          navItems={navItems}
          navActive={navActive}
        />
        <main className="flex-1 overflow-y-auto pb-24 sm:pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3.5 sm:py-7">
            <div className="animate-fade-in" key={active}>
              {renderModule()}
            </div>
          </div>
        </main>
        <BottomNav active={active} onSelect={setActive} navItems={navItems} navActive={navActive} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  )
}
