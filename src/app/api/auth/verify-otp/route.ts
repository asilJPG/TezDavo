import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const TG_GATEWAY = 'https://gatewayapi.telegram.org';

// Генерирует детерминированный пароль из номера телефона + серверный секрет
function makePassword(phone: string) {
  return createHash('sha256')
    .update(`${phone}__${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 20)}`)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code, request_id, name, role } = await req.json();

    if (!phone || !code || !request_id) {
      return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
    }

    // ── 1. Проверяем код через Telegram Gateway ─────────────────────────────
    const verifyResp = await fetch(`${TG_GATEWAY}/checkVerificationStatus`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request_id, code }),
    });

    const verifyData = await verifyResp.json();
    console.log('Telegram Gateway verify response:', JSON.stringify(verifyData));

    const verificationStatus = verifyData.result?.verification_status?.status;

    if (!verifyData.ok || verificationStatus !== 'code_valid') {
      const msg =
        verificationStatus === 'code_invalid'
          ? 'Неверный код'
          : verificationStatus === 'code_expired'
          ? 'Код устарел. Запросите новый'
          : 'Неверный код';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // ── 2. Создаём / получаем пользователя в Supabase ──────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Используем номер телефона как основу для email (скрытый, пользователь его не видит)
    const digits = phone.replace(/\D/g, ''); // только цифры: 998901234567
    const email = `${digits}@tezdavo.uz`;
    const password = makePassword(phone);

    // Пробуем создать нового пользователя
    const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role || 'user',
        name: name || '',
        phone,
      },
    });

    // Если пользователь только что создан — добавляем в таблицу users
    if (newUser?.user) {
      await supabaseAdmin.from('users').upsert(
        {
          auth_id: newUser.user.id,
          full_name: name || '',
          phone,
          role: role || 'user',
        },
        { onConflict: 'auth_id' }
      );
    }

    // ── 3. Входим чтобы получить сессию ────────────────────────────────────
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: session, error: signInError } =
      await supabaseAnon.auth.signInWithPassword({ email, password });

    if (signInError || !session.session) {
      console.error('signIn error:', signInError);
      return NextResponse.json({ error: 'Ошибка входа в систему' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      role: session.user?.user_metadata?.role || 'user',
    });
  } catch (err) {
    console.error('verify-otp exception:', err);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
