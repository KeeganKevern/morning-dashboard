<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-50 w-full h-full p-2.5 flex flex-col min-h-0">
    <!-- Which change is showing: the active period is highlighted -->
    <div class="flex items-center justify-between mb-2">
      <span class="title-trim text-xs font-semibold tracking-widest uppercase text-zinc-400">Markets</span>
      <div class="flex rounded-md border border-zinc-700 overflow-hidden text-[0.65rem] font-semibold uppercase tracking-wider">
        <span
          v-for="p in PERIODS"
          :key="p.key"
          class="px-2 py-0.5 transition-colors duration-500"
          :class="p.key === period.key ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500'"
        >{{ p.short }}</span>
      </div>
    </div>

    <div v-if="!indices.length" class="flex-1 flex items-center justify-center text-sm" :class="loading ? 'text-zinc-500' : 'text-red-400'">
      {{ loading ? 'Loading markets...' : 'Markets unavailable' }}
    </div>

    <!-- 2x2: each index with its latest close and the change over the current period -->
    <div v-else class="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-2">
      <!-- Each card is a size container, so its text scales to the card on any screen -->
      <div
        v-for="i in indices"
        :key="i.id"
        class="stock-card min-h-0 min-w-0 overflow-hidden bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col items-center justify-center text-center leading-tight"
      >
        <span class="stock-name font-semibold text-zinc-200 whitespace-nowrap">{{ i.label }}</span>
        <span class="stock-last text-zinc-400 tabular-nums whitespace-nowrap">{{ formatNumber(i.last) }}</span>
        <Transition name="stocks-fade" mode="out-in">
          <div :key="period.key" class="flex flex-col items-center">
            <span
              class="stock-change font-bold tabular-nums whitespace-nowrap"
              :class="i[period.field] >= 0 ? 'text-emerald-400' : 'text-red-400'"
            >
              {{ i[period.field] >= 0 ? '▲' : '▼' }} {{ Math.abs(i[period.field]).toFixed(1) }}%
            </span>
            <!-- Exactly which closes the figure compares -->
            <span class="stock-since text-zinc-500 whitespace-nowrap">since {{ shortDate(i[period.sinceField]) }} · close {{ shortDate(i.closeAt) }}</span>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
const FLICK_MS = 10 * 1000;
const PERIODS = [
  { key: '7d', short: '7 days', field: 'change7dPct', sinceField: 'weekAgoAt' },
  { key: '3m', short: '3 months', field: 'change3mPct', sinceField: 'from' }
];

const { data, loading } = usePolled('/api/stocks', 60 * MINUTE);
const indices = computed(() => data.value?.indices ?? []);

// Flick between the 7-day and 3-month change
const periodIndex = ref(0);
const period = computed(() => PERIODS[periodIndex.value]);

let timer = null;
onMounted(() => { timer = setInterval(() => (periodIndex.value = (periodIndex.value + 1) % PERIODS.length), FLICK_MS); });
onBeforeUnmount(() => clearInterval(timer));

const formatNumber = n => n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Market dates are the trading day, so read them in UTC: "13 Nov"
const shortDate = iso => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '?');
</script>

<style>
/* Sizes follow the card's width and height (container units), within limits.
   Padding stays fixed: container units on the card itself would measure the screen. */
.stock-card {
  container-type: size;
  padding: 0.375rem 0.25rem;
  gap: 0.125rem;
}
.stock-name {
  font-size: clamp(0.65rem, min(8cqw, 13cqh), 1.15rem);
}
.stock-last {
  font-size: clamp(0.6rem, min(7.5cqw, 12cqh), 1.1rem);
}
.stock-change {
  font-size: clamp(0.8rem, min(14cqw, 22cqh), 2.5rem);
}
.stock-since {
  font-size: clamp(0.55rem, min(5.5cqw, 9cqh), 0.8rem);
}

.stocks-fade-enter-active,
.stocks-fade-leave-active {
  transition: opacity 0.4s ease;
}
.stocks-fade-enter-from,
.stocks-fade-leave-to {
  opacity: 0;
}
</style>
