"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

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
  /** County to highlight and zoom to (matches names in /data/counties.json) */
  selectedCounty?: string;
  /** Called when a county shape is clicked */
  onCountyClick?: (county: string) => void;
  /** Called when an empty spot on the map is clicked (used to pick a location) */
  onMapClick?: (lat: number, lng: number) => void;
  /** Map height in pixels (defaults to the #map size in globals.css) */
  height?: number;
}

// Kenya's bounding box with a little breathing room
const KENYA_BOUNDS: [[number, number], [number, number]] = [[-4.9, 33.7], [5.2, 42.1]];

const COLOR = {
  border: "#1e2d89",
  fill: "#3b66f5",
  selected: "#059669",
  marker: "#1d37d7",
  highlight: "#059669",
};

type CountyFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;

export default function Map({ markers, onMarkerClick, highlightId, selectedCounty, onCountyClick, onMapClick, height }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<Leaflet.Map | null>(null);
  const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const countiesLayerRef = useRef<Leaflet.GeoJSON | null>(null);
  const markersByIdRef = useRef<Record<number, Leaflet.CircleMarker>>({});

  // Keep latest callbacks without re-creating the map
  const cb = useRef({ onMarkerClick, onCountyClick, onMapClick, selectedCounty });
  cb.current = { onMarkerClick, onCountyClick, onMapClick, selectedCounty };

  // ---------- Create map once ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    import("leaflet").then(async (L) => {
      if (cancelled || !mapRef.current || leafletMap.current) return;

      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(KENYA_BOUNDS).pad(0.15),
        maxBoundsViscosity: 1,
        minZoom: 5,
        zoomSnap: 0.25,
        attributionControl: true,
      });
      map.fitBounds(KENYA_BOUNDS);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors | Boundaries: geoBoundaries",
        maxZoom: 18,
      }).addTo(map);

      map.on("click", (e: Leaflet.LeafletMouseEvent) => cb.current.onMapClick?.(e.latlng.lat, e.latlng.lng));

      leafletMap.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Fade everything outside Kenya
      try {
        const outline = (await fetch("/data/kenya-outline.json").then((r) => r.json())) as GeoJSON.FeatureCollection;
        if (cancelled) return;
        const world: [number, number][] = [[-85, -179.9], [-85, 179.9], [85, 179.9], [85, -179.9]];
        const holes: [number, number][][] = [];
        outline.features.forEach((f) => {
          const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
          const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
          polys.forEach((p) => holes.push(p[0].map(([lng, lat]) => [lat, lng] as [number, number])));
        });
        L.polygon([world, ...holes], {
          stroke: false,
          fillColor: "#f8fafc",
          fillOpacity: 0.88,
          interactive: false,
        }).addTo(map);
        L.geoJSON(outline, { style: { color: COLOR.border, weight: 2, fill: false }, interactive: false }).addTo(map);
      } catch {
        /* map still works without the mask */
      }

      // County borders
      try {
        const counties = (await fetch("/data/kenya-counties.json").then((r) => r.json())) as GeoJSON.FeatureCollection;
        if (cancelled) return;
        const layer = L.geoJSON(counties, {
          style: () => ({ color: COLOR.border, weight: 0.8, opacity: 0.5, fillColor: COLOR.fill, fillOpacity: 0 }),
          onEachFeature: (feature, lyr) => {
            const name = (feature as CountyFeature).properties.name;
            lyr.bindTooltip(name, { sticky: true, direction: "top", className: "county-tooltip" });
            lyr.on({
              mouseover: (e) => {
                if (name === cb.current.selectedCounty) return;
                (e.target as Leaflet.Path).setStyle({ fillOpacity: 0.12, weight: 1.5, opacity: 0.9 });
              },
              mouseout: (e) => {
                if (name === cb.current.selectedCounty) return;
                (e.target as Leaflet.Path).setStyle({ fillOpacity: 0, weight: 0.8, opacity: 0.5 });
              },
              click: (e) => {
                if (!cb.current.onCountyClick) return;
                L.DomEvent.stopPropagation(e);
                cb.current.onCountyClick(name);
              },
            });
          },
        }).addTo(map);
        layer.bringToBack();
        countiesLayerRef.current = layer;
        applyCountySelection(map, layer, cb.current.selectedCounty, false);
      } catch {
        /* borders are optional */
      }
    });

    return () => {
      cancelled = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // ---------- Selected county ----------
  useEffect(() => {
    const map = leafletMap.current;
    const layer = countiesLayerRef.current;
    if (!map || !layer) return;
    applyCountySelection(map, layer, selectedCounty, true);
  }, [selectedCounty]);

  // ---------- Markers ----------
  // Redraw only when the pins themselves change, not on every parent re-render
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const markersKey = markers.map((m) => `${m.id}:${m.lat}:${m.lng}`).join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const draw = () =>
      import("leaflet").then((L) => {
        const map = leafletMap.current;
        const layer = markersLayerRef.current;
        if (cancelled) return;
        if (!map || !layer) {
          // Map still initialising; try again shortly
          setTimeout(draw, 150);
          return;
        }
        layer.clearLayers();
        markersByIdRef.current = {};

        const valid = markersRef.current.filter((s) => s.lat && s.lng && !Number.isNaN(s.lat) && !Number.isNaN(s.lng));
        valid.forEach((s) => {
          const marker = L.circleMarker([s.lat, s.lng], {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: COLOR.marker,
            fillOpacity: 1,
          })
            .addTo(layer)
            .bindPopup(`<strong>${escapeHtml(s.name)}</strong><div style="font-size:12px;color:#64748b">${escapeHtml(s.county || "")}</div>`);
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            cb.current.onMarkerClick?.(s.id);
          });
          markersByIdRef.current[s.id] = marker;
        });

        // A single pin (school profile, registration) gets a closer view
        if (valid.length === 1 && !cb.current.selectedCounty) {
          map.setView([valid[0].lat, valid[0].lng], 12, { animate: false });
        }
      });

    draw();
    return () => { cancelled = true; };
  }, [markersKey]);

  // ---------- Highlighted marker ----------
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || highlightId == null) return;
    Object.entries(markersByIdRef.current).forEach(([id, m]) => {
      m.setStyle({ fillColor: Number(id) === highlightId ? COLOR.highlight : COLOR.marker, radius: Number(id) === highlightId ? 10 : 7 });
    });
    const marker = markersByIdRef.current[highlightId];
    if (marker) {
      map.setView(marker.getLatLng(), 13, { animate: true });
      marker.openPopup();
    }
  }, [highlightId]);

  return (
    <div
      ref={mapRef}
      id="map"
      style={height ? { height } : undefined}
      className={`relative z-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${onMapClick ? "cursor-crosshair" : ""}`}
    />
  );
}

function applyCountySelection(map: Leaflet.Map, layer: Leaflet.GeoJSON, county: string | undefined, resetWhenEmpty: boolean) {
  let target: Leaflet.Polygon | null = null;
  layer.eachLayer((lyr) => {
    const path = lyr as Leaflet.Polygon & { feature?: CountyFeature };
    const isSel = !!county && path.feature?.properties.name.toLowerCase() === county.toLowerCase();
    path.setStyle(
      isSel
        ? { color: COLOR.selected, weight: 2.5, opacity: 1, fillColor: COLOR.selected, fillOpacity: 0.12 }
        : { color: COLOR.border, weight: 0.8, opacity: 0.5, fillColor: COLOR.fill, fillOpacity: 0 }
    );
    if (isSel) target = path;
  });
  if (target) {
    map.fitBounds((target as Leaflet.Polygon).getBounds(), { padding: [20, 20], maxZoom: 10 });
  } else if (!county && resetWhenEmpty) {
    map.fitBounds(KENYA_BOUNDS);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
