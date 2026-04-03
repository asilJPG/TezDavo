"use client";
// src/components/pharmacy/ReviewsSection.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user: { full_name: string };
}

interface ReviewsSectionProps {
  pharmacyId: string;
  orderId?: string; // если пришёл с заказа — можно оставить отзыв
}

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <span
            className={`text-xl ${i <= (hover || rating) ? "text-yellow-400" : "text-gray-200"}`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ pharmacyId, orderId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviews();
  }, [pharmacyId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacies/${pharmacyId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!rating) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/pharmacies/${pharmacyId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
      } else {
        setSubmitted(true);
        setShowForm(false);
        loadReviews();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Отзывы</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="font-bold text-gray-900">{avgRating}</span>
            <span className="text-xs text-gray-400">
              ({reviews.length} отзывов)
            </span>
          </div>
        </div>
        {user && !submitted && orderId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-blue-600 font-medium"
          >
            {showForm ? "Отмена" : "+ Отзыв"}
          </button>
        )}
      </div>

      {/* Write review form */}
      {showForm && (
        <div className="px-4 py-4 bg-blue-50 border-b">
          <p className="text-sm font-medium text-gray-700 mb-2">Ваша оценка</p>
          <Stars rating={rating} interactive onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите отзыв (необязательно)..."
            rows={3}
            className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none bg-white"
          />
          {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          <button
            onClick={submitReview}
            disabled={submitting}
            className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Отправляем..." : "Отправить отзыв"}
          </button>
        </div>
      )}

      {submitted && (
        <div className="px-4 py-3 bg-green-50 border-b text-sm text-green-700">
          ✓ Спасибо за отзыв!
        </div>
      )}

      {/* Reviews list */}
      {loading && (
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">Пока нет отзывов</p>
          {user && orderId && !submitted && (
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 text-sm mt-1 font-medium"
            >
              Оставить первый отзыв
            </button>
          )}
        </div>
      )}

      <div className="divide-y">
        {reviews.map((review) => (
          <div key={review.id} className="px-4 py-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                  {review.user?.full_name?.slice(0, 1)?.toUpperCase() || "?"}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {review.user?.full_name || "Пользователь"}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <Stars rating={review.rating} />
            {review.comment && (
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
