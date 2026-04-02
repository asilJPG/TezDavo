// src/app/api/couriers/me/route.ts
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
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: courier } = await supabaseAdmin
    .from("couriers")
    .select(
      "vehicle_type, vehicle_number, is_available, rating, total_deliveries",
    )
    .eq("user_id", dbUser.id)
    .single();

  return NextResponse.json({ courier });
}
