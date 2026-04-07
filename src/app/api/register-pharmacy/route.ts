// src/app/api/auth/register-pharmacy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );

  try {
    const {
      auth_id,
      full_name,
      phone,
      email,
      pharmacy_name,
      pharmacy_address,
      license_number,
      lat,
      lng,
    } = await req.json();

    if (!auth_id || !pharmacy_name || !license_number) {
      return NextResponse.json(
        { error: "Не все поля заполнены" },
        { status: 400 },
      );
    }

    // 1. Создаём профиль пользователя с ролью pharmacy
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id,
        full_name: full_name || "",
        phone: phone || "",
        email: email || null,
        role: "pharmacy",
      })
      .select("id")
      .single();

    if (userError) {
      console.error("User insert error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 2. Геокодируем адрес
    let pharmacyLat = lat ?? 41.2995;
    let pharmacyLng = lng ?? 69.2401;

    if (pharmacy_address && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pharmacy_address + ", Ташкент, Узбекистан")}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`,
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry?.location) {
          pharmacyLat = geoData.results[0].geometry.location.lat;
          pharmacyLng = geoData.results[0].geometry.location.lng;
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }

    // 3. Создаём запись аптеки
    const { error: pharmacyError } = await supabaseAdmin
      .from("pharmacies")
      .insert({
        user_id: userProfile.id,
        name: pharmacy_name,
        address: pharmacy_address || "Ташкент",
        phone: phone || "",
        license_number,
        lat: pharmacyLat,
        lng: pharmacyLng,
        is_verified: false,
        is_active: false,
      });

    if (pharmacyError) {
      console.error("Pharmacy insert error:", pharmacyError);
      // Откатываем пользователя
      await supabaseAdmin.from("users").delete().eq("id", userProfile.id);
      return NextResponse.json(
        { error: pharmacyError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Register pharmacy exception:", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
