import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TG_GATEWAY = 'https://gatewayapi.telegram.org';

export async function POST(req: NextRequest) {
  try {
    const { phone, mode } = await req.json(); // mode: 'login' | 'register'

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    // ── Проверяем существование номера в базе ────────────────────────────────
    if (mode === 'login' || mode === 'register') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: existing } = await supabase
        .from('users')
        .select('auth_id')
        .eq('phone', phone)
        .single();

      if (mode === 'login' && !existing) {
        return NextResponse.json(
          { error: 'Аккаунт с этим номером не найден. Пожалуйста, зарегистрируйтесь.' },
          { status: 404 }
        );
      }

      if (mode === 'register' && existing) {
        return NextResponse.json(
          { error: 'Этот номер уже зарегистрирован. Войдите в аккаунт.' },
          { status: 409 }
        );
      }
    }

    // ── Отправляем OTP через Telegram Gateway ────────────────────────────────
    const resp = await fetch(`${TG_GATEWAY}/sendVerificationMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phone,
        code_length: 6,
      }),
    });

    const data = await resp.json();

    if (!data.ok) {
      console.error('Telegram Gateway send error:', data);
      return NextResponse.json(
        { error: 'Не удалось отправить код. Проверьте номер.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      request_id: data.result.request_id,
    });
  } catch (err) {
    console.error('send-otp exception:', err);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
