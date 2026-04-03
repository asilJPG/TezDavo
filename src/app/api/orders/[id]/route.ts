// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      pharmacy:pharmacies(id, name, address, phone),
      items:order_items(*),
      courier:users!orders_courier_id_fkey(id, full_name, phone)
    `,
    )
    .eq("id", params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
