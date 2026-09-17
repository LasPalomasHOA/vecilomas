const BADGE_MAP: Record<string, [string, string, string]> = {
  // Teal-Centered Statuses
  'Al corriente':     ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Pagada':           ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Aprobada':         ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Resuelto':         ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'En Instalaciones': ['#ecfdf5', '#059669', '#d1fae5'],
  'Activo':           ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Utilizado':        ['#f8fafc', '#64748b', '#e2e8f0'],
  'Propietario':      ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Residente':        ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'resident':         ['#f0fdfa', '#0d9488', '#ccfbf1'],

  // Alerts & Warnings
  'Moroso':           ['#fef2f2', '#e11d48', '#fecdd3'],
  'Vencida':          ['#fef2f2', '#e11d48', '#fecdd3'],
  'Pendiente':        ['#fffbeb', '#d97706', '#fef3c7'],
  'Cancelada':        ['#f8fafc', '#64748b', '#e2e8f0'],
  'Rechazada':        ['#fef2f2', '#e11d48', '#fecdd3'],
  'En Proceso':       ['#f0f9ff', '#0284c7', '#e0f2fe'],
  'Completada':       ['#f8fafc', '#64748b', '#e2e8f0'],
  'Inactivo':         ['#f8fafc', '#64748b', '#e2e8f0'],
  'Expirado':         ['#fef2f2', '#e11d48', '#fecdd3'],

  // Priorities
  'Alta':             ['#fef2f2', '#e11d48', '#fecdd3'],
  'Media':            ['#fffbeb', '#d97706', '#fef3c7'],
  'Baja':             ['#f8fafc', '#64748b', '#e2e8f0'],

  // Roles & Types
  'Arrendatario':     ['#f5f3ff', '#7c3aed', '#ede9fe'],
  'Administrador':    ['#eef2ff', '#4f46e5', '#e0e7ff'],
  'admin':            ['#eef2ff', '#4f46e5', '#e0e7ff'],
  'Seguridad':        ['#f0fdfa', '#0f766e', '#ccfbf1'],
  'security':         ['#f0fdfa', '#0f766e', '#ccfbf1'],

  // Categories & Notice Types
  'Mantenimiento':    ['#fffbeb', '#b45309', '#fef3c7'],
  'Asamblea':         ['#f0f9ff', '#0369a1', '#e0f2fe'],
  'Servicio':         ['#fff7ed', '#ea580c', '#ffedd5'],
  'Comunicado':       ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Reglamento':       ['#f5f3ff', '#6d28d9', '#ede9fe'],
  'Finanzas':         ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Manuales':         ['#f0f9ff', '#0284c7', '#e0f2fe'],
  'Políticas':        ['#fdf2f8', '#db2777', '#fce7f3'],

  // Visit Types
  'Visita':           ['#f0fdfa', '#0d9488', '#ccfbf1'],
  'Repartidor':       ['#fff7ed', '#ea580c', '#ffedd5'],
  'Técnico':          ['#f0f9ff', '#0284c7', '#e0f2fe'],
  'Proveedor':        ['#f5f3ff', '#7c3aed', '#ede9fe'],
  'Familiar':         ['#f0fdfa', '#0d9488', '#ccfbf1'],
}

export function Badge({ text, className = '' }: { text: string; className?: string }) {
  const [bg, color, border] = BADGE_MAP[text] ?? ['#f8fafc', '#64748b', '#e2e8f0']
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-normal border whitespace-nowrap shrink-0 ${className}`}
      style={{
        backgroundColor: bg,
        color,
        borderColor: border,
      }}
    >
      {text}
    </span>
  )
}
export default Badge

