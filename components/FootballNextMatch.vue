<template>
  <div v-if="nextMatch" class="bg-red-600 p-2 rounded-md flex flex-col items-center">
    <h2 class="text-amber-300 text-2xl font-bold">Next Match</h2>
    <div>
      {{ nextMatch.home }} vs {{ nextMatch.away }}
    </div>
    <div class="match-time">
      {{ nextMatch.date }} at {{ nextMatch.time }}
    </div>
    <div class="match-comp">
      {{ nextMatch.competition }}
    </div>
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

