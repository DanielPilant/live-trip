export interface Location {
  lat: number;
  lng: number;
}

export type CrowdLevel = "low" | "moderate" | "high" | "critical";

export interface WeatherCondition {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface Site {
  id: string;
  name: string;
  description?: string;
  location: Location;
  crowd_level: CrowdLevel;
  weather?: WeatherCondition;
  created_at: string;
}

export interface Report {
  id: string;
  site_id: string;
  user_id: string;
  content: string;
  crowd_level: CrowdLevel;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  locations?: Location[];
  created_at: string;
}

export interface MapboxResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}
