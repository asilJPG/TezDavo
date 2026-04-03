// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const week = new Date();
  week.setDate(week.getDate() - 7);
  const weekStr = week.toISOString();

  // Все заказы
  const { data: allOrders } = await supabaseAdmin
    .from("orders")
    .select("id, status, total_amount, created_at, delivery_fee");

  // Заказы за сегодня
  const todayOrders = (allOrders || []).filter((o) => o.created_at >= todayStr);

  // Заказы за неделю
  const weekOrders = (allOrders || []).filter((o) => o.created_at >= weekStr);

  // Пользователи
  const { count: totalUsers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: totalCouriers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "courier");

  // Аптеки
  const { count: totalPharmacies } = await supabaseAdmin
    .from("pharmacies")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);

  const { count: pendingPharmacies } = await supabaseAdmin
    .from("pharmacies")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", false);

  // Заказы по статусам
  const ordersByStatus = (allOrders || []).reduce(
    (acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {},
  );

  // Выручка
  const delivered = (allOrders || []).filter((o) => o.status === "delivered");
  const totalRevenue = delivered.reduce((s, o) => s + o.total_amount, 0);
  const todayRevenue = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total_amount, 0);
  const weekRevenue = weekOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total_amount, 0);

  // График заказов за 7 дней
  const dailyStats: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayOrders = (allOrders || []).filter(
      (o) =>
        o.created_at >= d.toISOString() && o.created_at < nextD.toISOString(),
    );
    const dayRevenue = dayOrders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.total_amount, 0);

    dailyStats.push({
      date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      orders: dayOrders.length,
      revenue: dayRevenue,
    });
  }

  return NextResponse.json({
    orders: {
      total: allOrders?.length || 0,
      today: todayOrders.length,
      week: weekOrders.length,
      byStatus: ordersByStatus,
    },
    revenue: {
      total: totalRevenue,
      today: todayRevenue,
      week: weekRevenue,
    },
    users: {
      total: totalUsers || 0,
      couriers: totalCouriers || 0,
    },
    pharmacies: {
      active: totalPharmacies || 0,
      pending: pendingPharmacies || 0,
    },
    dailyStats,
  });
}
