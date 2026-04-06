// src/app/api/auth/register/route.ts
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
    }
  );
  try {
    const { auth_id, full_name, phone, email, role } = await req.json();

    if (!auth_id) {
      return NextResponse.json(
        { error: "auth_id обязателен" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("users").insert({
      auth_id,
      full_name: full_name || "",
      phone: phone || "",
      email: email || null,
      role: role || "user",
    });

    if (error) {
      console.error("Register error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Register exception:", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
