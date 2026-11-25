<template>
  <div class="relative flex-1 min-h-0 overflow-hidden">
    <div v-if="!items.length" class="h-full flex items-center px-3 text-sm text-zinc-500">{{ emptyText }}</div>

    <!-- Content is drawn twice; sliding by exactly one copy loops without a gap -->
    <div
      v-else
      ref="track"
      class="ticker-track absolute inset-y-0 left-0 flex items-center whitespace-nowrap"
      :style="{ animationDuration: `${duration}s` }"
    >
      <div v-for="copy in 2" :key="copy" class="flex items-center" :aria-hidden="copy === 2">
        <span v-for="item in items" :key="`${copy}-${item.tag}-${item.title}`" class="flex items-center text-sm">
          <span class="text-[0.6rem] font-semibold tracking-wider" :class="TAG_COLOURS[item.tag] ?? 'text-zinc-400'">{{ item.tag }}</span>
          <span v-if="isNew(item)" class="ml-1.5 rounded bg-red-600 px-1 text-[0.55rem] font-bold leading-4 text-white">NEW</span>
          <span class="ml-2 text-zinc-100">{{ item.title }}</span>
          <span class="mx-5 text-zinc-600">•</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const PIXELS_PER_SECOND = 60;
const NEW_FOR_MS = 60 * 60 * 1000;

const TAG_COLOURS = {
  NEWS: 'text-blue-400',
  YORK: 'text-amber-400',
  LFC: 'text-red-400',
  PL: 'text-purple-400',
  ELEC: 'text-yellow-300',
  AI: 'text-emerald-400'
};

const props = defineProps({
  items: { type: Array, default: () => [] },
  emptyText: { type: String, default: '' }
});

// Re-checked every minute so the NEW badge drops off between refreshes
const now = ref(Date.now());
const isNew = item => now.value - new Date(item.published).getTime() < NEW_FOR_MS;

// Keep a steady reading speed whatever the content length
const track = ref(null);
const duration = ref(120);
let observer = null;
let clock = null;

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
watch(() => props.items, () => nextTick(measure));

onMounted(() => { clock = setInterval(() => (now.value = Date.now()), 60 * 1000); });
onBeforeUnmount(() => { observer?.disconnect(); clearInterval(clock); });
</script>

<style>
.ticker-track {
  /* Own compositor layer, so other widgets repainting doesn't re-raster it */
  will-change: transform;
  animation-name: ticker-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
</style>
