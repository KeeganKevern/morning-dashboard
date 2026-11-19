<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-white w-full flex items-stretch overflow-hidden h-20">
    <!-- Markets: all four indices always visible -->
    <div class="shrink-0 w-56 flex flex-col justify-center gap-1 px-3 border-r border-zinc-800">
      <!-- Two indices at a time, alternating -->
      <Transition v-if="indices.length" name="markets-fade" mode="out-in">
      <div :key="pairIndex" class="grid grid-cols-1 gap-y-0.5">
        <div v-for="i in visiblePair" :key="i.id" class="flex items-baseline gap-1.5 text-sm whitespace-nowrap">
          <span class="font-semibold text-zinc-100">{{ i.label }}</span>
          <span class="text-zinc-400 tabular-nums">{{ formatNumber(i.last) }}</span>
          <span class="font-semibold tabular-nums" :class="i.change3mPct >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ i.change3mPct >= 0 ? '▲' : '▼' }}{{ Math.abs(i.change3mPct).toFixed(1) }}%
          </span>
        </div>
      </div>
      </Transition>
      <div v-else class="text-sm" :class="markets.loading.value ? 'text-zinc-500' : 'text-red-400'">
        {{ markets.loading.value ? 'Loading markets...' : 'Markets unavailable' }}
      </div>
      <div class="text-[0.6rem] leading-tight text-zinc-500 whitespace-nowrap">
        3-month change · {{ time(markets.updatedLabel.value) }} · News {{ time(news.updatedLabel.value) }}
      </div>
    </div>

    <!-- News: world and local on top, interests below -->
    <div class="flex-1 min-w-0 flex flex-col divide-y divide-zinc-800">
      <TickerLine :items="news.data.value?.top ?? []" :empty-text="newsEmpty" />
      <TickerLine :items="news.data.value?.bottom ?? []" :empty-text="newsEmpty" />
    </div>
  </div>
</template>

<script setup>
import TickerLine from './TickerLine.vue';

const markets = usePolled('/api/stocks', 60 * MINUTE);
const news = usePolled('/api/news', 15 * MINUTE);

const indices = computed(() => markets.data.value?.indices ?? []);

// Show the indices two at a time, swapping every 10 seconds
const PAIR_MS = 10 * 1000;
const pairIndex = ref(0);
const pairCount = computed(() => Math.max(1, Math.ceil(indices.value.length / 2)));
const visiblePair = computed(() => indices.value.slice((pairIndex.value % pairCount.value) * 2, (pairIndex.value % pairCount.value) * 2 + 2));

let pairTimer = null;
onMounted(() => { pairTimer = setInterval(() => (pairIndex.value = (pairIndex.value + 1) % pairCount.value), PAIR_MS); });
onBeforeUnmount(() => clearInterval(pairTimer));
const newsEmpty = computed(() => (news.loading.value ? 'Loading news...' : news.data.value ? '' : 'News unavailable'));

// "Updated 12:06 · retrying" -> "12:06 · retrying"; blank until the first load
const time = label => label.replace(/^Updated /, '') || '…';

const formatNumber = n => n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
</script>

<style>
.markets-fade-enter-active,
.markets-fade-leave-active {
  transition: opacity 0.4s ease;
}
.markets-fade-enter-from,
.markets-fade-leave-to {
  opacity: 0;
}
</style>
