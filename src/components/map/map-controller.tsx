"use client";

import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { Site } from "@/lib/types";

interface MapControllerProps {
  selectedSite: Site | null;
  flyToLocation?: { lat: number; lng: number } | null;
}

export function MapController({
  selectedSite,
  flyToLocation,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedSite) {
      map.flyTo([selectedSite.location.lat, selectedSite.location.lng], 16, {
        duration: 1.5,
      });
    } else if (flyToLocation) {
      map.flyTo([flyToLocation.lat, flyToLocation.lng], 14, {
        duration: 1.5,
      });
    }
  }, [selectedSite, flyToLocation, map]);

  return null;
}
