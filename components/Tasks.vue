<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white w-full h-full flex flex-col">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold tracking-widest uppercase text-zinc-400">Tasks</span>
      <span class="text-[0.65rem] text-zinc-500">{{ lastUpdatedLabel }}</span>
    </div>
    <div v-if="loading" class="text-zinc-500 text-sm">Loading tasks...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>
    <div v-else-if="!tasks.length" class="text-zinc-500 text-sm">Nothing on the list</div>
    <ul v-else class="space-y-1.5 overflow-y-auto">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="flex items-start gap-2 text-sm"
      >
        <span class="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
        <span class="text-zinc-100 leading-snug">{{ task.title }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
const tasks = ref([]);
const loading = ref(true);
const error = ref(null);
const updated = ref(null);

const fetchTasks = async () => {
  try {
    loading.value = true;
    const data = await $fetch('/api/tasks');
    tasks.value = data?.tasks ?? [];
    updated.value = data?.updated ?? null;
    error.value = null;
  } catch (e) {
    console.error(e);
    error.value = 'Failed to load tasks';
  } finally {
    loading.value = false;
  }
};

const lastUpdatedLabel = computed(() => {
  if (!updated.value) return '';
  const d = new Date(updated.value);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
});

onMounted(fetchTasks);
</script>
