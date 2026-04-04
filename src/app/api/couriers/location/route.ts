// src/app/api/couriers/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { lat, lng, is_available } = await req.json();

  const update: Record<string, unknown> = {};
  if (lat !== undefined && lng !== undefined) {
    update.current_lat = lat;
    update.current_lng = lng;
  }
  if (is_available !== undefined) update.is_available = is_available;

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabaseAdmin
    .from("couriers")
    .update(update)
    .eq("user_id", dbUser.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
