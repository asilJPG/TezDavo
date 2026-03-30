// src/app/api/admin/pharmacies/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: pharmacies, error } = await supabaseAdmin
    .from("pharmacies")
    .select(
      `
      *,
      owner:users(full_name, email, phone)
    `
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pharmacies });
}
