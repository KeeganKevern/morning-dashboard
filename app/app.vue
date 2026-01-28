<template>
  <div class="dashboard">
    <h1>Morning Dashboard</h1>
    <p>{{ message }}</p>
        <p v-if="apiData">API says: {{ apiData.message }}</p>
          <Weather/>
  </div>

</template>

<script setup>
import Weather from "../components/Weather.vue";
const message = ref('Dashboard is running!');

const apiData = ref(null);

onMounted(async () => {
  apiData.value = await $fetch('./api/test');
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #000;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

.dashboard {
  padding: 20px;
  min-height: 100vh;
}

h1 {
  margin-bottom: 20px;
}
</style>