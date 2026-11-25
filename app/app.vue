<template>
  <div class="bg-zinc-950 text-zinc-50 h-screen flex flex-col overflow-hidden">
    <header class="relative flex items-center justify-center px-4 py-2 border-b border-zinc-800">
      <!-- One status for the whole screen: the latest refresh, and any source failing -->
      <span class="absolute left-4 text-[0.65rem] text-zinc-500">
        <template v-if="status.time">Updated {{ status.time }}</template>
        <span v-if="status.failing" class="text-amber-400"> · {{ status.failing }} retrying</span>
      </span>
      <span class="text-sm font-medium text-zinc-400 tracking-widest uppercase">{{ titleDate }}</span>
    </header>

    <!-- Act-first: what to act on gets the centre; glanceable things sit either side -->
    <section class="flex-1 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,0.9fr)] gap-3 p-3 pb-0 min-h-0">
      <!-- Left: the photo filling the space above the weather -->
      <div class="flex flex-col gap-3 min-h-0">
        <div class="flex-1 min-h-0"><Photos /></div>
        <div class="shrink-0"><Weather /></div>
      </div>

      <!-- Centre: the day ahead -->
      <div class="min-h-0"><Today /></div>

      <!-- Right: football, then the markets filling the rest -->
      <div class="flex flex-col gap-3 min-h-0">
        <div v-if="footData" class="shrink-0 flex flex-col gap-3">
          <FootballRotator :data="footData" />
          <FootballTable :table="footData.table ?? []" />
        </div>
        <div v-else class="shrink-0 py-8 flex justify-center items-center text-zinc-500 text-sm">
          {{ footballLoading ? 'Loading football data...' : 'Failed to load football data' }}
        </div>
        <div class="flex-1 min-h-0"><Stocks /></div>
      </div>
    </section>

    <footer class="p-3"><Ticker /></footer>
  </div>
</template>

<script setup>
import Weather from "../components/Weather.vue";
import Ticker from "~~/components/Ticker.vue";
import FootballRotator from "~~/components/FootballRotator.vue";
import FootballTable from "~~/components/FootballTable.vue";
import Photos from "~~/components/Photos.vue";
import Today from "~~/components/Today.vue";
import Stocks from "~~/components/Stocks.vue";

const titleDate = ref(null);
const { data: footData, loading: footballLoading } = usePolled("/api/football", 60 * MINUTE);
const status = useRefreshStatus();

// Keep the header date right if the dashboard is left on past midnight
let dateTimer = null;
onMounted(() => {
  titleDate.value = createTitleDate();
  dateTimer = setInterval(() => (titleDate.value = createTitleDate()), MINUTE);
});
onBeforeUnmount(() => clearInterval(dateTimer));

function createTitleDate() {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${weekday} ${day} ${month}`;
}
</script>
