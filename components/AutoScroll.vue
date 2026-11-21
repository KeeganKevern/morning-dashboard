<template>
  <!-- Scrolls its content slowly upwards in a loop, but only when it doesn't fit -->
  <div ref="box" class="relative min-h-0 flex-1 overflow-hidden" :class="{ 'auto-scroll-fade': scrolling }">
    <div
      :class="{ 'auto-scroll-track': scrolling }"
      :style="scrolling ? { animationDuration: `${duration}s` } : null"
    >
      <!-- Both copies carry the same gap after them, so sliding by half the track
           (one copy plus its gap) loops without a jump -->
      <div :style="scrolling ? { paddingBottom: `${GAP}px` } : null">
        <div ref="content"><slot /></div>
      </div>
      <div v-if="scrolling" aria-hidden="true" :style="{ paddingBottom: `${GAP}px` }">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // Reading speed in pixels a second
  speed: { type: Number, default: 12 }
});

const GAP = 24; // space between the end of the list and its repeat

const box = ref(null);
const content = ref(null);
const scrolling = ref(false);
const duration = ref(60);
let observer = null;

const measure = () => {
  if (!box.value || !content.value) return;
  const contentHeight = content.value.offsetHeight;
  scrolling.value = contentHeight > box.value.clientHeight + 1;
  // One loop moves by a whole copy plus the gap
  duration.value = Math.max(10, (contentHeight + GAP) / props.speed);
};

onMounted(() => {
  observer = new ResizeObserver(measure);
  observer.observe(box.value);
  observer.observe(content.value);
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<style>
.auto-scroll-track {
  animation-name: auto-scroll-up;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* Slides up by one copy plus its gap: exactly half the two-copy track */
@keyframes auto-scroll-up {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

/* Soften the top and bottom edges while it's moving */
.auto-scroll-fade {
  mask-image: linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%);
}
</style>
