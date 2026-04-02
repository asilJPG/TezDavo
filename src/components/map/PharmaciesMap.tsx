"use client";
// src/components/map/PharmaciesMap.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { GoogleMap } from "./GoogleMap";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  is_verified: boolean;
  rating: number;
  phone: string;
}

export function PharmaciesMap() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const { location, refetch: getLocation } = useGeolocation();

  useEffect(() => {
    fetch("/api/pharmacies")
      .then((r) => r.json())
      .then((d) => setPharmacies(d.pharmacies || []));
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  const markers = [
    ...pharmacies.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      title: p.name,
      type: "pharmacy" as const,
      id: p.id,
    })),
    ...(location
      ? [
          {
            lat: location.lat,
            lng: location.lng,
            title: "Вы",
            type: "user" as const,
          },
        ]
      : []),
  ];

  const handleMarkerClick = (marker: any) => {
    const pharmacy = pharmacies.find((p) => p.id === marker.id);
    if (pharmacy) setSelected(pharmacy);
  };

  return (
    <div className="relative">
      <GoogleMap
        center={location || { lat: 41.2995, lng: 69.2401 }}
        zoom={13}
        markers={markers}
        height="350px"
        className="shadow-sm"
        onMarkerClick={handleMarkerClick}
      />

      {/* Selected pharmacy popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{selected.name}</p>
                {selected.is_verified && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                📍 {selected.address}
              </p>
              <p className="text-xs text-gray-500">📞 {selected.phone}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 text-xl ml-2"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <a
              href={`https://maps.google.com/?q=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center py-2 border border-gray-200 rounded-xl text-xs text-gray-600 font-medium"
            >
              🗺 Google Maps
            </a>
            <Link
              href={`/pharmacy/${selected.id}`}
              className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Открыть аптеку
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
