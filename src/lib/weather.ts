export interface WeatherInfo {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  weatherText: string;
  windSpeed: number;
  safetyAlert?: string;
  icon: string;
}

// Maps WMO Weather Interpretation Codes (https://open-meteo.com/en/docs)
export function mapWeatherCode(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
  if (code >= 1 && code <= 3) return { text: 'Partly Cloudy', icon: '⛅' };
  if (code === 45 || code === 48) return { text: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { text: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { text: 'Rainy', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { text: 'Snowy', icon: '❄️' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Overcast', icon: '☁️' };
}

export async function fetchLiveWeather(
  lat: number,
  lon: number,
  category?: string
): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache weather requests for 1 hour to prevent API hitting limits
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    
    const data = await response.json();
    const current = data.current;
    
    if (!current) return null;
    
    const { text, icon } = mapWeatherCode(current.weather_code);
    
    // Calculate dynamic safety alerts based on weather conditions and activity categories
    let safetyAlert = undefined;
    const temp = current.temperature_2m;
    const precip = current.precipitation;
    const wind = current.wind_speed_10m;
    
    if (precip > 1.5) {
      if (category === 'TREKKING') {
        safetyAlert = '⚠️ Heavy Rain Alert: Trails in the Western Ghats can be slippery. Stream crossings may experience high currents. Good traction boots and ponchos are mandatory.';
      } else if (category === 'CAMPING') {
        safetyAlert = '⚠️ Wet Camping Alert: Wet soil conditions. Tents will be pitched under tarps. Make sure to pack waterproof clothing.';
      } else if (category === 'WATER_SPORTS' || category === 'PARAGLIDING') {
        safetyAlert = '🚨 Activity Suspended: Water sports and paragliding activities are temporarily put on hold due to rain and poor visibility.';
      } else {
        safetyAlert = '⚠️ Rain Alert: Carry rain gear and protect electronic items in waterproof bags.';
      }
    } else if (temp > 35) {
      safetyAlert = '⚠️ High Heat Alert: Temperatures exceed 35°C. Carry extra electrolyte drinks and maintain hydration.';
    } else if (wind > 25) {
      if (category === 'PARAGLIDING' || category === 'WATER_SPORTS') {
        safetyAlert = '🚨 Wind Hazard Alert: High winds detected. Flights/cruises may be delayed or cancelled for safety reasons.';
      } else {
        safetyAlert = '⚠️ High Winds Alert: Expect gusty conditions on ridge hikes. Tie down camping equipment securely.';
      }
    }
    
    return {
      temperature: temp,
      humidity: current.relative_humidity_2m,
      apparentTemperature: current.apparent_temperature,
      precipitation: precip,
      weatherCode: current.weather_code,
      weatherText: text,
      windSpeed: wind,
      safetyAlert,
      icon,
    };
  } catch (error) {
    console.error('Error fetching live weather:', error);
    // Return mock fallback weather if the public Open-Meteo API is unreachable
    const mockTemp = 24 + Math.round(Math.random() * 8);
    return {
      temperature: mockTemp,
      humidity: 65,
      apparentTemperature: mockTemp + 2,
      precipitation: 0.0,
      weatherCode: 1,
      weatherText: 'Partly Cloudy (Simulated)',
      windSpeed: 10.5,
      safetyAlert: category === 'TREKKING' ? '⚠️ Adventure Safety: Stay on marked paths and follow your group guide.' : undefined,
      icon: '⛅',
    };
  }
}
