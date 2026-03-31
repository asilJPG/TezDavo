// src/app/api/pharmacy/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// GET — список товаров на складе
export async function GET() {
  const supabase = createClient();
  const pharmacyId = await getPharmacyId(supabase);
  if (!pharmacyId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await supabaseAdmin
    .from("pharmacy_inventory")
    .select(
      "id, quantity, price, medicine:medicines(id, name, category, dosage_strength)"
    )
    .eq("pharmacy_id", pharmacyId)
    .order("medicine_id" as any, { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

// POST — добавить лекарство на склад
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const pharmacyId = await getPharmacyId(supabase);
  if (!pharmacyId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { medicine_id, price, quantity } = await req.json();
  if (!medicine_id || !price || !quantity) {
    return NextResponse.json(
      { error: "Не все поля заполнены" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("pharmacy_inventory").upsert(
    {
      pharmacy_id: pharmacyId,
      medicine_id,
      price: Number(price),
      quantity: Number(quantity),
    },
    { onConflict: "pharmacy_id,medicine_id" }
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
