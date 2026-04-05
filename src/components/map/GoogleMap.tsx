"use client";
// src/components/map/GoogleMap.tsx
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

interface Marker {
  lat: number;
  lng: number;
  title?: string;
  type?: "pharmacy" | "courier" | "destination" | "user";
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Marker[];
  routeFrom?: { lat: number; lng: number };
  routeTo?: { lat: number; lng: number };
  height?: string;
  className?: string;
  onMarkerClick?: (marker: Marker) => void;
}

const TASHKENT = { lat: 41.2995, lng: 69.2401 };

const MARKER_ICONS = {
  pharmacy: "🏪",
  courier: "🚴",
  destination: "📍",
  user: "👤",
};

let isLoaded = false;
let isLoading = false;
const callbacks: (() => void)[] = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (isLoaded) {
      resolve();
      return;
    }
    callbacks.push(resolve);
    if (isLoading) return;
    isLoading = true;

    window.initGoogleMap = () => {
      isLoaded = true;
      isLoading = false;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=routes,marker&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export function GoogleMap({
  center = TASHKENT,
  zoom = 13,
  markers = [],
  routeFrom,
  routeTo,
  height = "300px",
  className = "",
  onMarkerClick,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

  useEffect(() => {
    loadGoogleMaps(apiKey).then(() => setMapReady(true));
  }, [apiKey]);

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;

    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#2563EB", strokeWeight: 4 },
    });
    renderer.setMap(map);
    directionsRendererRef.current = renderer;
  }, [mapReady]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markers.forEach((marker) => {
      const icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor:
          marker.type === "pharmacy"
            ? "#2563EB"
            : marker.type === "courier"
              ? "#16A34A"
              : marker.type === "user"
                ? "#7C3AED"
                : "#DC2626",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      };

      const m = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstanceRef.current,
        title: marker.title,
        icon,
      });

      if (onMarkerClick) {
        m.addListener("click", () => onMarkerClick(marker));
      }

      markersRef.current.push(m);
    });
  }, [markers, mapReady]);

  // Draw route
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !directionsRendererRef.current ||
      !routeFrom ||
      !routeTo
    )
      return;

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: routeFrom,
        destination: routeTo,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
        }
      },
    );
  }, [routeFrom, routeTo, mapReady]);

  if (!apiKey) {
    return (
      <div
        className={`bg-gray-100 rounded-2xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">Google Maps API key not set</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ height }}
    >
      {!mapReady && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">
          <p className="text-gray-400 text-sm">Загрузка карты...</p>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ display: mapReady ? "block" : "none" }}
      />
    </div>
  );
}
