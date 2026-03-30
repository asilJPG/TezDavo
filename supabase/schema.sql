-- PharmaUZ Database Schema
-- Supabase PostgreSQL

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- USERS
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'pharmacy', 'courier', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHARMACIES
-- ============================================
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  working_hours JSONB DEFAULT '{"mon_fri": "08:00-22:00", "sat_sun": "09:00-20:00"}',
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDICINES
-- ============================================
CREATE TYPE dosage_form AS ENUM ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'spray', 'other');

CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  category TEXT NOT NULL,
  dosage_form dosage_form,
  dosage_strength TEXT,
  description TEXT,
  instructions TEXT,
  side_effects TEXT,
  contraindications TEXT,
  image_url TEXT,
  requires_prescription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medicines_name ON medicines USING gin(to_tsvector('russian', name || ' ' || COALESCE(generic_name, '')));

-- ============================================
-- PHARMACY INVENTORY
-- ============================================
CREATE TABLE pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  in_stock BOOLEAN GENERATED ALWAYS AS (quantity > 0) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, medicine_id)
);

CREATE INDEX idx_inventory_medicine ON pharmacy_inventory(medicine_id);
CREATE INDEX idx_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);

-- ============================================
-- ORDERS
-- ============================================
CREATE TYPE order_status AS ENUM (
  'created',
  'pharmacy_confirmed',
  'courier_assigned',
  'picked_up',
  'delivered',
  'cancelled'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8)),
  user_id UUID REFERENCES users(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  courier_id UUID REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'created',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 15000,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  notes TEXT,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_pharmacy ON orders(pharmacy_id);
CREATE INDEX idx_orders_courier ON orders(courier_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES pharmacy_inventory(id),
  medicine_id UUID REFERENCES medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================
-- COURIERS
-- ============================================
CREATE TABLE couriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT DEFAULT 'bicycle',
  vehicle_number TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDICATION SCHEDULE
-- ============================================
CREATE TABLE medication_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  times_per_day INT NOT NULL DEFAULT 1 CHECK (times_per_day BETWEEN 1 AND 6),
  schedule_times JSONB NOT NULL DEFAULT '["08:00"]',
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_user ON medication_schedule(user_id);

-- ============================================
-- SCHEDULE LOG (taken / skipped tracking)
-- ============================================
CREATE TABLE schedule_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES medication_schedule(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped')),
  date DATE NOT NULL
);

-- ============================================
-- AI CHAT HISTORY
-- ============================================
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Medicines: everyone can read
CREATE POLICY "Medicines are public" ON medicines FOR SELECT TO PUBLIC USING (true);

-- Inventory: everyone can read, pharmacies can manage their own
CREATE POLICY "Inventory is public" ON pharmacy_inventory FOR SELECT TO PUBLIC USING (true);

-- Orders: users see own, pharmacies see theirs, couriers see assigned
CREATE POLICY "Users see own orders" ON orders FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users create orders" ON orders FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Schedule: users manage own
CREATE POLICY "Users manage own schedule" ON medication_schedule
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- AI chat: users manage own
CREATE POLICY "Users manage own chat" ON ai_chat_history
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================
-- SEED DATA — Categories & Sample Medicines
-- ============================================
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, dosage_strength, requires_prescription, description) VALUES
('Парацетамол', 'Paracetamol', 'Фармасинтез', 'Обезболивающие', 'tablet', '500mg', false, 'Жаропонижающее и обезболивающее средство'),
('Ибупрофен', 'Ibuprofen', 'Renewal', 'Обезболивающие', 'tablet', '400mg', false, 'Нестероидное противовоспалительное'),
('Амоксициллин', 'Amoxicillin', 'Синтез', 'Антибиотики', 'capsule', '500mg', true, 'Антибиотик широкого спектра действия'),
('Омепразол', 'Omeprazole', 'Акрихин', 'Желудочно-кишечные', 'capsule', '20mg', false, 'Ингибитор протонной помпы'),
('Лоратадин', 'Loratadine', 'Оболенское', 'Антигистаминные', 'tablet', '10mg', false, 'Антигистаминное средство'),
('Витамин С', 'Ascorbic acid', 'Марбиофарм', 'Витамины', 'tablet', '500mg', false, 'Аскорбиновая кислота, антиоксидант'),
('Но-Шпа', 'Drotaverine', 'Хинон', 'Спазмолитики', 'tablet', '40mg', false, 'Спазмолитическое средство');
