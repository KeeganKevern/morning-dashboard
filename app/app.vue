<template>
    <div class="bg-black text-white">
        <h1 class="text-2xl font-bold text-center text-blue-500 p-2">Morning Dashboard</h1>

          <section class="grid grid-cols-3 grid-rows-2 items-center ">
            <div class="col-start-1 row-start-1 flex justify-center"><Weather /></div>
            <div class="col-start-1 row-start-2 flex justify-center"><Weather /></div>
            <div class="col-start-2 row-start-1 flex justify-center"><Weather /></div>
            <div class="col-start-2 row-start-2 flex justify-center"><Weather /></div>
            <div class="col-start-3 row-start-1 row-span-2  flex justify-center"><Football /></div>
          </section>
          
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

<!-- <style>
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
</style> -->