import type { ReactNode } from 'react'

export type UserRole = 'admin' | 'resident' | 'security'

export interface AuthUser {
  role: UserRole
  name: string
  email: string
  initials: string
  unit?: string
}

export type Module =
  | 'dashboard'
  | 'hoa'
  | 'hoa-board'
  | 'amenities'
  | 'access'
  | 'finance'
  | 'finance-tickets'
  | 'res-home'
  | 'notices'
  | 'res-amenities'
  | 'qr'
  | 'myaccount'
  | 'myaccount-tickets'
  | 'validation'
  | 'bitacora'

export interface NavItem {
  id: Module
  label: string
  shortLabel?: string
  icon: ReactNode
}

export const BRAND_COLORS = {
  primary: '#008080',       // Pure Teal
  primaryDark: '#004c4c',   // Deep Dark Teal
  primaryMuted: '#7eb0a6',  // Soft Sage Teal
  primaryLight: '#e6f2f0',  // Frosted Ice Teal
  primaryDeep: '#003333',   // Shadow Teal
  darkText: '#002626',      // Midnight Teal Text
  accent: '#00a896',        // Vibrant Luminous Teal
}
