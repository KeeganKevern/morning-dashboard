<template>
  <div >
    <div v-if="loading">Loading football data...</div>
    <div v-else-if="error" >{{ error }}</div>
    <div v-else-if="data" >
      
      <!-- Liverpool Fixtures -->
      <div >
        <h2 class="">Liverpool FC</h2>
        
        <div v-if="data.liverpool.lastMatch" class="">
          <div >Last Match</div>
          <div >
            {{ data.liverpool.lastMatch.home }} vs {{ data.liverpool.lastMatch.away }}
          </div>
          <div >{{ data.liverpool.lastMatch.score }}</div>
          <div >{{ data.liverpool.lastMatch.date }}</div>
        </div>
        
        <div v-if="data.liverpool.nextMatch" class="bg-red-600 p-2 rounded-md">
          <div class="text-amber-300 text-2xl" >Next Match</div>
          <div >
            {{ data.liverpool.nextMatch.home }} vs {{ data.liverpool.nextMatch.away }}
          </div>
          <div class="match-time">{{ data.liverpool.nextMatch.date }} at {{ data.liverpool.nextMatch.time }}</div>
          <div class="match-comp">{{ data.liverpool.nextMatch.competition }}</div>
        </div>
      </div>
      
      <!-- Premier League Table -->
      <div class="">
        <h3>Premier League Table</h3>
        <table class="league-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in data.table" :key="team.position" 
                :class="{ highlight: team.team === 'Liverpool FC' }">
              <td>{{ team.position }}</td>
              <td class="team-name">{{ team.team }}</td>
              <td>{{ team.played }}</td>
              <td>{{ team.won }}</td>
              <td>{{ team.drawn }}</td>
              <td>{{ team.lost }}</td>
              <td>{{ team.goalDifference }}</td>
              <td class="points">{{ team.points }}</td>
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
