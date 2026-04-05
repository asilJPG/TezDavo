import { NextRequest, NextResponse } from 'next/server';

const TG_GATEWAY = 'https://gatewayapi.telegram.org';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

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
