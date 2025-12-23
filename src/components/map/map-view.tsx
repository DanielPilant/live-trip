"use client";

import Map, {
  Marker,
  Popup,
  NavigationControl,
  MapRef,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Site, Report } from "@/lib/types";
import { ReportForm } from "@/components/report/report-form";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { lightStyle, darkStyle } from "./map-styles";
import { getWeatherForLocation } from "@/lib/services/weather-service";

// Initialize RTL Text Plugin
try {
  if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
    maplibregl.setRTLTextPlugin(
      "/mapbox-gl-rtl-text.min.js",
      true // Lazy load
    );
  }
} catch (error) {
  console.error("Failed to initialize RTL plugin:", error);
}

interface MapViewProps {
  sites?: Site[];
  selectedSite?: Site | null;
  reports?: Report[];
  flyToLocation?: { lat: number; lng: number } | null;
  onSiteSelect?: (site: Site | null) => void;
  language?: string;
}

const CROWD_LEVEL_COLORS = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

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
  language = "en",
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const [userReport, setUserReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sitesWithWeather, setSitesWithWeather] = useState<Site[]>([]);

  const [viewState, setViewState] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const isDark = resolvedTheme === "dark";
  const mapStyle = isDark ? darkStyle : lightStyle;

  const updateMapLanguage = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer: any) => {
        if (
          layer.type === "symbol" &&
          layer.layout &&
          layer.layout["text-field"]
        ) {
          const isLine = layer.layout["symbol-placement"] === "line";
          const separator = isLine ? "   " : "\n";

          // Try selected language, then English
          const primary = [
            "coalesce",
            ["get", `name:${language}`],
            ["get", "name:en"],
          ];
          const local = ["get", "name"];

          map.setLayoutProperty(layer.id, "text-field", [
            "case",
            // Show dual if primary exists AND is different from local
            ["all", ["!=", primary, null], ["!=", primary, local]],
            [
              "format",
              primary,
              { "font-scale": 1.0 },
              separator,
              {},
              local,
              {
                "font-scale": 1.1,
                "text-font": [
                  "literal",
                  ["DIN Offc Pro Italic", "Arial Unicode MS Regular"],
                ],
              },
            ],
            // Fallback: show primary (if exists) or local
            ["coalesce", primary, local],
          ]);
        }
      });
    }
  }, [language]);

  // Update map language when it changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (map.isStyleLoaded()) {
      updateMapLanguage();
    } else {
      map.once("style.load", updateMapLanguage);
    }
  }, [language, mapStyle, updateMapLanguage]);

  const onMapLoad = useCallback(
    (e: any) => {
      updateMapLanguage();
    },
    [updateMapLanguage]
  );

  const sitesGeoJSON = useMemo(() => {
    const features = sites
      .map((site) => {
        const element = site.polygon;
        if (!element) return null;

        let geometry = null;

        // Case 1: Relation (Multipolygon)
        if (element.type === "relation" && element.members) {
          const outerWays = element.members.filter(
            (m: any) => m.role === "outer" && m.type === "way" && m.geometry
          );

          if (outerWays.length > 0) {
            // Convert to segments: array of points [lon, lat]
            const segments = outerWays.map((w: any) =>
              w.geometry.map((p: any) => [p.lon, p.lat])
            );

            // Stitch segments
            const rings = [];
            while (segments.length > 0) {
              let currentRing = segments.pop(); // Start with the last one
              let changed = true;

              while (changed) {
                changed = false;
                const head = currentRing[0];
                const tail = currentRing[currentRing.length - 1];

                // Try to find a segment that connects to head or tail
                for (let i = 0; i < segments.length; i++) {
                  const seg = segments[i];
                  const segHead = seg[0];
                  const segTail = seg[seg.length - 1];

                  // Connect to tail
                  if (
                    Math.abs(segHead[0] - tail[0]) < 1e-6 &&
                    Math.abs(segHead[1] - tail[1]) < 1e-6
                  ) {
                    currentRing = currentRing.concat(seg.slice(1));
                    segments.splice(i, 1);
                    changed = true;
                    break;
                  }
                  // Connect to tail (reversed)
                  else if (
                    Math.abs(segTail[0] - tail[0]) < 1e-6 &&
                    Math.abs(segTail[1] - tail[1]) < 1e-6
                  ) {
                    currentRing = currentRing.concat(seg.reverse().slice(1));
                    segments.splice(i, 1);
                    changed = true;
                    break;
                  }
                  // Connect to head
                  else if (
                    Math.abs(segTail[0] - head[0]) < 1e-6 &&
                    Math.abs(segTail[1] - head[1]) < 1e-6
                  ) {
                    currentRing = seg.slice(0, -1).concat(currentRing);
                    segments.splice(i, 1);
                    changed = true;
                    break;
                  }
                  // Connect to head (reversed)
                  else if (
                    Math.abs(segHead[0] - head[0]) < 1e-6 &&
                    Math.abs(segHead[1] - head[1]) < 1e-6
                  ) {
                    currentRing = seg
                      .reverse()
                      .slice(0, -1)
                      .concat(currentRing);
                    segments.splice(i, 1);
                    changed = true;
                    break;
                  }
                }
              }

              // Close the ring if needed
              if (currentRing.length > 0) {
                const first = currentRing[0];
                const last = currentRing[currentRing.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                  currentRing.push(first);
                }
                rings.push(currentRing);
              }
            }

            if (rings.length === 1) {
              geometry = {
                type: "Polygon",
                coordinates: [rings[0]],
              };
            } else if (rings.length > 1) {
              geometry = {
                type: "MultiPolygon",
                coordinates: rings.map((r) => [r]),
              };
            }
          }
        }
        // Case 2: Simple Way (existing logic)
        else if (element.geometry && Array.isArray(element.geometry)) {
          const coordinates = element.geometry.map((p: any) => [p.lon, p.lat]);
          if (
            coordinates.length > 0 &&
            (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
              coordinates[0][1] !== coordinates[coordinates.length - 1][1])
          ) {
            coordinates.push(coordinates[0]);
          }
          geometry = {
            type: "Polygon",
            coordinates: [coordinates],
          };
        }

        if (!geometry) return null;

        return {
          type: "Feature",
          geometry,
          properties: {
            id: site.id,
            name: element.tags?.name || site.name,
            color: CROWD_LEVEL_COLORS[site.crowd_level] || "#888888",
          },
        };
      })
      .filter(Boolean);

    return {
      type: "FeatureCollection",
      features,
    };
  }, [sites]);

  console.log("MapView rendering, style:", mapStyle);

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Fall back to default location if geolocation fails
        }
      );
    }
  }, []);

  // Fetch weather data for all sites
  useEffect(() => {
    const fetchWeatherForSites = async () => {
      const sitesData = await Promise.all(
        sites.map(async (site) => {
          const weather = await getWeatherForLocation(
            site.location.lat,
            site.location.lng
          );
          return {
            ...site,
            weather: weather || undefined,
          };
        })
      );
      setSitesWithWeather(sitesData);
    };

    if (sites.length > 0) {
      fetchWeatherForSites();
    }
  }, [sites]);

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

  const handleCenterMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        duration: 1000,
      });
    }
  };

  return (
    <div className="w-full h-full relative bg-muted">
      <Map
        ref={mapRef}
        {...viewState}
        onLoad={onMapLoad}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        mapLib={maplibregl}
        attributionControl={false}
      >
        <Source id="sites-polygons" type="geojson" data={sitesGeoJSON as any}>
          <Layer
            id="sites-fill"
            type="fill"
            minzoom={13}
            paint={{
              "fill-color": ["get", "color"],
              "fill-opacity": 0.3,
            }}
          />
          <Layer
            id="sites-outline"
            type="line"
            minzoom={15}
            paint={{
              "line-color": ["get", "color"],
              "line-width": 2,
            }}
          />
        </Source>

        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {sitesWithWeather.map((site) => (
          <Marker
            key={site.id}
            latitude={site.location.lat}
            longitude={site.location.lng}
            anchor="bottom"
            onClick={(e: { originalEvent: MouseEvent }) =>
              handleMarkerClick(e, site)
            }
          >
            <div className="cursor-pointer transform transition-transform hover:scale-110">
              <img
                src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
                alt={site.name}
                className="w-[25px] h-[41px]"
                style={{
                  filter: isDark ? "invert(1) hue-rotate(180deg)" : "none",
                }}
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
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : selectedSite.crowd_level === "moderate"
                      ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                      : selectedSite.crowd_level === "high"
                      ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                      : "bg-red-500/15 text-red-700 dark:text-red-400"
                  }`}
                >
                  {selectedSite.crowd_level}
                </span>
              </div>

              {/* Weather Condition */}
              {selectedSite.weather && (
                <div className="bg-muted p-2 rounded mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Weather:</span>
                    <span className="text-xs">
                      {selectedSite.weather.temperature}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedSite.weather.icon}
                      alt={selectedSite.weather.condition}
                      className="w-6 h-6"
                    />
                    <div>
                      <p className="text-xs font-medium">
                        {selectedSite.weather.condition}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        💧 {selectedSite.weather.humidity}% | 💨{" "}
                        {selectedSite.weather.windSpeed} km/h
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Reports List */}
              {reports.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border mb-3">
                  <p className="text-xs font-semibold mb-1">Recent Reports:</p>
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
                {/* <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button> */}
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
