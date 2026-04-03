// src/app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id, order_number, status, total_amount, delivery_address, created_at,
      pharmacy:pharmacies(name),
      items:order_items(id)
    `,
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders });
}
