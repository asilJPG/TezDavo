import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("medicines")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("name");

  if (q)
    query = query.or(
      `name.ilike.%${q}%,generic_name.ilike.%${q}%,manufacturer.ilike.%${q}%`
    );
  if (category) query = query.eq("category", category);

  const { data: medicines, error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const medicineIds = (medicines || []).map((m) => m.id);
  let prices: any[] = [];
  if (medicineIds.length > 0) {
    const { data } = await supabase
      .from("pharmacy_inventory")
      .select("medicine_id, price, pharmacy:pharmacies(name)")
      .in("medicine_id", medicineIds)
      .gt("quantity", 0)
      .order("price");
    prices = data || [];
  }

  const medicinesWithPrices = (medicines || []).map((med) => {
    const medPrices = prices.filter((p) => p.medicine_id === med.id);
    const cheapest = medPrices[0];
    return {
      ...med,
      min_price: cheapest?.price ?? null,
      pharmacy_name: (cheapest?.pharmacy as any)?.name ?? null,
      pharmacy_count: medPrices.length,
    };
  });

  return NextResponse.json({
    medicines: medicinesWithPrices,
    total: count,
    page,
    limit,
  });
}

// POST — создать новое лекарство (аптека добавляет то чего нет в базе)
export async function POST(req: NextRequest) {
  const { name, category, dosage_strength, dosage_form } = await req.json();

  if (!name || !category) {
    return NextResponse.json(
      { error: "Название и категория обязательны" },
      { status: 400 }
    );
  }

  const { data: medicine, error } = await supabaseAdmin
    .from("medicines")
    .insert({
      name,
      category,
      dosage_strength: dosage_strength || null,
      dosage_form: dosage_form || "other",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ medicine }, { status: 201 });
}
