<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full">
    <table class="text-xs w-full">
      <thead>
        <tr class="border-b border-zinc-800">
          <th
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'px-2 py-1.5 font-semibold text-[0.65rem] tracking-widest uppercase text-zinc-400',
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
          v-for="team in table"
          :key="team.position"
          :class="[
            'border-b border-zinc-800/50',
            team.team === 'Liverpool FC' ? 'bg-red-600' : ''
          ]"
        >
          <td
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'px-2 py-0.5',
              column.align === 'center' ? 'text-center' : 'text-left',
              column.cellClass
            ]"
          >
            {{ team[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const tableColumns = [
  { key: 'position', label: 'Pos', align: 'left', cellClass: 'text-zinc-400' },
  { key: 'team', label: 'Team', align: 'left', cellClass: 'font-medium min-w-[100px] text-zinc-100' },
  { key: 'played', label: 'P', align: 'center', cellClass: 'text-zinc-400' },
  { key: 'won', label: 'W', align: 'center', cellClass: 'text-zinc-400' },
  { key: 'drawn', label: 'D', align: 'center', cellClass: 'text-zinc-400' },
  { key: 'lost', label: 'L', align: 'center', cellClass: 'text-zinc-400' },
  { key: 'goalDifference', label: 'GD', align: 'center', cellClass: 'text-zinc-400' },
  { key: 'points', label: 'Pts', align: 'center', cellClass: 'font-bold text-white border-l border-zinc-800' }
];

defineProps({
  table: {
    type: Array,
    default: () => []
  }
});
</script>
