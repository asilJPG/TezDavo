// src/app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

function verifyTelegramInitData(
  initData: string,
  botToken: string,
): Record<string, string> | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) return null;

  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  result["hash"] = hash;
  return result;
}

export async function POST(req: NextRequest) {
  const { initData } = await req.json();

  if (!initData) {
    return NextResponse.json({ error: "initData required" }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "Bot token not configured" },
      { status: 500 },
    );
  }

  // Верифицируем initData
  const data = verifyTelegramInitData(initData, botToken);
  if (!data) {
    return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
  }

  // Парсим данные пользователя
  const telegramUser = JSON.parse(data.user || "{}");
  const telegramId = telegramUser.id?.toString();
  const firstName = telegramUser.first_name || "";
  const lastName = telegramUser.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (!telegramId) {
    return NextResponse.json({ error: "No user data" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Ищем пользователя по telegram_id
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("auth_id")
    .eq("telegram_id", telegramId)
    .single();

  let authUserId: string;

  if (existingUser) {
    authUserId = existingUser.auth_id;
  } else {
    // Создаём нового пользователя
    const fakeEmail = `tg_${telegramId}@tezdavo.uz`;
    const fakePassword = `tg_${telegramId}_${botToken.slice(0, 8)}`;

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: fakePassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, telegram_id: telegramId },
    });

    if (error || !newUser.user) {
      // Пользователь уже существует — логиним
      const { data: session } = await supabaseAdmin.auth.admin.listUsers();
      const existing = session?.users?.find((u) => u.email === fakeEmail);
      if (!existing) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }
      authUserId = existing.id;
    } else {
      authUserId = newUser.user.id;

      // Создаём профиль
      await supabaseAdmin.from("users").insert({
        auth_id: authUserId,
        full_name: fullName,
        telegram_id: telegramId,
        role: "user",
      });
    }
  }

  // Логиним и получаем токены
  const fakeEmail = `tg_${telegramId}@tezdavo.uz`;
  const fakePassword = `tg_${telegramId}_${botToken.slice(0, 8)}`;

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: session, error: signInError } =
    await anonSupabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

  if (signInError || !session.session) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: {
      id: authUserId,
      full_name: fullName,
      telegram_id: telegramId,
    },
  });
}
