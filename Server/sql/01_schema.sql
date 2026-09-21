-- =========================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - VECILOMAS (IDs Numéricos SERIAL 1, 2, 3...)
-- Ejecutar en el SQL Editor / pgAdmin como superusuario postgres
-- =========================================================================

-- 1. Eliminar tablas previas en orden
DROP TABLE IF EXISTS vecilomas.audit_logs CASCADE;
DROP TABLE IF EXISTS vecilomas.ticket_comments CASCADE;
DROP TABLE IF EXISTS vecilomas.maintenance_tickets CASCADE;
DROP TABLE IF EXISTS vecilomas.payments CASCADE;
DROP TABLE IF EXISTS vecilomas.fee_statements CASCADE;
DROP TABLE IF EXISTS vecilomas.fee_concepts CASCADE;
DROP TABLE IF EXISTS vecilomas.bookings CASCADE;
DROP TABLE IF EXISTS vecilomas.amenities CASCADE;
DROP TABLE IF EXISTS vecilomas.visit_logs CASCADE;
DROP TABLE IF EXISTS vecilomas.access_passes CASCADE;
DROP TABLE IF EXISTS vecilomas.user_permissions CASCADE;
DROP TABLE IF EXISTS vecilomas.vehicles CASCADE;
DROP TABLE IF EXISTS vecilomas.community_documents CASCADE;
DROP TABLE IF EXISTS vecilomas.notices CASCADE;
DROP TABLE IF EXISTS vecilomas.users CASCADE;
DROP TABLE IF EXISTS vecilomas.units CASCADE;
DROP TABLE IF EXISTS vecilomas.condominiums CASCADE;

-- 2. Asegurar Esquema
CREATE SCHEMA IF NOT EXISTS vecilomas;

-- 3. Crear Tablas con ID SERIAL (1, 2, 3...)
CREATE TABLE vecilomas.condominiums (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'MXN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.units (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  building_block VARCHAR(50),
  floor INT,
  status VARCHAR(50) DEFAULT 'al_corriente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.users (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  unit_id INT REFERENCES vecilomas.units(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  resident_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'activo',
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.vehicles (
  id SERIAL PRIMARY KEY,
  unit_id INT NOT NULL REFERENCES vecilomas.units(id) ON DELETE CASCADE,
  user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  plate_number VARCHAR(50) NOT NULL,
  brand_model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.access_passes (
  id SERIAL PRIMARY KEY,
  unit_id INT NOT NULL REFERENCES vecilomas.units(id) ON DELETE CASCADE,
  host_user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  qr_code VARCHAR(100) NOT NULL UNIQUE,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50),
  visit_type VARCHAR(50) NOT NULL DEFAULT 'visita',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_single_use BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.visit_logs (
  id BIGSERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  access_pass_id INT REFERENCES vecilomas.access_passes(id) ON DELETE SET NULL,
  unit_id INT NOT NULL REFERENCES vecilomas.units(id) ON DELETE CASCADE,
  guard_user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255) NOT NULL,
  host_name VARCHAR(255),
  visit_type VARCHAR(50) NOT NULL DEFAULT 'visita',
  vehicle_plate VARCHAR(50),
  entry_timestamp TIMESTAMPTZ DEFAULT NOW(),
  exit_timestamp TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'en_instalaciones',
  identification_notes TEXT,
  incident_reported BOOLEAN DEFAULT FALSE
);

CREATE TABLE vecilomas.amenities (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INT NOT NULL,
  cost_amount NUMERIC(10,2) DEFAULT 0.00,
  deposit_amount NUMERIC(10,2) DEFAULT 0.00,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  max_hours_per_booking INT DEFAULT 4,
  requires_approval BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  rules JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE vecilomas.bookings (
  id BIGSERIAL PRIMARY KEY,
  amenity_id INT NOT NULL REFERENCES vecilomas.amenities(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  unit_id INT NOT NULL REFERENCES vecilomas.units(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  guests_count INT NOT NULL,
  total_cost NUMERIC(10,2) DEFAULT 0.00,
  deposit_status VARCHAR(50) DEFAULT 'no_aplica',
  status VARCHAR(50) DEFAULT 'pendiente',
  approved_by_user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.fee_concepts (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  default_amount NUMERIC(10,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE
);

CREATE TABLE vecilomas.fee_statements (
  id SERIAL PRIMARY KEY,
  folio VARCHAR(50) NOT NULL UNIQUE,
  unit_id INT NOT NULL REFERENCES vecilomas.units(id) ON DELETE CASCADE,
  concept_id INT REFERENCES vecilomas.fee_concepts(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  late_fee_amount NUMERIC(10,2) DEFAULT 0.00,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.payments (
  id SERIAL PRIMARY KEY,
  fee_statement_id INT NOT NULL REFERENCES vecilomas.fee_statements(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  voucher_url VARCHAR(500),
  verified_by_user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'aprobado',
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.maintenance_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  unit_id INT REFERENCES vecilomas.units(id) ON DELETE SET NULL,
  reported_by_user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'media',
  status VARCHAR(50) DEFAULT 'pendiente',
  assigned_to VARCHAR(255),
  estimated_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE vecilomas.ticket_comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES vecilomas.maintenance_tickets(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.notices (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  author_user_id INT NOT NULL REFERENCES vecilomas.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  notice_type VARCHAR(50) NOT NULL DEFAULT 'comunicado',
  is_urgent BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE vecilomas.community_documents (
  id SERIAL PRIMARY KEY,
  condominium_id INT NOT NULL REFERENCES vecilomas.condominiums(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_by_user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vecilomas.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES vecilomas.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Otorgar permisos completos al usuario de la app (vecilomas_app)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA vecilomas TO vecilomas_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA vecilomas TO vecilomas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA vecilomas GRANT ALL ON TABLES TO vecilomas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA vecilomas GRANT ALL ON SEQUENCES TO vecilomas_app;

-- 5. Insertar Condominio inicial (ID: 1)
INSERT INTO vecilomas.condominiums (name, address, postal_code, city, currency)
VALUES ('Condominio Residencial Las Palomas', 'Av. Las Palmas #450, Fracc. Lomas del Valle', '76000', 'Santiago de Querétaro, Qro.', 'MXN');

-- 6. Insertar Cuentas de Acceso de Administración y Seguridad
-- ID 1: Administrador General (Pass: Admin2026!)
INSERT INTO vecilomas.users (condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status)
VALUES (1, NULL, 'admin@laspalomas.mx', '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG', 'Administrador General', '+52 55 1000-0001', 'admin', NULL, 'activo');

-- ID 2: Oficial de Caseta (Pass: Caseta2026!)
INSERT INTO vecilomas.users (condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status)
VALUES (1, NULL, 'caseta@laspalomas.mx', '$2b$10$MJ.PJLR5M8dVuavYgy6x.OoaDLyfkPXUToBFFoxHnYM.LmaiwTiS6', 'Oficial de Caseta', '+52 55 1000-0002', 'security', NULL, 'activo');
