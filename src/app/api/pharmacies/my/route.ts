// src/app/api/pharmacies/my/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
