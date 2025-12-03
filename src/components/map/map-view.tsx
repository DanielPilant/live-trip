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
import { Site, Report } from "@/lib/types";
import { ReportForm } from "@/components/report/report-form";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, useMemo } from "react";
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
  const [userReport, setUserReport] = useState<Report | null>(null);
  const [showForm, setShowForm] = useState(false);
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

  // Fetch user's report when selectedSite changes
  useEffect(() => {
    async function fetchUserReport() {
      if (!selectedSite) {
        setUserReport(null);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserReport(null);
          return;
        }

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("site_id", selectedSite.id)
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setUserReport(data as Report);
        } else {
          setUserReport(null);
        }
      } catch (err) {
        console.error("Error fetching user report:", err);
        setUserReport(null);
      }
    }

    fetchUserReport();
  }, [selectedSite]);

  const handleMarkerClick = (site: Site) => {
    onSiteSelect?.(site);
    setShowForm(false);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleDelete = () => {
    setUserReport(null);
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    if (selectedSite) {
      setShowForm(false);
    }
  };

  // Combine sites with selectedSite if it's not in the list
  const displaySites = useMemo(() => {
    if (selectedSite && !sites.find((s) => s.id === selectedSite.id)) {
      return [...sites, selectedSite];
    }
    return sites;
  }, [sites, selectedSite]);

  return (
    <>
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

        {displaySites.map((site) => (
          <Marker
            key={site.id}
            position={[site.location.lat, site.location.lng]}
            icon={selectedSite?.id === site.id ? pinIcon : dotIcon}
            eventHandlers={{
              click: () => handleMarkerClick(site),
            }}
            ref={(ref) => {
              if (ref) markerRefs.current[site.id] = ref;
            }}
          >
            <Popup maxWidth={320} autoPan={true} autoPanPadding={[50, 50]}>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-1">{site.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{site.description}</p>
                <div className="mb-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
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

                {/* Recent Reports List */}
                {selectedSite?.id === site.id && reports.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 mb-3">
                    <p className="text-xs font-semibold mb-1">
                      Recent Reports:
                    </p>
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

                {/* Show button in popup */}
                <div className="border-t pt-3 mt-3">
                  <button
                    onClick={handleShowForm}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    {userReport ? "Update Report" : "Create Report"}
                  </button>
                </div>
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

      {/* Modal Form - Outside of Leaflet Popup */}
      {selectedSite && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h2 className="text-lg font-bold flex-1 text-gray-800">
                  {selectedSite.name}
                </h2>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      selectedSite.crowd_level === "low"
                        ? "bg-green-100 text-green-800"
                        : selectedSite.crowd_level === "moderate"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedSite.crowd_level === "high"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedSite.crowd_level.toUpperCase()}
                  </span>
                </div>
              </div>
              <ReportForm
                siteId={selectedSite.id}
                siteName={selectedSite.name}
                existingReport={userReport}
                onSuccess={handleFormSuccess}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
