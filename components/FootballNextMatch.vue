<template>
  <div v-if="nextMatch" class="bg-red-600 border border-red-500 rounded-xl p-3 flex flex-col items-center gap-1 w-full">
    <span class="text-xs font-semibold tracking-widest uppercase text-white/70">Next Match</span>
    <div class="text-sm font-medium text-white text-center">{{ nextMatch.home }} vs {{ nextMatch.away }}</div>
    <div class="text-xs text-white/70">{{ nextMatch.date }} at {{ nextMatch.time }}</div>
    <div class="text-xs text-white/60">{{ nextMatch.competition }}</div>
  </div>
</template>

<script setup>
defineProps({
  nextMatch: {
    type: Object,
    default: null
  }
});
</script>
