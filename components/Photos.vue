<template>
  <div v-if="loading">Loading photo...</div>
  <div v-else-if="e" class="text-red-400 text-xs">{{ e }}</div>
  <div v-else-if="photoUrl" class="w-fit h-full flex justify-center items-center bg-slate-800 rounded-md p-2 shadow-inner">
    <img :src="photoUrl" alt="Photo" class="rounded-md border-10 border-amber-900 shadow-md" />
  </div>
</template>

<script setup>
const photoUrl = ref(null);
const loading = ref(true);
const e = ref(null);
onMounted(async () => {
  try {
    loading.value = true;
    const photo = await $fetch('/api/photos');
    console.log(photo);
    photoUrl.value = URL.createObjectURL(photo);
    loading.value = false;
  } catch (e) {
    console.error('Photo API error:', e);
    loading.value = false;
    e.value = 'Failed to load photo';
  }
});

</script>