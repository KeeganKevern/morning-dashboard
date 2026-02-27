<template>
  <div>
    <div v-if="loading">Loading football data...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="data" class="flex gap-2">
      <div class="flex flex-col justify-center gap-20">
        <FootballNextMatch :next-match="data.liverpool.nextMatch" />
        <FootballLastMatch :last-match="data.liverpool.lastMatch" />
      </div>
      <FootballTable :table="data.table" />
    </div>
  </div>
</template>

<script setup>
import FootballNextMatch from './FootballNextMatch.vue';
import FootballLastMatch from './FootballLastMatch.vue';
import FootballTable from './FootballTable.vue';

const data = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchFootball = async () => {
  try {
    loading.value = true;
    const response = await $fetch('/api/football');
    console.log('Football data received:', response); // Debug in browser console
    data.value = response;
    error.value = null;
  } catch (e) {
    error.value = 'Failed to load football data';
    console.error('Football fetch error:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFootball();
  // // Refresh every hour
  // setInterval(fetchFootball, 60 * 60 * 1000);
});
</script>