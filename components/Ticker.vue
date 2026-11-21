<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-white w-full flex items-stretch overflow-hidden h-20">
    <!-- World and local on top, interests below -->
    <div class="flex-1 min-w-0 flex flex-col divide-y divide-zinc-800">
      <TickerLine :items="news.data.value?.top ?? []" :empty-text="newsEmpty" />
      <TickerLine :items="news.data.value?.bottom ?? []" :empty-text="newsEmpty" />
    </div>
  </div>
</template>

<script setup>
import TickerLine from './TickerLine.vue';

const news = usePolled('/api/news', 15 * MINUTE);

const newsEmpty = computed(() => (news.loading.value ? 'Loading news...' : news.data.value ? '' : 'News unavailable'));
</script>
