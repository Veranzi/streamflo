"use client";

import { useEffect, useRef } from "react";

export interface MapMarker {
  id: number;
  name: string;
  county: string;
  lat: number;
  lng: number;
}

interface Props {
  markers: MapMarker[];
  onMarkerClick?: (id: number) => void;
  highlightId?: number | null;
}

export default function Map({ markers, onMarkerClick, highlightId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<unknown>(null);
  const markersLayerRef = useRef<unknown>(null);
  const markersByIdRef = useRef<Record<number, unknown>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || leafletMap.current) return;

      const map = L.map(mapRef.current).setView([-1.286389, 36.817223], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      leafletMap.current = map;
      markersLayerRef.current = layer;
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !leafletMap.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const layer = markersLayerRef.current as ReturnType<typeof L.layerGroup>;
      layer.clearLayers();
      markersByIdRef.current = {};

      markers.forEach((s) => {
        if (!s.lat || !s.lng) return;
        const marker = L.marker([s.lat, s.lng])
          .addTo(layer)
          .bindPopup(`<strong>${s.name}</strong><div class="text-xs">${s.county}</div>`);

        marker.on("click", () => onMarkerClick?.(s.id));
        markersByIdRef.current[s.id] = marker;
      });
    });
  }, [markers, onMarkerClick]);

  useEffect(() => {
    if (typeof window === "undefined" || !leafletMap.current || highlightId == null) return;

    import("leaflet").then((L) => {
      const marker = markersByIdRef.current[highlightId] as ReturnType<typeof L.marker> | undefined;
      if (marker) {
        const map = leafletMap.current as ReturnType<typeof L.map>;
        map.setView(marker.getLatLng(), 13, { animate: true });
        marker.openPopup();
      }
    });
  }, [highlightId]);

  return <div ref={mapRef} id="map" className="w-full rounded" />;
}
