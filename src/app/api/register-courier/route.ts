// src/app/api/register-courier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { auth_id, full_name, phone, email, vehicle_type, vehicle_number } =
      await req.json();

    if (!auth_id) {
      return NextResponse.json(
        { error: "auth_id обязателен" },
        { status: 400 },
      );
    }

    // 1. Создаём профиль с ролью courier
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id,
        full_name: full_name || "",
        phone: phone || "",
        email: email || null,
        role: "courier",
      })
      .select("id")
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 2. Создаём запись в таблице couriers
    const { error: courierError } = await supabaseAdmin
      .from("couriers")
      .insert({
        user_id: userProfile.id,
        vehicle_type: vehicle_type || "bicycle",
        vehicle_number: vehicle_number || null,
        is_available: false,
        is_active: true,
      });

    if (courierError) {
      console.error(
        "Ошибка при создании курьера (Айспик ебаный даун лох сука пидр):",
        JSON.stringify(courierError),
      );
      await supabaseAdmin.from("users").delete().eq("id", userProfile.id);
      return NextResponse.json(
        { error: courierError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
