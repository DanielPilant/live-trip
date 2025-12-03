"use client";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Site, Report } from "@/lib/types";
import { ReportForm } from "@/components/report/report-form";
import { createClient } from "@/lib/supabase/client";

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
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [userReport, setUserReport] = useState<Report | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // @ts-expect-error - Leaflet icon fix
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const handleMarkerClick = async (site: Site) => {
    setSelectedSite(site);
    setShowForm(false); // Reset form visibility

    // Fetch user's report for this site
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserReport(null);
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("site_id", site.id)
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
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleDelete = () => {
    setUserReport(null);
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    // Refresh the report after submit/update
    if (selectedSite) {
      handleMarkerClick(selectedSite);
    }
  };

  return (
    <>
      <MapContainer
        center={[31.7658, 35.1911]}
        zoom={15}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        {sites.map((site) => (
          <Marker
            key={site.id}
            position={[site.location.lat, site.location.lng]}
            eventHandlers={{
              click: () => handleMarkerClick(site),
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
      </MapContainer>

      {/* Modal Form - Outside of Leaflet Popup */}
      {selectedSite && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h2 className="text-lg font-bold flex-1 text-gray-800">{selectedSite.name}</h2>
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
