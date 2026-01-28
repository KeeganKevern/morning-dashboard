export default async (event) => {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  const LAT = '53.97549228217195'; 
  const LON = '-1.0908162366261287'; 
  
  if (!API_KEY) {
    throw createError({
      statusCode: 500,
      message: 'API key not configured'
    });
  }
  
  try {
    // Get current weather
    const current = await $fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`
    );
    
    // Get 5-day forecast (includes 3-hour intervals, which we can use as "hourly-ish")
    const forecast = await $fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`
    );
    
    return {
      location: 'York',
      current: {
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        wind_speed: current.wind.speed
      },
      hourly: forecast.list.slice(0, 5)
      .map(item => ({
        time: new Date(item.dt * 1000).toISOString(),
        temp: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        pop: item.pop * 100 // probability of precipitation as percentage
      }))
    };
  } catch (error) {
    console.error('Weather API error:', error.data || error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch weather data: ' + (error.data?.message || error.message)
    });
  }
}