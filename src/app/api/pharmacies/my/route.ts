// src/app/api/pharmacies/my/route.ts
import { NextRequest, NextResponse } from "next/server";
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

  const { data: pharmacy } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  return NextResponse.json({ pharmacy });
}

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
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, phone, working_hours } = await req.json();

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabaseAdmin
    .from("pharmacies")
    .update({ name, phone, working_hours })
    .eq("user_id", dbUser.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
