<template>
  <div class="bg-slate-800 rounded-md p-3 text-white w-120 h-56">
    <div v-if="loading">Loading news...</div>
    <div v-else-if="error" class="text-red-400 text-xs">
      {{ error }}
    </div>
    <div v-else-if="sections.length" class="h-full flex flex-col gap-2">
      <div class="flex items-baseline justify-between text-xs">
        <span class="font-semibold text-lg under">Headlines</span>
        <span class="text-[0.7rem] text-slate-400">
          {{ lastUpdatedLabel }}
        </span>
      </div>
      <div
        ref="scrollContainer"
        class="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-2 text-xs news-scroll"
      >
        <div
          v-for="section in sections"
          :key="section.id"
        >
          <div class="font-semibold text-[0.9rem] text-slate-200">
            {{ section.label }}
          </div>
          <ul class="list-disc list-inside space-y-0.5">

            <li
              v-for="item in section.items"
              :key="item.id"
              class="truncate"
            >
              <span class="text-[0.9rem]">
                {{ item.title }}
              </span>
             
            </li>
          </ul>
          <br/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const sections = ref([]);
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
    sections.value = data?.sections ?? [];
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
        isPaused = false;
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