// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendPushToMany } from "@/lib/firebase-admin";
import { OrderStatus } from "@/types";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["pharmacy_confirmed", "cancelled"],
  pharmacy_confirmed: ["courier_assigned", "cancelled"],
  courier_assigned: ["picked_up", "cancelled"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

const NOTIFICATIONS: Record<string, { title: string; body: string }> = {
  pharmacy_confirmed: {
    title: "✅ Заказ подтверждён",
    body: "Аптека подтвердила ваш заказ. Ищем курьера...",
  },
  courier_assigned: {
    title: "🚴 Курьер назначен",
    body: "Курьер едет в аптеку за вашим заказом",
  },
  picked_up: {
    title: "📦 Курьер забрал заказ",
    body: "Курьер уже везёт ваш заказ",
  },
  delivered: {
    title: "🏠 Заказ доставлен",
    body: "Ваш заказ успешно доставлен!",
  },
  cancelled: { title: "❌ Заказ отменён", body: "Ваш заказ был отменён" },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { status, reason } = await req.json();

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = VALID_TRANSITIONS[order.status as OrderStatus] || [];
  if (!allowed.includes(status as OrderStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${status}` },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = { status };
  if (status === "pharmacy_confirmed")
    update.confirmed_at = new Date().toISOString();
  if (status === "courier_assigned") {
    update.courier_id = dbUser.id;
    update.assigned_at = new Date().toISOString();
  }
  if (status === "picked_up") update.picked_up_at = new Date().toISOString();
  if (status === "delivered") update.delivered_at = new Date().toISOString();
  if (status === "cancelled") update.cancelled_reason = reason || "Отменено";

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Push уведомление покупателю
  const notif = NOTIFICATIONS[status];
  if (notif && order.user_id) {
    try {
      const { data: tokens } = await supabaseAdmin
        .from("push_tokens")
        .select("token")
        .eq("user_id", order.user_id);

      if (tokens?.length) {
        await sendPushToMany(
          tokens.map((t: any) => t.token),
          notif.title,
          notif.body,
          `/order/${params.id}`,
        );
      }
    } catch (err) {
      console.error("Push failed:", err);
    }
  }

  return NextResponse.json({ order: data });
}
