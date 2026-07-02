<template>
  <div class="bg-zinc-950 text-white h-screen flex flex-col overflow-hidden">
    <header class="flex items-center justify-center px-4 py-2 border-b border-zinc-800">
      <span class="text-sm font-medium text-zinc-400 tracking-widest uppercase">{{ titleDate }}</span>
    </header>

    <section class="flex-1 grid grid-cols-6 grid-rows-[1fr_1fr_auto] gap-3 p-3 min-h-0">
      <div class="col-start-1 col-span-2 row-start-1 h-full"><Weather /></div>
      <div class="col-start-1 col-span-2 row-start-2 h-full"><Stocks /></div>
      <div class="col-start-3 col-span-2 row-start-1 h-full"><Photos /></div>
      <div class="col-start-3 col-span-2 row-start-2 h-full"><News /></div>
      <div class="col-start-1 col-span-4 row-start-3"><Tasks /></div>

      <template v-if="footballError">
        <div class="col-start-5 col-span-2 row-span-3 h-full flex justify-center items-center text-zinc-500 text-sm">
          {{ footballError }}
        </div>
      </template>
      <template v-else-if="!footData">
        <div class="col-start-5 col-span-2 row-span-3 h-full flex justify-center items-center text-zinc-500 text-sm">
          Loading football data...
        </div>
      </template>
      <template v-else>
        <div class="col-start-5 col-span-2 row-span-3 h-full flex flex-col gap-3">
          <FootballNextMatch :next-match="footData.liverpool?.nextMatch" />
          <FootballTable :table="footData.table ?? []" />
          <FootballLastMatch :last-match="footData.liverpool?.lastMatch" />
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import Weather from "../components/Weather.vue";
import Stocks from "~~/components/Stocks.vue";
import News from "~~/components/News.vue";
import FootballLastMatch from "~~/components/FootballLastMatch.vue";
import FootballNextMatch from "~~/components/FootballNextMatch.vue";
import FootballTable from "~~/components/FootballTable.vue";
import Photos from "~~/components/Photos.vue";
import Tasks from "~~/components/Tasks.vue";

const titleDate = ref(null);
const footData = ref(null);
const footballError = ref(null);

onMounted(async () => {
  titleDate.value = createTitleDate();
  try {
    footData.value = await $fetch("/api/football");
  } catch (e) {
    footballError.value = "Failed to load football data";
  }
});

function createTitleDate() {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${weekday} ${day} ${month}`;
}
</script>
