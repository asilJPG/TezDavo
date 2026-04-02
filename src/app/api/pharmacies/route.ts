// src/app/api/pharmacies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const { data: pharmacies, error } = await supabase
    .from("pharmacies")
    .select(
      "id, name, address, lat, lng, phone, is_verified, rating, working_hours",
    )
    .eq("is_active", true)
    .eq("is_verified", true)
    .limit(limit);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pharmacies });
}
