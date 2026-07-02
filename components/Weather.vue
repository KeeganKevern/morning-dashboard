<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full h-full text-white flex flex-col justify-center">
    <div v-if="loading" class="text-zinc-500 text-sm">Loading weather...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>
    <div v-else-if="weather" class="flex flex-col gap-3">

      <div class="flex flex-col items-center gap-1">
        <span class="text-xs font-medium text-zinc-400 tracking-widest uppercase">{{ weather.location }}</span>
        <div class="flex items-baseline gap-3">
          <span class="text-5xl font-light text-zinc-50">{{ Math.round(weather.current.temp) }}°C</span>
          <span class="text-sm text-zinc-400">Feels like {{ Math.round(weather.current.feels_like) }}°C</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-zinc-400 mt-1">
          <span>💧 {{ weather.current.humidity }}%</span>
          <span>💨 {{ Math.round(weather.current.wind_speed) }} m/s</span>
          <span>🌅 {{ formatTime(weather.current.sunrise) }}</span>
          <span>🌇 {{ formatTime(weather.current.sunset) }}</span>
        </div>
      </div>

      <div class="flex gap-2">
        <div
          v-for="hour in weather.hourly"
          :key="hour.time"
          class="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 flex flex-col items-center gap-1"
        >
          <span class="text-[0.7rem] font-medium text-zinc-400">{{ formatTime(hour.time) }}</span>
          <span class="text-lg font-semibold text-zinc-50">{{ Math.round(hour.temp) }}°</span>
          <span class="text-[0.65rem] text-zinc-500 capitalize text-center">{{ hour.description }}</span>
          <span v-if="hour.pop > 20" class="text-[0.65rem] text-blue-400">💧 {{ Math.round(hour.pop) }}%</span>
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

onMounted(() => {
  fetchWeather();
  setInterval(fetchWeather, 30 * 60 * 1000);
});
</script>
