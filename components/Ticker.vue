<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-white w-full flex items-stretch overflow-hidden h-20">
    <!-- Markets: all four indices always visible -->
    <div class="shrink-0 flex flex-col justify-center gap-1 px-3 border-r border-zinc-800">
      <div v-if="indices.length" class="grid grid-cols-2 gap-x-5 gap-y-0.5">
        <div v-for="i in indices" :key="i.id" class="flex items-baseline gap-1.5 text-sm whitespace-nowrap">
          <span class="font-semibold text-zinc-100">{{ i.label }}</span>
          <span class="text-zinc-400 tabular-nums">{{ formatNumber(i.last) }}</span>
          <span class="font-semibold tabular-nums" :class="i.change3mPct >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ i.change3mPct >= 0 ? '▲' : '▼' }}{{ Math.abs(i.change3mPct).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div v-else class="text-sm" :class="markets.loading.value ? 'text-zinc-500' : 'text-red-400'">
        {{ markets.loading.value ? 'Loading markets...' : 'Markets unavailable' }}
      </div>
      <div class="text-[0.6rem] leading-tight text-zinc-500">
        3-month change · Markets {{ time(markets.updatedLabel.value) }} · News {{ time(news.updatedLabel.value) }}
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
const newsEmpty = computed(() => (news.loading.value ? 'Loading news...' : news.data.value ? '' : 'News unavailable'));

// "Updated 12:06 · retrying" -> "12:06 · retrying"; blank until the first load
const time = label => label.replace(/^Updated /, '') || '…';

const formatNumber = n => n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
</script>
