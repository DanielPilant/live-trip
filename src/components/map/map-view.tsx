"use client";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Site } from "@/lib/types";

// Fix for default marker icon missing in Leaflet with Webpack/Next.js
const iconRetinaUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

interface MapViewProps {
  sites?: Site[];
}

export default function MapView({ sites = [] }: MapViewProps) {
  useEffect(() => {
    // @ts-expect-error - Leaflet icon fix
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      {sites.map((site) => (
        <Marker key={site.id} position={[site.location.lat, site.location.lng]}>
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
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
