<template>
  <div >
    <div v-if="loading">Loading football data...</div>
    <div v-else-if="error" >{{ error }}</div>
    <div v-else-if="data" class="flex gap-2">
      
      <!-- Liverpool Fixtures -->
      <div class="flex flex-col justify-center gap-20">
        <div v-if="data.liverpool.nextMatch" class="bg-red-600 p-2 rounded-md flex flex-col items-center">
          <h2 class="text-amber-300 text-2xl font-bold" >Next Match</h2>
          <div >
            {{ data.liverpool.nextMatch.home }} vs {{ data.liverpool.nextMatch.away }}
          </div>
          <div class="match-time">{{ data.liverpool.nextMatch.date }} at {{ data.liverpool.nextMatch.time }}</div>
          <div class="match-comp">{{ data.liverpool.nextMatch.competition }}</div>
        </div>
     

      <div v-if="data.liverpool.lastMatch" class="bg-red-600 p-2 rounded-md flex flex-col items-center">
        <h2 class="text-amber-300 text-2xl font-bold" >Last Match</h2>
        <div >
            {{ data.liverpool.lastMatch.home }} vs {{ data.liverpool.lastMatch.away }}
          </div>
          <h3 class="font-bold text-2xl">{{ data.liverpool.lastMatch.score }}</h3>

        </div>
      </div>
      
      <!-- Premier League Table -->
      <div class="overflow-x-auto">
        <table class=" text-xs bg-gray-900 rounded-md shadow-sm">
          <thead class="bg-gray-900">
            <tr>
              <th 
                v-for="column in tableColumns" 
                :key="column.key"
                :class="[
                  'px-1.5 py-1 font-semibold text-gray-00 border-b border-gray-400',
                  column.align === 'center' ? 'text-center' : 'text-left',
                  column.headerClass
                ]">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in data.table" :key="team.position" 
                :class="[
                  'border-b border-gray-600',
                  { 'bg-red-600': team.team === 'Liverpool FC' }
                ]">
              <td 
                v-for="column in tableColumns" 
                :key="column.key"
                :class="[
                  'px-1.5 py-0.5',
                  column.align === 'center' ? 'text-center' : 'text-left',
                  column.cellClass
                ]">
                {{ team[column.key] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
  </div>
</template>

<script setup>
const data = ref(null);
const loading = ref(true);
const error = ref(null);

const tableColumns = [
  { key: 'position', label: 'Pos', align: 'left', cellClass: 'font-medium' },
  { key: 'team', label: 'Team', align: 'left', cellClass: 'font-medium min-w-[100px]' },
  { key: 'played', label: 'P', align: 'center' },
  { key: 'won', label: 'W', align: 'center' },
  { key: 'drawn', label: 'D', align: 'center' },
  { key: 'lost', label: 'L', align: 'center' },
  { key: 'goalDifference', label: 'GD', align: 'center' },
  { key: 'points', label: 'Pts', align: 'center', cellClass: 'font-bold text-amber-300 border-l' }
];

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