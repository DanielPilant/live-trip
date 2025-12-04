"use client";

import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Site, Report } from "@/lib/types";
import { ReportForm } from "@/components/report/report-form";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { lightStyle, darkStyle } from "./map-styles";

interface MapViewProps {
  sites?: Site[];
  selectedSite?: Site | null;
  reports?: Report[];
  flyToLocation?: { lat: number; lng: number } | null;
  onSiteSelect?: (site: Site | null) => void;
}

// JCT - Machon Lev coordinates
const DEFAULT_CENTER = {
  latitude: 31.7658,
  longitude: 35.1911,
  zoom: 16,
};

export default function MapView({
  sites = [],
  selectedSite = null,
  reports = [],
  flyToLocation = null,
  onSiteSelect,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const [userReport, setUserReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // View state for the map
  const [viewState, setViewState] = useState(DEFAULT_CENTER);

  const isDark = resolvedTheme === "dark";
  const mapStyle = isDark ? darkStyle : lightStyle;

  console.log("MapView rendering, style:", mapStyle);

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
          setUserReport(data);
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

  // Handle flyToLocation
  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: 18,
        duration: 2000,
      });
    }
  }, [flyToLocation]);

  const handleMarkerClick = (e: any, site: Site) => {
    e.originalEvent.stopPropagation();
    if (onSiteSelect) onSiteSelect(site);
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    if (selectedSite) {
      setShowForm(false);
    }
  };

  const handleDelete = () => {
    setUserReport(null);
    setShowForm(false);
  };

  return (
    <div className="w-full h-full relative bg-gray-200 dark:bg-gray-800">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        mapLib={maplibregl}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        {sites.map((site) => (
          <Marker
            key={site.id}
            latitude={site.location.lat}
            longitude={site.location.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, site)}
          >
            <div className="cursor-pointer transform transition-transform hover:scale-110">
              <img
                src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
                alt={site.name}
                className="w-[25px] h-[41px]"
                style={{ filter: isDark ? "invert(1) hue-rotate(180deg)" : "none" }}
              />
            </div>
          </Marker>
        ))}

        {selectedSite && (
          <Popup
            latitude={selectedSite.location.lat}
            longitude={selectedSite.location.lng}
            anchor="top"
            onClose={() => onSiteSelect && onSiteSelect(null)}
            closeOnClick={true}
            closeButton={false}
            className="z-40"
            maxWidth="300px"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{selectedSite.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedSite.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Crowd Level:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedSite.crowd_level === "low"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : selectedSite.crowd_level === "moderate"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      : selectedSite.crowd_level === "high"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
                >
                  {selectedSite.crowd_level}
                </span>
              </div>

              {/* Recent Reports List */}
              {reports.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border mb-3">
                  <p className="text-xs font-semibold mb-1">
                    Recent Reports:
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="text-xs text-muted-foreground bg-muted p-1 rounded"
                      >
                        {report.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {userReport ? "Update Report" : "Report Status"}
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Modal Form Overlay */}
      {selectedSite && showForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto border">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h2 className="text-lg font-bold flex-1">
                  {selectedSite.name}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button>
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
    </div>
  );
}
