<template>
  <div class="bg-slate-800 h-fit rounded-md">
    <div v-if="loading">Loading weather...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="weather" class="weather-content">
      
      <!-- Current Weather -->
      <div class="current p-2 rounded-md flex flex-col items-center justify-center">
        <h2>{{ weather.location }}</h2>
        <div class="flex flex-wrap gap-4 justify-center items-center w-full mb-2">
          <div class="temp text-4xl font-bold text-blue-300">{{ Math.round(weather.current.temp) }}°C</div>
          <div class="feels-like text-lg text-blue-200">Feels like {{ Math.round(weather.current.feels_like) }}°C</div>
        </div>

        <div class="details">
          <span>💧 {{ weather.current.humidity }}%</span>
          <span>💨 {{ Math.round(weather.current.wind_speed) }} m/s</span>
        </div>
      </div>
      
      <!-- Hourly Forecast -->
      <div class=" ">

        <div class="flex">
          <div v-for="hour in weather.hourly" :key="hour.time" class="hour-block m-2 p-2 rounded-md flex flex-col items-center justify-center bg-slate-900">
            <div class="font-bold ">{{ formatTime(hour.time) }}</div>
            <div class="text-2xl text-blue-500">{{ Math.round(hour.temp) }}°</div>
            <div class="hour-desc">{{ hour.description }}</div>
            <div class="rain" v-if="hour.pop > 20">💧 {{ Math.round(hour.pop) }}%</div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
const weather = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchWeather = async () => {
  try {
    loading.value = true;
    const data = await $fetch('/api/weather');
    weather.value = data;
if (weather.value.hourly?.length) {
  // Keep all items except index 0 and 2
  weather.value.hourly = weather.value.hourly.filter((_, i) => i !== 0 && i !== 2);
}

    error.value = null;

  } catch (e) {
    error.value = 'Failed to load weather';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// Fetch on mount
onMounted(() => {
  fetchWeather();
  // Refresh every 30 minutes
  setInterval(fetchWeather, 30 * 60 * 1000);
});
</script>
<!-- 
<style>


.error {
  color: #ff4444;
  padding: 20px;
  text-align: center;
}

.current {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.current h2 {
  margin: 0 0 10px 0;
  font-size: 1.8em;
}

.temp {
  font-size: 4em;
  font-weight: bold;
  margin: 10px 0;
}

.feels-like {
  color: #aaa;
  font-size: 1em;
  margin-bottom: 5px;
}

.condition {
  font-size: 1.3em;
  color: #ddd;
  text-transform: capitalize;
  margin-bottom: 15px;
}

.details {
  display: flex;
  gap: 20px;
  justify-content: center;
  font-size: 1.1em;
  color: #aaa;
}

.hourly h3 {
  margin-bottom: 15px;
  font-size: 1.3em;
}

.hourly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.hour-block {
  background: #252525;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.time {
  font-weight: bold;
  margin-bottom: 8px;
  color: #4a9eff;
}

.hour-temp {
  font-size: 1.5em;
  font-weight: bold;
  margin: 5px 0;
}

.hour-desc {
  font-size: 0.85em;
  color: #aaa;
  text-transform: capitalize;
  margin-bottom: 5px;
}

.rain {
  font-size: 0.9em;
  color: #4a9eff;
}
</style> -->