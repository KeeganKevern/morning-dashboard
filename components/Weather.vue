<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full h-full text-zinc-50 flex flex-col justify-center">
    <div v-if="loading && !weather" class="text-zinc-500 text-sm">Loading weather...</div>
    <div v-else-if="error && !weather" class="text-red-400 text-sm">{{ error }}</div>
    <div v-else-if="weather" class="flex flex-col gap-3 min-h-0">

      <!-- Place, and when the rain is likely to start -->
      <div class="flex items-baseline justify-between gap-3">
        <span class="title-trim text-xs font-semibold tracking-widest uppercase text-zinc-400">{{ weather.location }}</span>
        <span class="text-xs font-semibold truncate" :class="weather.rainLikely ? 'text-blue-400' : 'text-emerald-400'">{{ weather.summary }}</span>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-4xl leading-none">{{ weather.current.icon }}</span>
        <div class="flex flex-col">
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-light text-zinc-50">{{ Math.round(weather.current.temp) }}°</span>
            <span class="text-sm text-zinc-300">{{ weather.current.description }}</span>
          </div>
          <span class="text-xs text-zinc-400">
            Feels like {{ Math.round(weather.current.feels_like) }}°<template v-if="weather.high !== null"> · High {{ weather.high }}° · Low {{ weather.low }}°</template>
          </span>
        </div>
      </div>

      <!-- One row under the conditions, so the figures have room to be read -->
      <div class="flex justify-between gap-2 text-sm text-zinc-300 whitespace-nowrap">
        <span>💨 {{ Math.round(weather.current.wind_mph) }} mph</span>
        <span>💧 {{ weather.current.humidity }}%</span>
        <span>🌅 {{ weather.current.sunrise }}</span>
        <span>🌇 {{ weather.current.sunset }}</span>
      </div>

      <!-- The day in three blocks; a block whose hours have all passed is dimmed -->
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="p in weather.periods"
          :key="p.name"
          class="bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-2 flex flex-col items-center gap-0.5"
          :class="{ 'opacity-40': p.past }"
          :title="p.description"
        >
          <span class="text-[0.65rem] font-semibold tracking-wider uppercase text-zinc-400">{{ p.name }}</span>
          <span class="text-[0.65rem] text-zinc-500 tabular-nums">{{ p.from }}–{{ p.to }}</span>
          <span class="text-3xl leading-tight">{{ p.icon }}</span>
          <span class="text-lg font-semibold tabular-nums">{{ p.min === p.max ? p.min : `${p.min}–${p.max}` }}°</span>
          <span class="text-xs tabular-nums" :class="p.pop >= 30 ? 'text-blue-400' : 'text-zinc-500'">💧 {{ p.pop }}%</span>
        </div>
      </div>

      <!-- Chance of rain hour by hour: the darker the bar, the likelier the rain -->
      <div class="flex flex-col gap-1">
        <span class="text-[0.65rem] font-medium tracking-widest uppercase text-zinc-500">{{ weather.day }} · chance of rain 06–18</span>
        <div class="flex gap-0.5">
          <div
            v-for="hour in weather.hourly"
            :key="hour.time"
            class="flex-1 flex flex-col items-center gap-0.5"
            :class="{ 'opacity-35': hour.past }"
            :title="`${hour.time}: ${hour.pop}%`"
          >
            <div class="w-full h-2.5 rounded-sm bg-blue-400" :style="{ opacity: Math.max(0.08, hour.pop / 100) }" />
            <span class="text-[0.55rem] text-zinc-500 tabular-nums">{{ hour.time.slice(0, 2) }}</span>
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
