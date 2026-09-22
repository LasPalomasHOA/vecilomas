import type { AuthUser, UserRole } from '@/types'

export interface UserAccount {
  id: string
  role: UserRole
  name: string
  email: string
  usernames: string[]
  passwords: string[]
  displayPassword: string
  initials: string
  unit?: string
  phone?: string
  roleTitle: string
}

export const REGISTERED_ACCOUNTS: UserAccount[] = [
  // ── 1. Administración HOA ────────────────────────────────────────────────
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Ing. Carlos Villalobos',
    email: 'admin@laspalomas.mx',
    usernames: ['admin', 'administrador', 'admin@laspalomas.mx', 'carlos.admin'],
    passwords: ['Admin2026!', 'admin123', 'admin', 'vecilomas2026', '123456'],
    displayPassword: 'Admin2026!',
    initials: 'CV',
    phone: '+52 (638) 102-4401',
    roleTitle: 'Administrador General HOA',
  },
  {
    id: 'admin-2',
    role: 'admin',
    name: 'Lic. Sofia Morales',
    email: 'directiva@laspalomas.mx',
    usernames: ['directiva', 'directiva@laspalomas.mx', 'mesa_directiva', 'sofia.admin'],
    passwords: ['Directiva2026!', 'admin123', 'directiva', 'vecilomas2026'],
    displayPassword: 'Directiva2026!',
    initials: 'SM',
    phone: '+52 (638) 102-4402',
    roleTitle: 'Presidenta Mesa Directiva',
  },

  // ── 2. Residentes / Inquilinos ───────────────────────────────────────────
  {
    id: 'res-1',
    role: 'resident',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    usernames: ['a-101', '101', 'a101', 'carlos.mendoza@email.com', 'carlos.mendoza'],
    passwords: ['Residente2026!', 'residente123', '123456', 'a101', 'vecilomas2026'],
    displayPassword: 'Residente2026!',
    initials: 'CM',
    unit: 'A-101',
    phone: '+52 (638) 383-1101',
    roleTitle: 'Propietario · Torre A',
  },
  {
    id: 'res-2',
    role: 'resident',
    name: 'Sofía Garza',
    email: 'sofia.garza@email.com',
    usernames: ['b-204', '204', 'b204', 'sofia.garza@email.com', 'sofia.garza'],
    passwords: ['Residente2026!', 'residente123', '123456', 'b204', 'vecilomas2026'],
    displayPassword: 'Residente2026!',
    initials: 'SG',
    unit: 'B-204',
    phone: '+52 (638) 383-1204',
    roleTitle: 'Propietaria · Torre B',
  },
  {
    id: 'res-3',
    role: 'resident',
    name: 'Roberto Flores',
    email: 'roberto.flores@email.com',
    usernames: ['ph-01', 'ph01', 'ph-1', 'roberto.flores@email.com', 'roberto.flores'],
    passwords: ['Residente2026!', 'residente123', '123456', 'ph01', 'vecilomas2026'],
    displayPassword: 'Residente2026!',
    initials: 'RF',
    unit: 'PH-01',
    phone: '+52 (638) 383-1901',
    roleTitle: 'Propietario · Penthouse',
  },
  {
    id: 'res-4',
    role: 'resident',
    name: 'Mariana Torres',
    email: 'mariana.torres@email.com',
    usernames: ['a-302', '302', 'a302', 'mariana.torres@email.com', 'mariana.torres'],
    passwords: ['Residente2026!', 'residente123', '123456', 'a302', 'vecilomas2026'],
    displayPassword: 'Residente2026!',
    initials: 'MT',
    unit: 'A-302',
    phone: '+52 (638) 383-1302',
    roleTitle: 'Inquilina · Torre A',
  },

  // ── 3. Seguridad / Caseta ────────────────────────────────────────────────
  {
    id: 'sec-1',
    role: 'security',
    name: 'Oficial Ramón Estrada',
    email: 'caseta@laspalomas.mx',
    usernames: ['caseta', 'caseta_norte', 'caseta@laspalomas.mx', 'seguridad', 'guardia'],
    passwords: ['Caseta2026!', 'caseta123', 'caseta', '123456', 'vecilomas2026'],
    displayPassword: 'Caseta2026!',
    initials: 'RE',
    phone: '+52 (638) 383-9911',
    roleTitle: 'Caseta Principal · Turno Matutino',
  },
  {
    id: 'sec-2',
    role: 'security',
    name: 'Oficial Miguel Ángel Solís',
    email: 'caseta.sur@laspalomas.mx',
    usernames: ['caseta_sur', 'casetasur', 'caseta.sur@laspalomas.mx', 'guardia2'],
    passwords: ['Caseta2026!', 'caseta123', 'caseta', '123456', 'vecilomas2026'],
    displayPassword: 'Caseta2026!',
    initials: 'MS',
    phone: '+52 (638) 383-9922',
    roleTitle: 'Caseta Acceso Playa · Turno Vespertino',
  },
]

const ROLE_NAMES: Record<UserRole, string> = {
  admin: 'Administración HOA',
  resident: 'Residente / Inquilino',
  security: 'Seguridad / Caseta',
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export async function authenticateUser(
  identifierInput: string,
  passwordInput: string,
  selectedRole: UserRole
): Promise<AuthResult> {
  const cleanId = identifierInput.trim()
  const cleanPass = passwordInput.trim()

  if (!cleanId) {
    return { success: false, error: 'Por favor ingresa tu usuario, correo o número de departamento.' }
  }

  if (!cleanPass) {
    return { success: false, error: 'Por favor ingresa tu contraseña.' }
  }

  // 1. Intentar autenticación directa en la Base de Datos PostgreSQL
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: cleanId,
        password: cleanPass,
        role: selectedRole,
      }),
    })

    const json = await res.json()

    if (res.ok && json.success && json.data) {
      const dbUser = json.data
      const authUser: AuthUser = {
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
        initials: dbUser.initials,
        unit: dbUser.unit,
      }
      return {
        success: true,
        user: authUser,
      }
    } else if (res.status === 401 || res.status === 400) {
      return {
        success: false,
        error: json.error || 'Credenciales inválidas en base de datos.',
      }
    }
  } catch (err) {
    console.warn('API PostgreSQL no disponible en este momento, usando validación local:', err)
  }

  // 2. Fallback de contingencia local si la red está offline
  const lowerId = cleanId.toLowerCase()
  const matchedAccount = REGISTERED_ACCOUNTS.find(account => {
    const matchesEmail = account.email.toLowerCase() === lowerId
    const matchesUsername = account.usernames.some(u => u.toLowerCase() === lowerId)
    return matchesEmail || matchesUsername
  })

  if (!matchedAccount) {
    return {
      success: false,
      error: 'Usuario o correo no encontrado en el sistema.',
    }
  }

  if (matchedAccount.role !== selectedRole) {
    return {
      success: false,
      error: `La cuenta "${matchedAccount.name}" corresponde al rol de ${ROLE_NAMES[matchedAccount.role]}.`,
    }
  }

  const isPasswordValid = matchedAccount.passwords.includes(cleanPass)
  if (!isPasswordValid) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Verifica tus datos o usa una cuenta demo.',
    }
  }

  return {
    success: true,
    user: {
      role: matchedAccount.role,
      name: matchedAccount.name,
      email: matchedAccount.email,
      initials: matchedAccount.initials,
      unit: matchedAccount.unit,
    },
  }
}

export function getDemoAccountsForRole(role: UserRole): UserAccount[] {
  return REGISTERED_ACCOUNTS.filter(a => a.role === role)
}
