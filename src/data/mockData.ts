import type { AuthUser, UserRole } from '@/types'
import type { Resident, Notice, CommunityDocument, UserRolePermission } from '@/types/hoa'
import type { Amenity, Booking } from '@/types/amenities'
import type { AccessPass, VisitRecord } from '@/types/access'
import type { FeeStatement, MaintenanceTicket } from '@/types/finance'

export const MOCK_USERS: Record<string, { user: AuthUser; pass: string }> = {
  'admin@laspalomas.mx': {
    pass: 'admin123',
    user: { role: 'admin', name: 'Administrador General', email: 'admin@laspalomas.mx', initials: 'AG' },
  },
  'carlos.mendoza@email.com': {
    pass: 'vecino123',
    user: { role: 'resident', name: 'Carlos Mendoza Ruiz', email: 'carlos.mendoza@email.com', initials: 'CM', unit: 'A-101' },
  },
  'guardia01': {
    pass: 'guardia123',
    user: { role: 'security', name: 'Jorge Hernández', email: 'guardia01', initials: 'JH' },
  },
}

export const INITIAL_PERMISSIONS_USERS: UserRolePermission[] = [
  {
    id: 'USR-001',
    name: 'Administrador General',
    email: 'admin@laspalomas.mx',
    role: 'admin',
    status: 'Activo',
    permissions: ['Directorio completo', 'Finanzas y cuotas', 'Gestión de amenidades', 'Publicación de avisos', 'Supervisión de caseta', 'Tickets de soporte'],
  },
  {
    id: 'USR-002',
    name: 'Carlos Mendoza Ruiz',
    email: 'carlos.mendoza@email.com',
    role: 'resident',
    unit: 'A-101',
    status: 'Activo',
    permissions: ['Generación de Pases QR', 'Reservación de áreas comunes', 'Consulta de comunicados y reglamentos', 'Reporte de fallas y estado de cuenta'],
  },
  {
    id: 'USR-003',
    name: 'Patricia Vega Soto',
    email: 'p.vega@email.com',
    role: 'resident',
    unit: 'A-102',
    status: 'Activo',
    permissions: ['Generación de Pases QR', 'Reservación de áreas comunes', 'Consulta de comunicados y reglamentos', 'Reporte de fallas y estado de cuenta'],
  },
  {
    id: 'USR-004',
    name: 'Jorge Hernández',
    email: 'guardia01@laspalomas.mx',
    role: 'security',
    status: 'Activo',
    permissions: ['Escaneo y validación de QR', 'Registro de bitácora de accesos', 'Control de salidas de vehículos'],
  },
]

export const INITIAL_RESIDENTS: Resident[] = [
  { id: 1, unit: 'A-101', name: 'Carlos Mendoza Ruiz',    type: 'Propietario',  status: 'Al corriente', phone: '+52 55 1234-5678', email: 'c.mendoza@email.com',  vehicles: ['MXC-1234'] },
  { id: 2, unit: 'A-102', name: 'Patricia Vega Soto',      type: 'Arrendatario', status: 'Moroso',       phone: '+52 55 2345-6789', email: 'p.vega@email.com',     vehicles: ['XYZ-5678'] },
  { id: 3, unit: 'B-201', name: 'Roberto Jiménez Lagos',   type: 'Propietario',  status: 'Al corriente', phone: '+52 55 3456-7890', email: 'r.jimenez@email.com',  vehicles: ['DEF-9012', 'GHI-3456'] },
  { id: 4, unit: 'B-202', name: 'María Elena Torres Ríos', type: 'Propietario',  status: 'Al corriente', phone: '+52 55 4567-8901', email: 'me.torres@email.com',  vehicles: [] },
  { id: 5, unit: 'C-301', name: 'Fernando Castillo Díaz',  type: 'Arrendatario', status: 'Al corriente', phone: '+52 55 5678-9012', email: 'f.castillo@email.com', vehicles: ['JKL-7890'] },
  { id: 6, unit: 'C-302', name: 'Ana Sofía Ramírez Vera',  type: 'Propietario',  status: 'Moroso',       phone: '+52 55 6789-0123', email: 'as.ramirez@email.com', vehicles: ['MNO-1234'] },
  { id: 7, unit: 'D-401', name: 'Luis Alberto Peña Cruz',  type: 'Propietario',  status: 'Al corriente', phone: '+52 55 7890-1234', email: 'la.pena@email.com',    vehicles: ['PQR-5678'] },
  { id: 8, unit: 'D-402', name: 'Claudia Hernández Mora',  type: 'Propietario',  status: 'Al corriente', phone: '+52 55 8901-2345', email: 'c.hernandez@email.com',vehicles: ['STU-9012'] },
]

export const INITIAL_NOTICES: Notice[] = [
  { id: 1, title: 'Mantenimiento Preventivo — Elevadores', date: '28 ago 2026', type: 'Mantenimiento', content: 'Se realizará mantenimiento preventivo en ambos elevadores el 5 de septiembre de 9:00 a 14:00 hrs. Por favor use las escaleras durante ese periodo.', urgent: true },
  { id: 2, title: 'Asamblea Ordinaria — 3er Trimestre',    date: '20 ago 2026', type: 'Asamblea',       content: 'Se convoca a todos los condóminos a la asamblea del tercer trimestre el 15 de septiembre a las 19:00 hrs en el salón de usos múltiples.', urgent: false },
  { id: 3, title: 'Corte de Agua Programado — Edificio B', date: '15 ago 2026', type: 'Servicio',       content: 'El sábado 8 de septiembre de 8:00 a 13:00 hrs no habrá agua en el Edificio B por mantenimiento en la red hidráulica.', urgent: true },
  { id: 4, title: 'Nuevo Personal de Seguridad',           date: '10 ago 2026', type: 'Comunicado',     content: 'A partir del 1 de septiembre el Sr. Jorge Hernández se integra al equipo de seguridad cubriendo el turno nocturno de 22:00 a 06:00 hrs.', urgent: false },
]

export const INITIAL_DOCUMENTS: CommunityDocument[] = [
  { id: 1, name: 'Reglamento Interno del Condominio 2026', category: 'Reglamento', date: '15 ene 2026', size: '2.4 MB' },
  { id: 2, name: 'Acta de Asamblea — 2do Trimestre 2026',  category: 'Asamblea',   date: '20 jun 2026', size: '1.1 MB' },
  { id: 3, name: 'Estado Financiero Anual — Agosto 2026',  category: 'Finanzas',   date: '01 sep 2026', size: '845 KB' },
  { id: 4, name: 'Manual de Procedimientos para Residentes', category: 'Manuales', date: '10 feb 2026', size: '3.8 MB' },
  { id: 5, name: 'Políticas de Uso de Amenidades 2026',    category: 'Políticas',  date: '05 ene 2026', size: '560 KB' },
  { id: 6, name: 'Informe de Mantenimiento Semestral',     category: 'Finanzas',   date: '30 jun 2026', size: '1.9 MB' },
]

export const INITIAL_AMENITIES: Amenity[] = [
  {
    id: 1,
    name: 'Salón de Eventos',
    capacity: 80,
    rate: '$500 MXN / evento',
    costAmount: 500,
    hours: '10:00 – 22:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1780593116478-c46838f86523?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: '$1,500 MXN en garantía',
    maxHoursPerBooking: 6,
    rules: ['Música en volumen moderado hasta las 22:00 hrs', 'Dejar el salón limpio y sin basura', 'No se permite pirotecnia'],
  },
  {
    id: 2,
    name: 'Alberca & Asoleadero',
    capacity: 30,
    rate: 'Sin costo',
    costAmount: 0,
    hours: '07:00 – 20:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: 'No aplica',
    maxHoursPerBooking: 4,
    rules: ['Uso obligatorio de traje de baño', 'Prohibido envases de vidrio', 'Menores deben estar acompañados de un adulto'],
  },
  {
    id: 3,
    name: 'Cancha de Pádel / Tenis',
    capacity: 4,
    rate: 'Sin costo',
    costAmount: 0,
    hours: '07:00 – 21:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1668507911709-0249e832618d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: 'No aplica',
    maxHoursPerBooking: 2,
    rules: ['Uso de calzado deportivo adecuado', 'Máximo 2 horas consecutivas por departamento', 'Apagar reflectores al terminar'],
  },
  {
    id: 4,
    name: 'Asadores / BBQ Zone',
    capacity: 15,
    rate: '$200 MXN / sesión',
    costAmount: 200,
    hours: '12:00 – 22:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1605495121416-c03e2e1d00da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: '$500 MXN en garantía',
    maxHoursPerBooking: 4,
    rules: ['Apagar completamente el carbón al terminar', 'Depositar la basura en los contenedores designados'],
  },
  {
    id: 5,
    name: 'Gimnasio Fitness Center',
    capacity: 20,
    rate: 'Sin costo',
    costAmount: 0,
    hours: '06:00 – 22:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: 'No aplica',
    maxHoursPerBooking: 2,
    rules: ['Uso de toalla obligatorio', 'Regresar las mancuernas a su lugar', 'Limpiar los aparatos después de usarlos'],
  },
  {
    id: 6,
    name: 'Sala de Cine VIP',
    capacity: 20,
    rate: '$300 MXN / función',
    costAmount: 300,
    hours: '16:00 – 23:00 hrs',
    available: true,
    img: 'https://images.unsplash.com/photo-1637430308606-86576d8fef3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    deposit: '$500 MXN en garantía',
    maxHoursPerBooking: 3,
    rules: ['No ingresar alimentos grasosos o líquidos sin tapa', 'Cuidar los controles del equipo audiovisual'],
  },
]

export const INITIAL_BOOKINGS: Booking[] = [
  { id: 1, amenity: 'Salón de Eventos', resident: 'Carlos Mendoza',    unit: 'A-101', date: '5 sep 2026', time: '18:00 – 22:00', status: 'Aprobada',  guests: 40, cost: '$500 MXN' },
  { id: 2, amenity: 'Asadores / BBQ Zone', resident: 'Roberto Jiménez',   unit: 'B-201', date: '7 sep 2026', time: '13:00 – 17:00', status: 'Pendiente', guests: 12, cost: '$200 MXN' },
  { id: 3, amenity: 'Sala de Cine VIP',     resident: 'María Elena Torres', unit: 'B-202', date: '6 sep 2026', time: '19:00 – 22:00', status: 'Aprobada',  guests: 10, cost: '$300 MXN' },
  { id: 4, amenity: 'Cancha de Pádel / Tenis',  resident: 'Fernando Castillo',  unit: 'C-301', date: '4 sep 2026', time: '08:00 – 10:00', status: 'Cancelada', guests: 4, cost: 'Sin costo' },
]

export const INITIAL_ACCESS_PASSES: AccessPass[] = [
  {
    id: 'PASS-001',
    code: 'VCN-LAU-A101-X4F9',
    visitor: 'Laura Gómez Pérez',
    host: 'Carlos Mendoza Ruiz',
    unit: 'A-101',
    validDate: '2026-09-02',
    validTime: '18:00',
    visitType: 'Visita',
    status: 'Activo',
    createdAt: '2026-09-02T08:30:00',
  },
  {
    id: 'PASS-002',
    code: 'VCN-MIG-B201-P8K2',
    visitor: 'Miguel Ángel Fuentes',
    host: 'Roberto Jiménez Lagos',
    unit: 'B-201',
    validDate: '2026-09-02',
    validTime: '14:00',
    visitType: 'Familiar',
    status: 'Utilizado',
    createdAt: '2026-09-02T10:15:00',
  },
  {
    id: 'PASS-003',
    code: 'VCN-TEL-C302-Q1W7',
    visitor: 'Técnico Telmex',
    host: 'Ana Sofía Ramírez',
    unit: 'C-302',
    validDate: '2026-09-02',
    validTime: '15:30',
    visitType: 'Técnico',
    status: 'Utilizado',
    createdAt: '2026-09-02T11:00:00',
  },
]

export const INITIAL_VISITS: VisitRecord[] = [
  { id: 1, visitor: 'Laura Gómez Pérez',      host: 'Carlos Mendoza',    unit: 'A-101', entry: '09:14', exit: '11:32', date: 'Hoy',  status: 'Completada',       type: 'Visita', plate: 'ABC-123' },
  { id: 2, visitor: 'Repartidor — Uber Eats', host: 'Patricia Vega',     unit: 'A-102', entry: '10:05', exit: '10:08', date: 'Hoy',  status: 'Completada',       type: 'Repartidor', plate: 'MOTO-44' },
  { id: 3, visitor: 'Miguel Ángel Fuentes',   host: 'Roberto Jiménez',   unit: 'B-201', entry: '14:20', exit: null,    date: 'Hoy',  status: 'En Instalaciones', type: 'Familiar', plate: 'GHT-987' },
  { id: 4, visitor: 'Técnico Telmex',         host: 'Ana Sofía Ramírez', unit: 'C-302', entry: '15:45', exit: null,    date: 'Hoy',  status: 'En Instalaciones', type: 'Técnico', plate: 'VAN-552' },
  { id: 5, visitor: 'Diana Reyes López',      host: 'Fernando Castillo', unit: 'C-301', entry: '09:00', exit: '10:30', date: 'Ayer', status: 'Completada',       type: 'Visita', plate: 'PQR-331' },
]

export const INITIAL_FEES: FeeStatement[] = [
  { id: 'FEE-01', unit: 'A-101', resident: 'Carlos Mendoza',    concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pagada',   date: '01 ago 2026', dueDate: '10 ago 2026', paymentMethod: 'Transferencia SPEI' },
  { id: 'FEE-02', unit: 'A-102', resident: 'Patricia Vega',      concept: 'Cuotas Jun–Ago 2026 (3 meses)',amount: 5400, status: 'Vencida',  date: '—',           dueDate: '10 jun 2026' },
  { id: 'FEE-03', unit: 'B-201', resident: 'Roberto Jiménez',    concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pagada',   date: '02 ago 2026', dueDate: '10 ago 2026', paymentMethod: 'Tarjeta de Débito' },
  { id: 'FEE-04', unit: 'B-202', resident: 'María Elena Torres', concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pendiente',date: '—',           dueDate: '10 ago 2026' },
  { id: 'FEE-05', unit: 'C-301', resident: 'Fernando Castillo',  concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pagada',   date: '05 ago 2026', dueDate: '10 ago 2026', paymentMethod: 'Transferencia SPEI' },
  { id: 'FEE-06', unit: 'C-302', resident: 'Ana Sofía Ramírez',  concept: 'Cuotas Jul–Ago 2026 (2 meses)',amount: 3600, status: 'Vencida',  date: '—',           dueDate: '10 jul 2026' },
  { id: 'FEE-07', unit: 'D-401', resident: 'Luis Alberto Peña',  concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pagada',   date: '01 ago 2026', dueDate: '10 ago 2026', paymentMethod: 'Transferencia SPEI' },
  { id: 'FEE-08', unit: 'D-402', resident: 'Claudia Hernández',  concept: 'Cuota Mantenimiento Ago 2026', amount: 1800, status: 'Pagada',   date: '03 ago 2026', dueDate: '10 ago 2026', paymentMethod: 'Efectivo en Oficina' },
]

export const INITIAL_TICKETS: MaintenanceTicket[] = [
  { id: 'TKT-2024', location: 'Pasillo Nivel 2 — Torre A', reporter: 'Carlos Mendoza Ruiz',    unit: 'A-101', issue: 'Fuga de agua en pared del pasillo, manchas visibles en drywall', priority: 'Alta',  status: 'En Proceso', date: '30 ago 2026', assignedTo: 'Plomería Rodríguez' },
  { id: 'TKT-2023', location: 'Estacionamiento Subterráneo C', reporter: 'Ana Sofía Ramírez', unit: 'C-302', issue: 'Lámpara LED fundida, zona sin iluminación nocturna adecuada',  priority: 'Media', status: 'Pendiente',  date: '28 ago 2026' },
  { id: 'TKT-2022', location: 'Edificio B — Elevador Principal', reporter: 'Jorge Hernández (Seguridad)', issue: 'Elevador B con retraso en sensores de cierre de puertas',       priority: 'Alta',  status: 'Resuelto',   date: '25 ago 2026', assignedTo: 'Elevadores Otis S.A.' },
  { id: 'TKT-2021', location: 'Depto B-201',                 reporter: 'Roberto Jiménez Lagos', unit: 'B-201', issue: 'Intercomunicador con caseta sin audio desde hace 3 días',     priority: 'Baja',  status: 'Resuelto',   date: '22 ago 2026', assignedTo: 'Telecom Seguridad' },
]
