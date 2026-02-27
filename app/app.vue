<template>
    <div class="bg-black text-white">
        <h1 class="text-2xl font-bold text-center text-blue-500 p-2">{{ titleDate }}</h1>

          <section class="grid grid-cols-6 grid-rows-2 items-center ">
            <div class="col-start-1 col-span-2 row-start-1 flex justify-center "><Weather /></div>
            <div class="col-start-1 col-span-2 row-start-2 flex justify-center "><Weather /></div>
            <div class="col-start-3 col-span-2 row-start-1 flex justify-center "><Weather /></div>
            <div class="col-start-3 col-span-2 row-start-2 flex justify-center "><Weather /></div>

            <!-- Football: shared loading/error state -->
            <template v-if="footballError">
              <div class="col-start-3 row-start-1 row-span-2 flex justify-center items-center">
                {{ footballError }}
              </div>
            </template>
            <template v-else-if="!footData">
              <div class="col-start-3 row-start-1 row-span-2 flex justify-center items-center">
                Loading football data...
              </div>
            </template>
            <template v-else >
              <div class ="col-start-5 col-span-2 row-span-2 flex flex-col items-center gap-4">
                <div class="flex flex-row items-center gap-16"> 
                  <div >
                <FootballNextMatch :next-match="footData.liverpool?.nextMatch" />
              </div>
              <div >
                <FootballLastMatch :last-match="footData.liverpool?.lastMatch" />
              </div></div>
             
              <div>
                <FootballTable :table="footData.table ?? []" />
              </div>
            </div>
            </template>
          </section>
          
    </div>

</template>

<script setup>
import Weather from "../components/Weather.vue";
import FootballLastMatch from "~~/components/FootballLastMatch.vue";
import FootballNextMatch from "~~/components/FootballNextMatch.vue";
import FootballTable from "~~/components/FootballTable.vue";

const titleDate = ref(null);
const apiData = ref(null);
const footData = ref(null);
const footballError = ref(null);

onMounted(async () => {
  titleDate.value = createTitleDate();
 
  apiData.value = await $fetch("/api/test");
  try {
    footData.value = await $fetch("/api/football");
  } catch (e) {
    footballError.value = "Failed to load football data";
  }
});

function createTitleDate (){
  const d = new Date();
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })+ " "; // Friday
  const month = d.toLocaleDateString('en-GB', { month: 'short' });    // Feb
  const day = d.getDate()+" "; 

  return day + weekday + month;

}



</script>

<style>

</style>