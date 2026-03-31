"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";

interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: "Покупатель",
  pharmacy: "Аптека",
  courier: "Курьер",
  admin: "Админ",
};
const ROLE_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  pharmacy: "bg-green-100 text-green-700",
  courier: "bg-orange-100 text-orange-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">
            Пользователи
          </h1>
          <span className="text-xs text-gray-400">{users.length} всего</span>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону, email..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-3"
        />

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["all", "user", "pharmacy", "courier", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                roleFilter === r
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {r === "all" ? "Все" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500 text-sm">Пользователи не найдены</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
                {u.full_name?.slice(0, 1)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {u.full_name || "—"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {u.phone} · {u.email}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  ROLE_COLORS[u.role]
                }`}
              >
                {ROLE_LABELS[u.role] || u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
