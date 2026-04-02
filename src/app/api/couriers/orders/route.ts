// src/app/api/couriers/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
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
  if (!dbUser || dbUser.role !== "courier") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Все доступные заказы (pharmacy_confirmed) + заказы этого курьера
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      `*, pharmacy:pharmacies(id, name, address, phone), items:order_items(*)`,
    )
    .or(`status.eq.pharmacy_confirmed,courier_id.eq.${dbUser.id}`)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders });
}
