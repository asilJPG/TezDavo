-- supabase/seed.sql — Тестовые данные для разработки

-- Тестовые аптеки (без user_id для seed)
INSERT INTO pharmacies (name, description, address, lat, lng, phone, license_number, is_verified, is_active, rating, review_count, working_hours) VALUES
('Аптека Хаёт',       'Крупная сеть аптек Ташкента', 'ул. Амира Темура 15, Ташкент', 41.2995, 69.2401, '+998712345678', 'LIC-001-2023', true, true, 4.8, 234, '{"mon_fri":"08:00-22:00","sat_sun":"09:00-21:00"}'),
('МедФарм',           'Профессиональная аптека',      'пр. Мустакиллик 32, Ташкент',  41.3111, 69.2792, '+998712345679', 'LIC-002-2023', true, true, 4.6, 189, '{"mon_fri":"09:00-21:00","sat_sun":"10:00-20:00"}'),
('Аптека 1',          'Аптека рядом с вами',          'ул. Навои 18, Ташкент',         41.2876, 69.2650, '+998712345680', 'LIC-003-2023', true, true, 4.5, 156, '{"mon_fri":"08:00-23:00","sat_sun":"08:00-23:00"}'),
('ФармаПлюс',         'Широкий ассортимент',           'ул. Чилонзор 7, Ташкент',       41.2760, 69.2100, '+998712345681', 'LIC-004-2023', true, true, 4.3, 98,  '{"mon_fri":"09:00-21:00","sat_sun":"10:00-19:00"}'),
('Шифо аптека',       'Доступные цены',                'ул. Яккасарай 22, Ташкент',     41.2823, 69.2560, '+998712345682', 'LIC-005-2023', true, true, 4.7, 201, '{"mon_fri":"08:00-22:00","sat_sun":"09:00-20:00"}');

-- Дополнительные лекарства к базовым из schema.sql
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, dosage_strength, requires_prescription, description, instructions, side_effects) VALUES
('Цетиризин',    'Cetirizine',    'Оболенское',  'Антигистаминные',    'tablet', '10mg',  false, 'Антигистаминный препарат второго поколения', 'Принимать 1 раз в день, вечером. Можно с едой или без', 'Сонливость, сухость во рту'),
('Метронидазол', 'Metronidazole', 'Синтез',      'Антибиотики',        'tablet', '500mg', true,  'Антибактериальный и противопротозойный препарат', 'Принимать 2–3 раза в день после еды', 'Тошнота, металлический привкус'),
('Нурофен',      'Ibuprofen',     'Reckitt',     'Обезболивающие',     'tablet', '200mg', false, 'Болеутоляющее и противовоспалительное средство', 'Принимать 1–2 таблетки каждые 4–6 часов', 'Тошнота, боль в желудке'),
('Диклофенак',   'Diclofenac',   'Renewal',     'Обезболивающие',     'tablet', '50mg',  false, 'НПВП, обезболивающее и противовоспалительное', 'Принимать 2–3 раза в день после еды', 'Желудочные расстройства'),
('Эналаприл',    'Enalapril',    'Акрихин',     'Сердечные',          'tablet', '10mg',  true,  'Ингибитор АПФ для лечения гипертензии', 'Принимать 1 раз в день, утром', 'Сухой кашель, головокружение'),
('Метформин',    'Metformin',    'Синтез',      'Эндокринология',     'tablet', '500mg', true,  'Сахаропонижающий препарат при диабете 2 типа', 'Принимать во время еды', 'Диарея, тошнота при начале лечения'),
('Фолиевая кислота', 'Folic acid', 'Марбиофарм', 'Витамины',          'tablet', '1mg',   false, 'Витамин B9, необходим для кроветворения', 'Принимать 1 раз в день', 'Аллергические реакции редко'),
('Пантопразол',  'Pantoprazole', 'Акрихин',     'Желудочно-кишечные', 'tablet', '40mg',  false, 'Ингибитор протонной помпы', 'Принимать за 30 мин до еды', 'Головная боль, диарея'),
('Амброксол',    'Ambroxol',     'Renewal',     'Противовирусные',    'tablet', '30mg',  false, 'Отхаркивающее средство при кашле', 'Принимать 3 раза в день после еды', 'Тошнота, аллергия редко'),
('Флуконазол',   'Fluconazole',  'Синтез',      'Антибиотики',        'capsule','150mg', false, 'Противогрибковый препарат', 'Однократный приём 150мг', 'Тошнота, головная боль');

-- Inventory — заполняем склады аптек
-- Получаем id аптек и лекарств через subquery
DO $$
DECLARE
  pharm1 UUID; pharm2 UUID; pharm3 UUID; pharm4 UUID; pharm5 UUID;
  m1 UUID; m2 UUID; m3 UUID; m4 UUID; m5 UUID; m6 UUID; m7 UUID;
BEGIN
  SELECT id INTO pharm1 FROM pharmacies WHERE license_number = 'LIC-001-2023';
  SELECT id INTO pharm2 FROM pharmacies WHERE license_number = 'LIC-002-2023';
  SELECT id INTO pharm3 FROM pharmacies WHERE license_number = 'LIC-003-2023';
  SELECT id INTO pharm4 FROM pharmacies WHERE license_number = 'LIC-004-2023';
  SELECT id INTO pharm5 FROM pharmacies WHERE license_number = 'LIC-005-2023';

  SELECT id INTO m1 FROM medicines WHERE name = 'Парацетамол';
  SELECT id INTO m2 FROM medicines WHERE name = 'Ибупрофен';
  SELECT id INTO m3 FROM medicines WHERE name = 'Амоксициллин';
  SELECT id INTO m4 FROM medicines WHERE name = 'Омепразол';
  SELECT id INTO m5 FROM medicines WHERE name = 'Лоратадин';
  SELECT id INTO m6 FROM medicines WHERE name = 'Витамин С';
  SELECT id INTO m7 FROM medicines WHERE name = 'Но-Шпа';

  -- Аптека 1 (самые низкие цены)
  INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, price) VALUES
  (pharm1, m1, 150, 4500), (pharm1, m2, 80, 6200), (pharm1, m3, 60, 18000),
  (pharm1, m4, 45, 8500), (pharm1, m5, 90, 9000), (pharm1, m6, 200, 6500), (pharm1, m7, 70, 11500)
  ON CONFLICT DO NOTHING;

  -- Аптека 2
  INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, price) VALUES
  (pharm2, m1, 200, 5000), (pharm2, m2, 120, 7000), (pharm2, m3, 40, 19500),
  (pharm2, m4, 55, 9200), (pharm2, m6, 180, 7000), (pharm2, m7, 90, 12000)
  ON CONFLICT DO NOTHING;

  -- Аптека 3
  INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, price) VALUES
  (pharm3, m1, 100, 4800), (pharm3, m3, 30, 17500), (pharm3, m5, 60, 8800),
  (pharm3, m7, 50, 11000)
  ON CONFLICT DO NOTHING;

  -- Аптека 4
  INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, price) VALUES
  (pharm4, m2, 70, 6500), (pharm4, m4, 80, 8000), (pharm4, m6, 250, 6000)
  ON CONFLICT DO NOTHING;

  -- Аптека 5
  INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, price) VALUES
  (pharm5, m1, 300, 4200), (pharm5, m2, 150, 5900), (pharm5, m5, 100, 8500),
  (pharm5, m7, 80, 10500)
  ON CONFLICT DO NOTHING;
END $$;
