// src/app/api/medicines/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: medicine, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !medicine) {
    return NextResponse.json(
      { error: "Лекарство не найдено" },
      { status: 404 }
    );
  }

  // Фильтруем по quantity > 0 (in_stock колонки нет в схеме)
  const { data: inventory } = await supabase
    .from("pharmacy_inventory")
    .select(
      `
      id,
      price,
      quantity,
      pharmacy:pharmacies(id, name, address, lat, lng, phone, rating, is_verified, working_hours)
    `
    )
    .eq("medicine_id", params.id)
    .gt("quantity", 0)
    .order("price", { ascending: true });

  return NextResponse.json({
    medicine,
    prices: inventory || [],
  });
}
