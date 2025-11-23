export interface Location {
  lat: number;
  lng: number;
}

export type CrowdLevel = "low" | "moderate" | "high" | "critical";

export interface Site {
  id: string;
  name: string;
  description?: string;
  location: Location;
  crowd_level: CrowdLevel;
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
