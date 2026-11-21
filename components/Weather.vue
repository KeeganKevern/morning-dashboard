<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full h-full text-white flex flex-col justify-center">
    <div v-if="loading && !weather" class="text-zinc-500 text-sm">Loading weather...</div>
    <div v-else-if="error && !weather" class="text-red-400 text-sm">{{ error }}</div>
    <div v-else-if="weather" class="flex flex-col gap-3 min-h-0">

      <span class="text-xs font-semibold tracking-widest uppercase text-zinc-400">{{ weather.location }}</span>

      <div class="flex items-center gap-4">
        <span class="text-4xl leading-none">{{ weather.current.icon }}</span>
        <div class="flex flex-col">
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-light text-zinc-50">{{ Math.round(weather.current.temp) }}°</span>
            <span class="text-sm text-zinc-300">{{ weather.current.description }}</span>
          </div>
          <span class="text-xs text-zinc-400">Feels like {{ Math.round(weather.current.feels_like) }}°</span>
        </div>
        <div class="ml-auto grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-zinc-400">
          <span>💨 {{ Math.round(weather.current.wind_mph) }} mph</span>
          <span>💧 {{ weather.current.humidity }}%</span>
          <span>🌅 {{ weather.current.sunrise }}</span>
          <span>🌇 {{ weather.current.sunset }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-1 min-h-0">
        <span class="text-[0.65rem] font-medium tracking-widest uppercase text-zinc-500">{{ weather.day }} · 06:00–18:00</span>
        <div class="grid grid-cols-13 gap-0.5">
          <div
            v-for="hour in weather.hourly"
            :key="hour.time"
            class="bg-zinc-950 border border-zinc-800 rounded-md py-1.5 flex flex-col items-center gap-0.5"
            :class="{ 'opacity-40': hour.past }"
            :title="hour.description"
          >
            <span class="text-[0.6rem] text-zinc-400">{{ hour.time.slice(0, 2) }}</span>
            <span class="text-sm leading-none">{{ hour.icon }}</span>
            <span class="text-xs font-semibold text-zinc-50">{{ Math.round(hour.temp) }}°</span>
            <span class="text-[0.6rem]" :class="hour.pop >= 30 ? 'text-blue-400' : 'text-zinc-600'">{{ hour.pop }}%</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const { data: weather, loading, error: fetchError } = usePolled('/api/weather', 30 * MINUTE);
const error = computed(() => (fetchError.value ? 'Failed to load weather' : null));
</script>
