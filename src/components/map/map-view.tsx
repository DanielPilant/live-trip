"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useMemo } from "react";
import { Site, Report } from "@/lib/types";
import { MapController } from "./map-controller";

// Fix for default marker icon missing in Leaflet with Webpack/Next.js
const iconRetinaUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

interface MapViewProps {
  sites?: Site[];
  selectedSite?: Site | null;
  reports?: Report[];
  flyToLocation?: { lat: number; lng: number } | null;
  onSiteSelect?: (site: Site) => void;
}

export default function MapView({
  sites = [],
  selectedSite = null,
  reports = [],
  flyToLocation = null,
  onSiteSelect,
}: MapViewProps) {
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  const pinIcon = useMemo(
    () =>
      L.icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  const dotIcon = useMemo(
    () =>
      L.divIcon({
        className: "bg-blue-500 border-2 border-white rounded-full shadow-md",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -6],
      }),
    []
  );

  useEffect(() => {
    // @ts-expect-error - Leaflet icon fix
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  useEffect(() => {
    if (selectedSite && markerRefs.current[selectedSite.id]) {
      markerRefs.current[selectedSite.id]?.openPopup();
    }
  }, [selectedSite]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full z-0"
    >
      <MapController
        selectedSite={selectedSite}
        flyToLocation={flyToLocation}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.location.lat, site.location.lng]}
          icon={selectedSite?.id === site.id ? pinIcon : dotIcon}
          eventHandlers={{
            click: () => onSiteSelect?.(site),
          }}
          ref={(ref) => {
            if (ref) markerRefs.current[site.id] = ref;
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">{site.name}</h3>
              <p className="text-sm text-gray-600">{site.description}</p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    site.crowd_level === "low"
                      ? "bg-green-100 text-green-800"
                      : site.crowd_level === "moderate"
                      ? "bg-yellow-100 text-yellow-800"
                      : site.crowd_level === "high"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Crowd: {site.crowd_level.toUpperCase()}
                </span>
              </div>
              {selectedSite?.id === site.id && reports.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold mb-1">Recent Reports:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="text-xs text-gray-600 bg-gray-50 p-1 rounded"
                      >
                        {report.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {flyToLocation && !selectedSite && (
        <Marker
          position={[flyToLocation.lat, flyToLocation.lng]}
          icon={pinIcon}
        />
      )}
    </MapContainer>
  );
}
