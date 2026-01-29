<template>

    <div class="bg-black text-white">
      <div class="dashboard mb-6 ">
        <h1 class="bg-emerald-600">Morning Dashboard</h1>
        <p>{{ message }}</p>
        <p v-if="apiData">API says: {{ apiData.message }}</p>
      </div>
          <div class="flex justify-evenly">
            <Weather />
            <Football />
          </div>
    </div>


</template>

<script setup>
import Weather from "../components/Weather.vue";
import Football from "../components/football.vue";

const message = ref("Dashboard is running!");
const apiData = ref(null);
const footData = ref(null);

onMounted(async () => {
  apiData.value = await $fetch("/api/test");
  footData.value = await $fetch("/api/football");
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {

  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  margin-bottom: 20px;
}
</style>
