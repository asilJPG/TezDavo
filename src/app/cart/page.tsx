"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Order } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";

const ACTIVE_STATUSES = [
  "created",
  "pharmacy_confirmed",
  "courier_assigned",
  "picked_up",
];

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    clear,
    pharmacyId,
  } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [loading, setLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(
    null,
  );
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasRxItems = items.some((i) => (i as any).requires_prescription);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const orders = d.orders || [];
        setActiveOrders(
          orders.filter((o: Order) => ACTIVE_STATUSES.includes(o.status)),
        );
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrescriptionFile(file);
    const reader = new FileReader();
    reader.onload = () => setPrescriptionPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPrescription = async (): Promise<string | null> => {
    if (!prescriptionFile) return null;
    setUploadingPrescription(true);
    try {
      const supabase = createClient();
      const ext = prescriptionFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, prescriptionFile);
      if (error) {
        console.error(error);
        return null;
      }
      const { data } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 дней
      if (error || !data) return null;
      return data.signedUrl;
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleOrder = async () => {
    if (!address.trim() || !pharmacyId) return;
    if (hasRxItems && !prescriptionFile) {
      alert("Для рецептурных лекарств необходимо загрузить фото рецепта");
      return;
    }
    setLoading(true);
    try {
      let prescriptionUrl: string | null = null;
      if (prescriptionFile) prescriptionUrl = await uploadPrescription();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          items: items.map((i) => ({
            inventory_id: i.inventory_id,
            quantity: i.quantity,
          })),
          delivery_address: address,
          notes,
          prescription_url: prescriptionUrl,
        }),
      });
      const data = await res.json();
      if (data.order) {
        clear();
        router.push(`/order/${data.order.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                className="text-gray-500 text-xl"
              >
                ←
              </button>
            )}
            <h1 className="font-bold text-gray-900 text-xl">
              {step === "cart" ? "Корзина" : "Оформление"}
            </h1>
          </div>
          <Link
            href="/profile/orders"
            className="flex items-center gap-1.5 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-xl"
          >
            <span>📦</span>
            <span>Мои заказы</span>
            {activeOrders.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-0.5">
                {activeOrders.length}
              </span>
            )}
          </Link>
        </div>

        {/* Active orders banner */}
        {activeOrders.length > 0 && (
          <div className="mb-4 space-y-2">
            {activeOrders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3"
              >
                <span className="text-xl">📦</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {order.order_number}
                  </p>
                  <p className="text-xs text-blue-600">
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
                <span className="text-blue-500 text-sm">→</span>
              </Link>
            ))}
          </div>
        )}

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <span className="text-6xl mb-4">🛒</span>
            <h2 className="font-bold text-gray-900 text-xl mb-2">
              Корзина пуста
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Добавьте лекарства из поиска
            </p>
            <Link
              href="/search"
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold"
            >
              Найти лекарства
            </Link>
          </div>
        ) : (
          <>
            {step === "cart" && (
              <div className="space-y-4">
                {hasRxItems && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                      <p className="text-sm font-semibold text-orange-800">
                        Рецептурные лекарства
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        При оформлении потребуется фото рецепта
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  {items[0] && (
                    <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">
                      🏪 {items[0].pharmacy_name}
                    </div>
                  )}
                  <div className="divide-y">
                    {items.map((item) => (
                      <div
                        key={item.inventory_id}
                        className="px-4 py-4 flex items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">💊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {item.medicine_name}
                            </p>
                            {(item as any).requires_prescription && (
                              <span className="text-orange-500 text-xs">
                                🔒
                              </span>
                            )}
                          </div>
                          <p className="text-blue-600 font-semibold text-sm">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.inventory_id,
                                item.quantity - 1,
                              )
                            }
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.inventory_id,
                                item.quantity + 1,
                              )
                            }
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.inventory_id)}
                            className="text-red-400 text-lg ml-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Товары</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Бесплатно</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Итого</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base"
                >
                  Оформить — {formatPrice(total)}
                </button>
              </div>
            )}

            {step === "checkout" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Адрес доставки *
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Введите адрес..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Комментарий курьеру
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Например: позвоните перед доставкой"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                {/* Prescription */}
                {hasRxItems && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🔒</span>
                      <label className="text-sm font-medium text-gray-700">
                        Фото рецепта *
                      </label>
                    </div>
                    {prescriptionPreview ? (
                      <div className="relative">
                        <img
                          src={prescriptionPreview}
                          alt="Рецепт"
                          className="w-full h-40 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setPrescriptionFile(null);
                            setPrescriptionPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          ✓ Рецепт загружен
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-3xl">📷</span>
                        <p className="text-sm text-gray-600 font-medium">
                          Загрузить фото рецепта
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG до 10MB
                        </p>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex justify-between font-bold text-gray-900 text-lg">
                    <span>К оплате</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Оплата наличными при получении
                  </p>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={
                    loading ||
                    !address.trim() ||
                    (hasRxItems && !prescriptionFile) ||
                    uploadingPrescription
                  }
                  className="w-full bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-base"
                >
                  {loading || uploadingPrescription
                    ? "Оформляем..."
                    : "Подтвердить заказ"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
