import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const TG_GATEWAY = 'https://gatewayapi.telegram.org';

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
        verificationStatus === 'code_invalid' ? 'Неверный код' :
        verificationStatus === 'code_expired' ? 'Код устарел. Запросите новый' :
        'Неверный код';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // ── 2. Supabase: создаём или получаем пользователя ──────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@tezdavo.uz`;
    const password = makePassword(phone);

    // Регистрация — создаём нового пользователя
    if (name) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: role || 'user', name, phone },
      });

      if (createError || !newUser?.user) {
        console.error('createUser error:', createError);
        return NextResponse.json({ error: 'Ошибка создания аккаунта' }, { status: 500 });
      }

      await supabaseAdmin.from('users').upsert(
        { auth_id: newUser.user.id, full_name: name, phone, role: role || 'user' },
        { onConflict: 'auth_id' }
      );
    }

    // ── 3. Входим и получаем сессию ─────────────────────────────────────────
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: session, error: signInError } =
      await supabaseAnon.auth.signInWithPassword({ email, password });

    if (signInError || !session?.session) {
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
