export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export async function getWeatherForLocation(
  lat: number,
  lng: number
): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!apiKey) {
      console.error("Weather API key not configured");
      return null;
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&aqi=no`
    );

    if (!response.ok) {
      console.error("Weather API error:", response.statusText);
      return null;
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.current.temp_c),
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_kph),
      icon: data.current.condition.icon,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}
