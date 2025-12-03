import { MapboxResult } from "@/lib/types";

export async function searchMapboxLocations(
  query: string
): Promise<MapboxResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    console.warn("Mapbox token is missing");
    return [];
  }

  if (!query || query.length < 3) return [];

  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${token}&types=place,locality,neighborhood,address,poi&limit=5`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.features.map((feature: any) => ({
      id: feature.id,
      text: feature.text,
      place_name: feature.place_name,
      center: feature.center, // [lng, lat]
    }));
  } catch (error) {
    console.error("Error searching Mapbox:", error);
    return [];
  }
}
