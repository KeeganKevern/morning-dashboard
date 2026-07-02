<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white w-full h-full max-h-[60vh] flex flex-col">
    <div v-if="loading" class="text-zinc-500 text-sm">Loading news...</div>
    <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>
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
const articles = ref([]);
const loading = ref(true);
const error = ref(null);
const updated = ref(null);
const scrollContainer = ref(null);
let scrollTimer = null;
let isPaused = false;

const fetchNews = async () => {
  try {
    loading.value = true;
    const data = await $fetch('/api/news');
    articles.value = data?.articles ?? [];
    updated.value = data?.updated ?? null;
    error.value = null;
  } catch (e) {
    console.error(e);
    error.value = 'Failed to load news';
  } finally {
    loading.value = false;
  }
};

const lastUpdatedLabel = computed(() => {
  if (!updated.value) return '';
  const d = new Date(updated.value);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
});

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

onMounted(async () => {
  await fetchNews();
  
  // Wait 5 seconds before starting to scroll
  setTimeout(() => {
    startAutoScroll();
  }, 5000);
});

onBeforeUnmount(() => {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
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