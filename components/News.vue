<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white w-full h-full max-h-[60vh] flex flex-col">
    <div v-if="loading" class="text-zinc-500 text-sm">Loading news...</div>
    <div v-else-if="error && !data" class="text-red-400 text-xs">{{ error }}</div>
    <div v-else-if="articles.length" class="flex-1 min-h-0 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold tracking-widest uppercase text-zinc-400">Headlines</span>
        <span class="text-[0.65rem] text-zinc-500">{{ lastUpdatedLabel }}</span>
      </div>
      <div
        ref="scrollContainer"
        class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-3 news-scroll"
      >
        <div
          v-for="article in articles"
          :key="article.id"
          class="space-y-0.5"
        >
          <div class="text-sm text-zinc-100 leading-snug">{{ article.title }}</div>
          <div class="text-[0.7rem] text-zinc-500">{{ article.source }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data, loading, error: fetchError, updatedLabel: lastUpdatedLabel } = usePolled('/api/news', 30 * MINUTE);
const articles = computed(() => data.value?.articles ?? []);
const error = computed(() => (fetchError.value ? 'Failed to load news' : null));
const scrollContainer = ref(null);
let scrollTimer = null;
let startTimer = null;
let isPaused = false;

const startAutoScroll = () => {
  const el = scrollContainer.value;
  if (!el) return;
  
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
  
  const step = 1;
  const interval = 80;
  
  scrollTimer = setInterval(() => {
    if (!el || isPaused) return;
    
    if (el.scrollHeight <= el.clientHeight) {
      el.scrollTop = 0;
      return;
    }
    
    // Check if we're at the bottom
    if (el.scrollTop + el.clientHeight + 1 >= el.scrollHeight) {
      // Pause for 5 seconds
      isPaused = true;
setTimeout(() => {
  el.scrollTop = 0;
  setTimeout(() => {
    isPaused = false;
  }, 5000);
}, 5000);
    } else {
      el.scrollTop += step;
    }
  }, interval);
};

// Each time new headlines arrive, go back to the top and start scrolling after 5 seconds
watch(data, async () => {
  clearTimeout(startTimer);
  clearInterval(scrollTimer);
  scrollTimer = null;
  isPaused = false;
  await nextTick();
  if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
  startTimer = setTimeout(startAutoScroll, 5000);
});

onBeforeUnmount(() => {
  clearTimeout(startTimer);
  clearInterval(scrollTimer);
  scrollTimer = null;
});
</script>

<style>
.news-scroll::-webkit-scrollbar {
  display: none;
}
.news-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>