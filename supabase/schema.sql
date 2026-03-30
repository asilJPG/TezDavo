-- ============================================================
-- ШАГ 1: Удаляем всё старое
-- ============================================================

DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS schedule_log CASCADE;
DROP TABLE IF EXISTS medication_schedule CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS couriers CASCADE;
DROP TABLE IF EXISTS pharmacy_inventory CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS dosage_form CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- ШАГ 2: Расширения
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ШАГ 3: Типы
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'pharmacy', 'courier', 'admin');
CREATE TYPE order_status AS ENUM ('created', 'pharmacy_confirmed', 'courier_assigned', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE dosage_form AS ENUM ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'spray', 'other');

-- ============================================================
-- ШАГ 4: Таблицы
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  role user_role NOT NULL DEFAULT 'user',
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '',
  license_number TEXT UNIQUE NOT NULL,
  working_hours JSONB DEFAULT '{"mon_fri": "08:00-22:00", "sat_sun": "09:00-20:00"}',
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, medicine_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8)),
  user_id UUID REFERENCES users(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  courier_id UUID REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'created',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 15000,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_address TEXT NOT NULL DEFAULT '',
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

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES pharmacy_inventory(id),
  medicine_id UUID REFERENCES medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

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

CREATE TABLE schedule_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES medication_schedule(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped')),
  date DATE NOT NULL
);

CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ШАГ 5: Триггер — автоматически создаёт профиль при регистрации
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- ШАГ 6: RLS
-- ============================================================

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

-- users
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- medicines — публичные для всех
CREATE POLICY "medicines_select" ON medicines FOR SELECT USING (true);

-- pharmacies — публичные для всех
CREATE POLICY "pharmacies_select" ON pharmacies FOR SELECT USING (true);

-- inventory — публичные для всех
CREATE POLICY "inventory_select" ON pharmacy_inventory FOR SELECT USING (true);

-- orders
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- schedule
CREATE POLICY "schedule_all" ON medication_schedule
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- schedule_log
CREATE POLICY "schedule_log_all" ON schedule_log
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ai chat
CREATE POLICY "chat_all" ON ai_chat_history
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- ШАГ 7: Seed — тестовые лекарства
-- ============================================================

INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, dosage_strength, requires_prescription, description) VALUES
('Парацетамол', 'Paracetamol', 'Фармасинтез', 'Обезболивающие', 'tablet', '500mg', false, 'Жаропонижающее и обезболивающее средство'),
('Ибупрофен', 'Ibuprofen', 'Renewal', 'Обезболивающие', 'tablet', '400mg', false, 'Нестероидное противовоспалительное'),
('Амоксициллин', 'Amoxicillin', 'Синтез', 'Антибиотики', 'capsule', '500mg', true, 'Антибиотик широкого спектра действия'),
('Омепразол', 'Omeprazole', 'Акрихин', 'Желудочно-кишечные', 'capsule', '20mg', false, 'Ингибитор протонной помпы'),
('Лоратадин', 'Loratadine', 'Оболенское', 'Антигистаминные', 'tablet', '10mg', false, 'Антигистаминное средство'),
('Витамин С', 'Ascorbic acid', 'Марбиофарм', 'Витамины', 'tablet', '500mg', false, 'Аскорбиновая кислота, антиоксидант'),
('Но-Шпа', 'Drotaverine', 'Хинон', 'Спазмолитики', 'tablet', '40mg', false, 'Спазмолитическое средство'),
('Цетиризин', 'Cetirizine', 'Renewal', 'Антигистаминные', 'tablet', '10mg', false, 'Антиаллергическое средство'),
('Метформин', 'Metformin', 'Акрихин', 'Диабет', 'tablet', '500mg', true, 'Препарат для лечения диабета 2 типа'),
('Эналаприл', 'Enalapril', 'Синтез', 'Сердечные', 'tablet', '10mg', true, 'Ингибитор АПФ, снижает давление');