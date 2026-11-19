<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-white w-full flex items-stretch overflow-hidden h-10">
    <div class="shrink-0 flex flex-col justify-center px-3 border-r border-zinc-800 text-[0.6rem] leading-tight text-zinc-500">
      <span>Markets {{ time(marketsUpdated) }}</span>
      <span>News {{ time(newsUpdated) }}</span>
    </div>

    <div class="relative flex-1 min-w-0 overflow-hidden">
      <div v-if="!items.length" class="h-full flex items-center px-3 text-sm" :class="failed ? 'text-red-400' : 'text-zinc-500'">
        {{ failed ? 'Failed to load markets and news' : 'Loading markets and news...' }}
      </div>

      <!-- Content is drawn twice; sliding by exactly one copy loops without a gap -->
      <div
        v-else
        ref="track"
        class="ticker-track absolute inset-y-0 left-0 flex items-center whitespace-nowrap"
        :style="{ animationDuration: `${duration}s` }"
      >
        <div v-for="copy in 2" :key="copy" class="flex items-center" :aria-hidden="copy === 2">
          <span v-for="item in items" :key="`${copy}-${item.key}`" class="flex items-center text-sm">
            <template v-if="item.type === 'index'">
              <span class="font-semibold text-zinc-100">{{ item.label }}</span>
              <span class="ml-1.5 text-zinc-400">{{ formatNumber(item.last) }}</span>
              <span class="ml-1.5 font-semibold" :class="item.change3mPct >= 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ item.change3mPct >= 0 ? '▲' : '▼' }} {{ Math.abs(item.change3mPct).toFixed(1) }}%
              </span>
              <span class="ml-1 text-[0.65rem] text-zinc-500">3m</span>
            </template>
            <template v-else>
              <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400">{{ item.source }}</span>
              <span class="ml-2 text-zinc-100">{{ item.title }}</span>
            </template>
            <span class="mx-5 text-zinc-600">•</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const PIXELS_PER_SECOND = 70;

const markets = usePolled('/api/stocks', 60 * MINUTE);
const news = usePolled('/api/news', 30 * MINUTE);

const marketsUpdated = markets.updatedLabel;
const newsUpdated = news.updatedLabel;
const failed = computed(() => !markets.loading.value && !news.loading.value && !markets.data.value && !news.data.value);

const items = computed(() => [
  ...(markets.data.value?.indices ?? []).map(i => ({ type: 'index', key: `i-${i.id}`, ...i })),
  ...(news.data.value?.articles ?? []).map(a => ({ type: 'news', key: `n-${a.id}`, source: a.source, title: a.title }))
]);

// "Updated 12:06 · retrying" -> "12:06 · retrying"; blank until the first load
const time = label => label.replace(/^Updated /, '') || '…';

const formatNumber = n => n.toLocaleString('en-GB', { maximumFractionDigits: 0 });

// Keep a steady reading speed whatever the content length
const track = ref(null);
const duration = ref(120);
let observer = null;

const measure = () => {
  if (track.value) duration.value = Math.max(20, track.value.scrollWidth / 2 / PIXELS_PER_SECOND);
};

watch(track, el => {
  observer?.disconnect();
  if (el) {
    observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
  }
});

// Also re-measure whenever the content changes (fonts or data arriving after mount)
watch(items, () => nextTick(measure));

onBeforeUnmount(() => observer?.disconnect());
</script>

<style>
.ticker-track {
  animation-name: ticker-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
</style>
