<template>
  <div v-if="lastMatch" class="bg-red-600 p-2 rounded-md flex flex-col items-center">
    <h2 class="text-amber-300 text-2xl font-bold">Last Match</h2>
    <div>
      {{ lastMatch.home }} vs {{ lastMatch.away }}
    </div>
    <h3 class="font-bold text-2xl">
      {{ lastMatch.score }}
    </h3>
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

