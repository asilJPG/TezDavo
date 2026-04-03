// src/app/api/pharmacies/[id]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      user:users(full_name)
    `,
    )
    .eq("pharmacy_id", params.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { rating, comment, order_id } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Рейтинг от 1 до 5" }, { status: 400 });
  }

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      pharmacy_id: params.id,
      user_id: dbUser.id,
      order_id: order_id || null,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Вы уже оставили отзыв на этот заказ" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
