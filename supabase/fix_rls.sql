-- Запустить в Supabase Dashboard → SQL Editor

-- ============================================
-- ИСПРАВЛЕНИЕ 1: RLS для таблицы users
-- ============================================

-- Удаляем старые сломанные политики
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Новые правильные политики
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- ВАЖНО: разрешить INSERT при регистрации (без этого новые юзеры не создаются)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);


-- ============================================
-- ИСПРАВЛЕНИЕ 2: RLS для таблицы medicines
-- ============================================

-- Убедимся что medicines доступны всем (включая анонимных)
DROP POLICY IF EXISTS "Medicines are public" ON medicines;
CREATE POLICY "Medicines are public" ON medicines
  FOR SELECT USING (true);


-- ============================================
-- ИСПРАВЛЕНИЕ 3: pharmacy_inventory
-- ============================================

DROP POLICY IF EXISTS "Inventory is public" ON pharmacy_inventory;
CREATE POLICY "Inventory is public" ON pharmacy_inventory
  FOR SELECT USING (true);


-- ============================================
-- ИСПРАВЛЕНИЕ 4: pharmacies тоже должны быть публичными
-- ============================================

-- Проверяем есть ли RLS на pharmacies и добавляем политику
DROP POLICY IF EXISTS "Pharmacies are public" ON pharmacies;
CREATE POLICY "Pharmacies are public" ON pharmacies
  FOR SELECT USING (true);