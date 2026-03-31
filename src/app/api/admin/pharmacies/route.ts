// src/app/api/admin/pharmacies/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );

  const { data: pharmacies, error } = await supabaseAdmin
    .from("pharmacies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!pharmacies?.length) return NextResponse.json({ pharmacies: [] });

  const userIds = pharmacies.map((p: any) => p.user_id).filter(Boolean);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, phone")
    .in("id", userIds);

  const result = pharmacies.map((p: any) => ({
    ...p,
    owner: users?.find((u: any) => u.id === p.user_id) || null,
  }));

  return NextResponse.json({ pharmacies: result });
}
