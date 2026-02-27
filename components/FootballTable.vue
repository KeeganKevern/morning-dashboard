<template>
  <div class="overflow-x-auto">
    <table class="text-xs bg-gray-900 rounded-md shadow-sm">
      <thead class="bg-gray-900">
        <tr>
          <th
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'px-1.5 py-1 font-semibold text-gray-00 border-b border-gray-400',
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
            'border-b border-gray-600',
            { 'bg-red-600': team.team === 'Liverpool FC' }
          ]"
        >
          <td
            v-for="column in tableColumns"
            :key="column.key"
            :class="[
              'px-1.5 py-0.5',
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
  { key: 'position', label: 'Pos', align: 'left', cellClass: 'font-medium' },
  { key: 'team', label: 'Team', align: 'left', cellClass: 'font-medium min-w-[100px]' },
  { key: 'played', label: 'P', align: 'center' },
  { key: 'won', label: 'W', align: 'center' },
  { key: 'drawn', label: 'D', align: 'center' },
  { key: 'lost', label: 'L', align: 'center' },
  { key: 'goalDifference', label: 'GD', align: 'center' },
  { key: 'points', label: 'Pts', align: 'center', cellClass: 'font-bold text-amber-300 border-l' }
];

defineProps({
  table: {
    type: Array,
    default: () => []
  }
});
</script>

