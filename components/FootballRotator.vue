<template>
  <div v-if="cards.length" class="shrink-0 flex flex-col gap-1">
    <div class="flex items-center justify-between px-1">
      <span class="text-[0.6rem] font-semibold tracking-widest uppercase text-zinc-400">{{ current.label }}</span>
      <div v-if="cards.length > 1" class="flex gap-1">
        <span
          v-for="(card, i) in cards"
          :key="card.key"
          class="h-1.5 w-1.5 rounded-full"
          :class="i === index ? 'bg-zinc-300' : 'bg-zinc-700'"
        />
      </div>
    </div>

    <!-- Fixed height so the table below doesn't jump as cards change -->
    <div class="relative h-24">
      <Transition name="football-fade">
        <div :key="current.key" class="absolute inset-0">
          <div v-if="current.type === 'pair'" class="grid grid-cols-2 gap-3 h-full">
            <FootballNextMatch :next-match="current.next" :tone="current.tone" />
            <FootballLastMatch :last-match="current.last" :tone="current.tone" />
          </div>

          <div v-else class="h-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 grid grid-cols-2 gap-x-4 content-center">
            <div
              v-for="m in current.matches"
              :key="`${m.home}-${m.away}`"
              class="grid grid-cols-[1fr_auto_1fr] gap-1.5 text-[0.7rem] leading-4"
            >
              <span class="text-right font-medium" :class="m.home === 'LIV' ? 'text-red-400' : 'text-zinc-100'">{{ m.home }}</span>
              <span class="text-zinc-400 tabular-nums">{{ m.score }}</span>
              <span class="font-medium" :class="m.away === 'LIV' ? 'text-red-400' : 'text-zinc-100'">{{ m.away }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import FootballNextMatch from './FootballNextMatch.vue';
import FootballLastMatch from './FootballLastMatch.vue';

const ROTATE_MS = 15 * 1000;

const props = defineProps({
  data: { type: Object, required: true }
});

const cards = computed(() => {
  const list = [];
  const { liverpool, england, results } = props.data;

  if (liverpool?.nextMatch || liverpool?.lastMatch) {
    list.push({ key: 'liverpool', type: 'pair', label: 'Liverpool', tone: 'bg-red-600 border-red-500', next: liverpool.nextMatch, last: liverpool.lastMatch });
  }
  if (england) {
    list.push({ key: 'england', type: 'pair', label: 'England', tone: 'bg-blue-900 border-blue-700', next: england.nextMatch, last: england.lastMatch });
  }
  if (results?.matches?.length) {
    list.push({ key: 'results', type: 'results', label: `Premier League · Matchday ${results.matchday}`, matches: results.matches });
  }
  return list;
});

const index = ref(0);
const current = computed(() => cards.value[index.value % cards.value.length] ?? {});

let timer = null;
onMounted(() => {
  timer = setInterval(() => {
    if (cards.value.length > 1) index.value = (index.value + 1) % cards.value.length;
  }, ROTATE_MS);
});
onBeforeUnmount(() => clearInterval(timer));

// A card can appear or disappear on refresh (England); stay in range
watch(() => cards.value.length, n => { if (index.value >= n) index.value = 0; });
</script>

<style>
.football-fade-enter-active,
.football-fade-leave-active {
  transition: opacity 0.6s ease;
}
.football-fade-enter-from,
.football-fade-leave-to {
  opacity: 0;
}
</style>
