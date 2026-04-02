// src/app/api/couriers/[id]/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: courier } = await supabaseAdmin
    .from("couriers")
    .select("current_lat, current_lng")
    .eq("user_id", params.id)
    .single();

  if (!courier)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    lat: courier.current_lat,
    lng: courier.current_lng,
  });
}
