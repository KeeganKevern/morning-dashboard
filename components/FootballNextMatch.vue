<template>
  <div v-if="nextMatch" :class="tone" class="border rounded-xl px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 w-full h-full min-w-0">
    <span class="text-[0.6rem] font-semibold tracking-widest uppercase text-white/70">Next</span>
    <div class="text-xs font-medium text-white text-center leading-tight">{{ nextMatch.home }} vs {{ nextMatch.away }}</div>
    <div class="text-[0.65rem] text-white/70 text-center leading-tight">{{ nextMatch.date }} {{ nextMatch.time }} · {{ nextMatch.competition }}</div>
  </div>
</template>

<script setup>
defineProps({
  nextMatch: {
    type: Object,
    default: null
  },
  // Background and border classes; Liverpool red by default
  tone: {
    type: String,
    default: 'bg-red-600 border-red-500'
  }
});
</script>
