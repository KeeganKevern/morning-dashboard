<template>
  <div v-if="lastMatch" class="bg-red-600 border border-red-500 rounded-xl px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 w-full h-full min-w-0">
    <span class="text-[0.6rem] font-semibold tracking-widest uppercase text-white/70">Last</span>
    <div class="text-xs font-medium text-white text-center leading-tight">{{ lastMatch.home }} vs {{ lastMatch.away }}</div>
    <div class="text-lg font-bold text-white leading-none">{{ lastMatch.score }}</div>
  </div>
</template>

<script setup>
defineProps({
  lastMatch: {
    type: Object,
    default: null
  }
});
</script>
