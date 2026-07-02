<template>
  <div v-if="lastMatch" class="bg-red-600 border border-red-500 rounded-xl p-3 flex flex-col items-center gap-1 w-full">
    <span class="text-xs font-semibold tracking-widest uppercase text-white/70">Last Match</span>
    <div class="text-sm font-medium text-white text-center">{{ lastMatch.home }} vs {{ lastMatch.away }}</div>
    <div class="text-2xl font-bold text-white">{{ lastMatch.score }}</div>
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
