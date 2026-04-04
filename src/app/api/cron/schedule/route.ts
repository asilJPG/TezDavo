// src/app/api/cron/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToMany } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  // Защита — только Vercel Cron может вызывать
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Текущее время в Ташкенте (UTC+5)
  const now = new Date();
  const tashkentOffset = 5 * 60;
  const localTime = new Date(now.getTime() + tashkentOffset * 60 * 1000);
  const currentTime = localTime.toISOString().slice(11, 16); // "HH:MM"
  const currentDate = localTime.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Берём все активные расписания
  const { data: schedules } = await supabaseAdmin
    .from("medication_schedule")
    .select("id, user_id, medicine_name, dosage, schedule_times, end_date")
    .eq("is_active", true)
    .lte("start_date", currentDate);

  if (!schedules?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const schedule of schedules) {
    // Проверяем не истёк ли срок
    if (schedule.end_date && schedule.end_date < currentDate) continue;

    const times: string[] = schedule.schedule_times || [];

    for (const time of times) {
      // Проверяем совпадение времени (±2 минуты)
      if (!isTimeMatch(currentTime, time)) continue;

      // Проверяем не отправляли ли уже
      const { data: existing } = await supabaseAdmin
        .from("schedule_log")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("date", currentDate)
        .eq("scheduled_time", `${currentDate}T${time}:00+05:00`)
        .single();

      if (existing) continue;

      // Создаём запись в логе
      await supabaseAdmin.from("schedule_log").insert({
        schedule_id: schedule.id,
        user_id: schedule.user_id,
        scheduled_time: `${currentDate}T${time}:00+05:00`,
        date: currentDate,
        status: "pending",
      });

      // Получаем FCM токены пользователя
      const { data: tokens } = await supabaseAdmin
        .from("push_tokens")
        .select("token")
        .eq("user_id", schedule.user_id);

      if (!tokens?.length) continue;

      // Отправляем уведомление
      await sendPushToMany(
        tokens.map((t) => t.token),
        `💊 Время принять ${schedule.medicine_name}`,
        `Дозировка: ${schedule.dosage}`,
        "/profile/schedule",
      );

      sent++;
    }
  }

  return NextResponse.json({ sent, time: currentTime, date: currentDate });
}

function isTimeMatch(current: string, scheduled: string): boolean {
  const [ch, cm] = current.split(":").map(Number);
  const [sh, sm] = scheduled.split(":").map(Number);
  const diff = Math.abs(ch * 60 + cm - (sh * 60 + sm));
  return diff <= 2;
}
