// src/app/api/pharmacy/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const NO_STORE = {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) =>
      fetch(url, { ...options, cache: "no-store" }),
  },
};

async function getPharmacyId(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) return null;
  const { data: pharmacy } = await supabase
    .from("pharmacies")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();
  return pharmacy?.id || null;
}

export async function GET() {
  const supabase = createClient();
  const pharmacyId = await getPharmacyId(supabase);
  if (!pharmacyId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NO_STORE,
  );

  const { data: items, error } = await supabaseAdmin
    .from("pharmacy_inventory")
    .select(
      "id, quantity, price, requires_prescription, medicine:medicines(id, name, category, dosage_strength)",
    )
    .eq("pharmacy_id", pharmacyId)
    .order("medicine_id" as any, { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const pharmacyId = await getPharmacyId(supabase);
  if (!pharmacyId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { medicine_id, price, quantity, requires_prescription, mode } =
    await req.json();
  if (!medicine_id || !price || !quantity) {
    return NextResponse.json(
      { error: "Не все поля заполнены" },
      { status: 400 },
    );
  }

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NO_STORE,
  );

  if (mode === "arrival") {
    // Приход товара — суммируем количество
    const { data: existing } = await supabaseAdmin
      .from("pharmacy_inventory")
      .select("id, quantity")
      .eq("pharmacy_id", pharmacyId)
      .eq("medicine_id", medicine_id)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("pharmacy_inventory")
        .update({
          quantity: existing.quantity + Number(quantity),
          price: Number(price),
          requires_prescription: requires_prescription || false,
        })
        .eq("id", existing.id);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
  }

  const { error } = await supabaseAdmin.from("pharmacy_inventory").upsert(
    {
      pharmacy_id: pharmacyId,
      medicine_id,
      price: Number(price),
      quantity: Number(quantity),
      requires_prescription: requires_prescription || false,
    },
    { onConflict: "pharmacy_id,medicine_id" },
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
