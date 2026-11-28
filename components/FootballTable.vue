<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full">
    <Transition name="table-slide" mode="out-in">
    <table :key="page" class="text-xs w-full table-fixed tabular-nums">
      <thead>
        <tr class="border-b border-zinc-800">
          <th
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'title-trim px-2 py-1 font-semibold text-[0.65rem] tracking-widest uppercase text-zinc-400',
              column.align === 'center' ? 'text-center' : 'text-left',
              column.headerClass
            ]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="team in rows"
          :key="team.position"
          :class="[
            'border-b border-zinc-800/50',
            team.team === 'Liverpool FC' ? 'row-highlight' : ''
          ]"
        >
          <td
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'px-2 py-px leading-4',
              column.align === 'center' ? 'text-center' : 'text-left',
              column.cellClass
            ]"
          >
            {{ team[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
    </Transition>
  </div>
</template>

<script setup>
const tableColumns = [
  { key: 'position', label: 'Pos', align: 'left', headerClass: 'w-10', cellClass: 'text-zinc-400' },
  // Three-letter codes (LIV) so the table fits the narrow right column
  { key: 'shortName', label: 'Team', align: 'left', cellClass: 'font-medium truncate text-zinc-100' },
  { key: 'played', label: 'P', align: 'center', headerClass: 'w-9', cellClass: 'text-zinc-400' },
  { key: 'won', label: 'W', align: 'center', headerClass: 'w-9', cellClass: 'text-zinc-400' },
  { key: 'drawn', label: 'D', align: 'center', headerClass: 'w-9', cellClass: 'text-zinc-400' },
  { key: 'lost', label: 'L', align: 'center', headerClass: 'w-9', cellClass: 'text-zinc-400' },
  { key: 'goalDifference', label: 'GD', align: 'center', headerClass: 'w-10', cellClass: 'text-zinc-400' },
  { key: 'points', label: 'Pts', align: 'center', headerClass: 'w-11', cellClass: 'font-bold text-zinc-50 border-l border-zinc-800' }
];

const props = defineProps({
  table: {
    type: Array,
    default: () => []
  }
});

// Show 10 teams at a time, sliding between 1–10 and 11–20 every 30 seconds
const PAGE_SIZE = 10;
const SLIDE_MS = 30 * 1000;

const page = ref(0);
const pageCount = computed(() => Math.max(1, Math.ceil(props.table.length / PAGE_SIZE)));
const rows = computed(() => props.table.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE));

let timer = null;
onMounted(() => {
  timer = setInterval(() => (page.value = (page.value + 1) % pageCount.value), SLIDE_MS);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<style>
.table-slide-enter-active,
.table-slide-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
  will-change: transform, opacity;
}
.table-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.table-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
