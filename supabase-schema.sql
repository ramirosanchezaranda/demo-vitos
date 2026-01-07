-- Crear tabla de gustos/sabores
CREATE TABLE IF NOT EXISTS flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  plu TEXT,
  price_per_kg INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para flavors
CREATE INDEX IF NOT EXISTS idx_flavors_plu ON flavors(plu);
CREATE INDEX IF NOT EXISTS idx_flavors_sort_order ON flavors(sort_order);

-- Crear tabla de movimientos
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  flow TEXT NOT NULL CHECK (flow IN ('in', 'out')),
  flavor_name TEXT NOT NULL,
  barcode TEXT NOT NULL,
  raw TEXT NOT NULL,
  weight_kg NUMERIC(10, 3),
  price_per_kg INTEGER,
  total INTEGER,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'void', 'corrected'))
);

-- Crear índices para movements
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_flow_created_at ON movements(flow, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_barcode ON movements(barcode);
CREATE INDEX IF NOT EXISTS idx_movements_flavor_name ON movements(flavor_name);

-- Habilitar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (ajusta según tus necesidades de seguridad)
CREATE POLICY "Permitir lectura pública de flavors" ON flavors
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de flavors" ON flavors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de flavors" ON flavors
  FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura pública de movements" ON movements
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de movements" ON movements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de movements" ON movements
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública de movements" ON movements
  FOR DELETE USING (true);
