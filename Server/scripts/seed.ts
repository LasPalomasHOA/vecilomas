import { query, pool } from '../config/db.ts'

async function seedDatabase() {
  console.log('🌱 Iniciando Seeder de Base de Datos PostgreSQL VeciLomas...')

  try {
    // 1. Asegurar Condominio Principal
    const condoRes = await query(`
      INSERT INTO vecilomas.condominiums (id, name, address, postal_code, city, currency)
      VALUES (1, 'Condominio Residencial Las Palomas', 'Blvd. Costero #150, Sandy Beach', '83550', 'Puerto Peñasco, Sonora', 'MXN')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        postal_code = EXCLUDED.postal_code,
        city = EXCLUDED.city
      RETURNING id;
    `)
    console.log('✅ Condominio verificado (ID 1)')

    // 2. Asegurar Unidades
    await query(`
      INSERT INTO vecilomas.units (id, condominium_id, unit_number, building_block, floor, status)
      VALUES 
        (1, 1, 'A-101', 'Torre A', 1, 'al_corriente'),
        (2, 1, 'A-102', 'Torre A', 1, 'al_corriente'),
        (3, 1, 'B-204', 'Torre B', 2, 'al_corriente'),
        (4, 1, 'B-205', 'Torre B', 2, 'moroso'),
        (5, 1, 'PH-01', 'Torre Penthouse', 10, 'al_corriente')
      ON CONFLICT (id) DO NOTHING;
    `)
    console.log('✅ Unidades Residenciales verificadas')

    // 3. Usuarios de Sistema (Administración, Seguridad y Residentes con contraseñas encriptadas)
    // Hash bcrypt para 'Admin2026!' y 'Caseta2026!' y 'Residente2026!'
    const adminHash = '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG' // Admin2026! / 123456
    const casetaHash = '$2b$10$MJ.PJLR5M8dVuavYgy6x.OoaDLyfkPXUToBFFoxHnYM.LmaiwTiS6' // Caseta2026!

    await query(`
      INSERT INTO vecilomas.users (id, condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status)
      VALUES 
        (1, 1, NULL, 'admin@laspalomas.mx', '${adminHash}', 'Ing. Carlos Villalobos', '+52 (638) 102-4401', 'admin', NULL, 'activo'),
        (2, 1, NULL, 'caseta@laspalomas.mx', '${casetaHash}', 'Oficial Ramón Estrada', '+52 (638) 383-9911', 'security', NULL, 'activo'),
        (19, 1, NULL, 'guardia01@laspalomas.mx', '${casetaHash}', 'Jorge Hernández', '+52 (638) 383-9912', 'security', NULL, 'activo'),
        (28, 1, 1, 'carlos.mendoza@email.com', '${adminHash}', 'Carlos Mendoza', '+52 (638) 383-1101', 'resident', 'Propietario', 'activo'),
        (29, 1, 2, 'juanikiki@gmail.com', '${adminHash}', 'Juan Torres', '+52 (638) 383-1102', 'resident', 'Propietario', 'activo'),
        (30, 1, 3, 'sofia.garza@email.com', '${adminHash}', 'Sofía Garza', '+52 (638) 383-1204', 'resident', 'Propietaria', 'activo'),
        (31, 1, 5, 'roberto.flores@email.com', '${adminHash}', 'Roberto Flores', '+52 (638) 383-1901', 'resident', 'Propietario', 'activo')
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        unit_id = EXCLUDED.unit_id,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
    `)
    console.log('✅ Cuentas de usuarios y residentes verificadas')

    // 4. Permisos de Rol HOA
    await query(`
      INSERT INTO vecilomas.user_permissions (id, user_id, permission_key)
      VALUES 
        (1, 1, 'ALL_ADMIN'),
        (2, 2, 'SECURITY_SCANNER_LOG')
      ON CONFLICT (id) DO NOTHING;
    `)

    // 5. Avisos y Comunicados Oficiales (Notices)
    const noticesCount = await query(`SELECT count(*)::int as c FROM vecilomas.notices;`)
    if (noticesCount.rows[0].c === 0) {
      await query(`
        INSERT INTO vecilomas.notices (condominium_id, author_user_id, title, content, notice_type, is_urgent, published_at)
        VALUES 
          (1, 1, 'Mantenimiento preventivo en Alberca Principal y Palapas', 'Se informa a todos los condóminos que el próximo martes de 08:00 a 14:00 hrs se realizarán trabajos de cloración profunda y sustitución de filtros en el área de alberca infinity.', 'Mantenimiento', false, NOW() - INTERVAL '1 day'),
          (1, 1, 'Convocatoria a Asamblea General Ordinaria 2026', 'Estimados propietarios, se convoca formalmente a la 1ra Asamblea General del año a celebrarse en el Salón de Eventos Las Palomas el próximo sábado 15 a las 18:00 hrs.', 'Asamblea', true, NOW() - INTERVAL '3 days'),
          (1, 1, 'Actualización del Sistema de Seguridad y Caseta con Códigos QR', 'A partir de este mes, todas las visitas deberán ingresar mediante los nuevos pases digitales QR generados directamente desde su portal.', 'Seguridad', false, NOW() - INTERVAL '5 days');
      `)
      console.log('✅ Avisos y comunicados oficiales generados')
    }

    // 6. Repositorio de Documentos Comunitarios
    const docsCount = await query(`SELECT count(*)::int as c FROM vecilomas.community_documents;`)
    if (docsCount.rows[0].c === 0) {
      await query(`
        INSERT INTO vecilomas.community_documents (condominium_id, name, category, file_url, file_size_bytes, mime_type, uploaded_by_user_id)
        VALUES 
          (1, 'Reglamento Interno de Convivencia y Áreas Comunes 2026.pdf', 'Reglamento', 'https://example.com/docs/reglamento.pdf', 2450000, 'application/pdf', 1),
          (1, 'Acta de Asamblea General Ordinaria - Diciembre 2025.pdf', 'Asamblea', 'https://example.com/docs/acta-2025.pdf', 1850000, 'application/pdf', 1),
          (1, 'Estado Financiero Dictaminado y Presupuesto Anual 2026.pdf', 'Finanzas', 'https://example.com/docs/finanzas-2026.pdf', 3120000, 'application/pdf', 1),
          (1, 'Manual de Uso de Amenidades, Palapas y Asadores.pdf', 'Manuales', 'https://example.com/docs/manual-amenidades.pdf', 1200000, 'application/pdf', 1);
      `)
      console.log('✅ Documentos comunitarios generados')
    }

    // 7. Amenidades de Clase Mundial
    await query(`
      INSERT INTO vecilomas.amenities (id, condominium_id, name, description, capacity, cost_amount, deposit_amount, opening_time, closing_time, max_hours_per_booking, rules, is_active)
      VALUES 
        (1, 1, 'Alberca Infinity & Jacuzzi', 'Vista panorámica al Mar de Cortés con camastros, sombrillas y servicio de toallas.', 40, 0.00, 500.00, '08:00', '22:00', 4, '["Traje de baño obligatorio", "No envases de vidrio", "Menores con supervisión"]'::jsonb, true),
        (2, 1, 'Salón de Eventos & Terraza Lounge', 'Espacio climatizado equipado con cocina de servicio, mobiliario lounge y equipo de audio.', 80, 1500.00, 2000.00, '10:00', '23:59', 6, '["Música moderada después de las 22:00 hrs", "Depósito reembolsable al entregar limpio"]'::jsonb, true),
        (3, 1, 'Área de Asadores & Palapa Gourmet', 'Pérgola exterior con asadores de acero inoxidable, tarja y mesas de picnic frente a jardines.', 20, 300.00, 500.00, '11:00', '21:00', 4, '["Dejar área limpia y carbón apagado", "Uso exclusivo residentes e invitados"]'::jsonb, true),
        (4, 1, 'Cancha de Pádel & Tenis', 'Cancha profesional de cristal templado e iluminación LED nocturna.', 4, 150.00, 0.00, '07:00', '22:00', 2, '["Calzado deportivo con suela de goma", "Turnos de máx 2 hrs"]'::jsonb, true),
        (5, 1, 'Gimnasio & Centro Fitness', 'Equipamiento cardiovascular LifeFitness, pesas libres y área de yoga con vista al mar.', 25, 0.00, 0.00, '06:00', '22:00', 2, '["Uso de toalla personal obligatorio", "Limpiar aparatos tras su uso"]'::jsonb, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        capacity = EXCLUDED.capacity,
        cost_amount = EXCLUDED.cost_amount,
        rules = EXCLUDED.rules;
    `)
    console.log('✅ Amenidades del condominio sincronizadas')

    // 8. Conceptos y Estados de Cuenta Financieros
    const feesCount = await query(`SELECT count(*)::int as c FROM vecilomas.fee_statements;`)
    if (feesCount.rows[0].c === 0) {
      await query(`
        INSERT INTO vecilomas.fee_concepts (id, condominium_id, code, name, default_amount, is_recurring)
        VALUES 
          (1, 1, 'MANT-ORD', 'Cuota de Mantenimiento Ordinaria', 3500.00, true),
          (2, 1, 'FONDO-RES', 'Fondo de Reserva Anual', 500.00, true)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO vecilomas.fee_statements (folio, unit_id, concept_id, description, amount, late_fee_amount, issue_date, due_date, status)
        VALUES 
          ('CUOTA-2026-03-A101', 1, 1, 'Mantenimiento Ordinario - Marzo 2026', 3500.00, 0.00, '2026-03-01', '2026-03-10', 'pagado'),
          ('CUOTA-2026-04-A101', 1, 1, 'Mantenimiento Ordinario - Abril 2026', 3500.00, 0.00, '2026-04-01', '2026-04-10', 'pendiente'),
          ('CUOTA-2026-03-A102', 2, 1, 'Mantenimiento Ordinario - Marzo 2026', 3500.00, 0.00, '2026-03-01', '2026-03-10', 'pagado'),
          ('CUOTA-2026-04-A102', 2, 1, 'Mantenimiento Ordinario - Abril 2026', 3500.00, 0.00, '2026-04-01', '2026-04-10', 'pendiente'),
          ('CUOTA-2026-04-B204', 3, 1, 'Mantenimiento Ordinario - Abril 2026', 3500.00, 0.00, '2026-04-01', '2026-04-10', 'pagado'),
          ('CUOTA-2026-03-B205', 4, 1, 'Mantenimiento Ordinario - Marzo 2026', 3500.00, 350.00, '2026-03-01', '2026-03-10', 'vencido'),
          ('CUOTA-2026-04-PH01', 5, 1, 'Mantenimiento Ordinario - Abril 2026', 5200.00, 0.00, '2026-04-01', '2026-04-10', 'pagado');
      `)
      console.log('✅ Estados de cuenta y cuotas financieras generadas')
    }

    // 9. Tickets de Mantenimiento y Soporte
    const ticketsCount = await query(`SELECT count(*)::int as c FROM vecilomas.maintenance_tickets;`)
    if (ticketsCount.rows[0].c === 0) {
      await query(`
        INSERT INTO vecilomas.maintenance_tickets (ticket_number, condominium_id, unit_id, reported_by_user_id, location, category, title, description, priority, status, assigned_to)
        VALUES 
          ('TCK-2026-001', 1, 1, 28, 'Pasillo Torre A, Piso 1', 'Iluminación', 'Luminaria parpadeando en pasillo de Torre A', 'La luz empotrada en el techo afuera del depto A-101 presenta intermitencia constante.', 'media', 'en_proceso', 'Ing. Electricista - Roberto Nava'),
          ('TCK-2026-002', 1, 3, 30, 'Área Alberca', 'Plomería', 'Revisión de presión de agua en alberca', 'Baja presión detectada en regaderas exteriores de la zona de alberca.', 'baja', 'pendiente', 'Servicios Hidráulicos del Noroeste'),
          ('TCK-2026-003', 1, 5, 31, 'Caseta Norte', 'Acceso', 'Calibración de sensor de portón vehicular', 'El sensor de caseta norte tarda en abrir para residentes con tag.', 'alta', 'resuelto', 'Sistemas de Seguridad Peñasco');
      `)
      console.log('✅ Tickets de mantenimiento generados')
    }

    console.log('\n✨ ¡Base de datos PostgreSQL sincronizada y enriquecida con éxito en Supabase!')
  } catch (err: any) {
    console.error('❌ Error ejecutando seeder:', err)
  } finally {
    await pool.end()
  }
}

seedDatabase()
