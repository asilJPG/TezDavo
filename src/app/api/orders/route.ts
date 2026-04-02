// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const getAdminClient = () =>
  createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const supabaseAdmin = getAdminClient();
  let query = supabaseAdmin
    .from("orders")
    .select(
      `*, pharmacy:pharmacies(id, name, address, phone), items:order_items(*)`
    )
    .order("created_at", { ascending: false });

  if (dbUser.role === "user") {
    query = query.eq("user_id", dbUser.id);
  } else if (dbUser.role === "pharmacy") {
    const { data: pharmacy } = await supabaseAdmin
      .from("pharmacies")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();
    if (pharmacy) query = query.eq("pharmacy_id", pharmacy.id);
  } else if (dbUser.role === "courier") {
    query = query.eq("courier_id", dbUser.id);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    pharmacy_id,
    items,
    delivery_address,
    delivery_lat,
    delivery_lng,
    notes,
  } = body;

  if (!pharmacy_id || !items?.length || !delivery_address) {
    return NextResponse.json(
      { error: "Не все поля заполнены" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getAdminClient();

  // Проверяем инвентарь
  const inventoryIds = items.map(
    (i: { inventory_id: string }) => i.inventory_id
  );
  const { data: inventoryItems } = await supabaseAdmin
    .from("pharmacy_inventory")
    .select("id, price, quantity, medicine_id, medicine:medicines(name)")
    .in("id", inventoryIds)
    .eq("pharmacy_id", pharmacy_id);

  if (!inventoryItems || inventoryItems.length !== items.length) {
    return NextResponse.json(
      { error: "Некоторые товары недоступны" },
      { status: 400 }
    );
  }

  const DELIVERY_FEE = 15000;
  const orderItems = items.map(
    (item: { inventory_id: string; quantity: number }) => {
      const inv = inventoryItems.find((i) => i.id === item.inventory_id)!;
      return {
        inventory_id: item.inventory_id,
        medicine_id: inv.medicine_id,
        medicine_name: (inv.medicine as any)?.name || "Неизвестно",
        quantity: item.quantity,
        unit_price: inv.price,
      };
    }
  );

  const subtotal = orderItems.reduce(
    (sum: number, item: { quantity: number; unit_price: number }) =>
      sum + item.quantity * item.unit_price,
    0
  );

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: dbUser.id,
      pharmacy_id,
      status: "created",
      subtotal,
      delivery_fee: DELIVERY_FEE,
      total_amount: subtotal + DELIVERY_FEE,
      delivery_address,
      delivery_lat,
      delivery_lng,
      notes,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Order error:", orderError);
    return NextResponse.json(
      { error: "Ошибка создания заказа" },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("order_items")
    .insert(
      orderItems.map((item: object) => ({ ...item, order_id: order.id }))
    );

  return NextResponse.json({ order }, { status: 201 });
}
