export interface Location {
  lat: number;
  lng: number;
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
