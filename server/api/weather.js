// Weather from Open-Meteo (free for non-commercial use, no API key).
// Shows current conditions plus an hourly strip from 06:00 to 18:00:
// today's until 18:00, then tomorrow's.

const LAT = 53.9755;
const LON = -1.0908;
const TZ = 'Europe/London';
const FIRST_HOUR = 6;
const LAST_HOUR = 18;

// WMO weather codes -> short description + emoji (day, night)
const CODES = {
  0: ['Clear', '☀️', '🌙'],
  1: ['Mostly clear', '🌤️', '🌙'],
  2: ['Partly cloudy', '⛅', '☁️'],
  3: ['Overcast', '☁️', '☁️'],
  45: ['Fog', '🌫️', '🌫️'],
  48: ['Freezing fog', '🌫️', '🌫️'],
  51: ['Light drizzle', '🌦️', '🌧️'],
  53: ['Drizzle', '🌦️', '🌧️'],
  55: ['Heavy drizzle', '🌧️', '🌧️'],
  56: ['Freezing drizzle', '🌧️', '🌧️'],
  57: ['Freezing drizzle', '🌧️', '🌧️'],
  61: ['Light rain', '🌦️', '🌧️'],
  63: ['Rain', '🌧️', '🌧️'],
  65: ['Heavy rain', '🌧️', '🌧️'],
  66: ['Freezing rain', '🌧️', '🌧️'],
  67: ['Freezing rain', '🌧️', '🌧️'],
  71: ['Light snow', '🌨️', '🌨️'],
  73: ['Snow', '🌨️', '🌨️'],
  75: ['Heavy snow', '❄️', '❄️'],
  77: ['Snow grains', '🌨️', '🌨️'],
  80: ['Showers', '🌦️', '🌧️'],
  81: ['Showers', '🌧️', '🌧️'],
  82: ['Heavy showers', '🌧️', '🌧️'],
  85: ['Snow showers', '🌨️', '🌨️'],
  86: ['Snow showers', '🌨️', '🌨️'],
  95: ['Thunderstorm', '⛈️', '⛈️'],
  96: ['Thunderstorm', '⛈️', '⛈️'],
  99: ['Thunderstorm', '⛈️', '⛈️']
};

const describe = (code, isDay) => {
  const [description, day, night] = CODES[code] ?? ['Unknown', '🌡️', '🌡️'];
  return { description, icon: isDay ? day : night };
};

// Local date (YYYY-MM-DD) and hour in London, whatever the server's own timezone
const londonNow = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map(p => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

export default async () => {
  let data;
  try {
    data = await $fetch('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: LAT,
        longitude: LON,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
        hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
        daily: 'sunrise,sunset',
        timezone: TZ,
        forecast_days: 2,
        wind_speed_unit: 'mph'
      }
    });
  } catch (error) {
    console.error('Open-Meteo error:', error.data || error);
    throw createError({ statusCode: 502, message: 'Failed to reach Open-Meteo' });
  }

  // Open-Meteo returns local London times as "YYYY-MM-DDTHH:MM" strings
  const now = londonNow();
  const showTomorrow = now.hour >= LAST_HOUR;
  const dayIndex = showTomorrow ? 1 : 0;
  const forecastDate = data.daily.time[dayIndex];

  const h = data.hourly;
  const hourly = h.time
    .map((time, i) => ({ time, i }))
    .filter(({ time }) => {
      const hour = Number(time.slice(11, 13));
      return time.startsWith(forecastDate) && hour >= FIRST_HOUR && hour <= LAST_HOUR;
    })
    .map(({ time, i }) => ({
      time: time.slice(11, 16),
      temp: h.temperature_2m[i],
      pop: h.precipitation_probability[i] ?? 0,
      ...describe(h.weather_code[i], h.is_day[i]),
      past: !showTomorrow && Number(time.slice(11, 13)) < now.hour
    }));

  const c = data.current;
  return {
    location: 'York',
    day: showTomorrow ? 'Tomorrow' : 'Today',
    current: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      wind_mph: c.wind_speed_10m,
      ...describe(c.weather_code, c.is_day),
      sunrise: data.daily.sunrise[dayIndex].slice(11, 16),
      sunset: data.daily.sunset[dayIndex].slice(11, 16)
    },
    hourly,
    updated: new Date().toISOString()
  };
};
