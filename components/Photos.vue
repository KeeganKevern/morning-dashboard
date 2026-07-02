<template>
  <div v-if="loading">Loading photo...</div>
  <div v-else-if="e" class="text-red-400 text-xs">{{ e }}</div>
  <div v-else-if="photoUrl" class="w-full h-full flex justify-center items-center bg-zinc-900 border border-zinc-800 rounded-xl p-2">
    <img :src="photoUrl" alt="Photo" class="rounded-lg max-h-full max-w-full object-contain" />
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