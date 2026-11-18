<template>
  <div v-if="loading" class="text-zinc-500 text-sm">Loading photo...</div>
  <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>
  <div v-else-if="photoUrl" class="w-full h-full flex justify-center items-center bg-zinc-900 border border-zinc-800 rounded-xl p-2">
    <img :src="photoUrl" alt="Photo" class="rounded-lg max-h-full max-w-full object-contain" />
  </div>
</template>

<script setup>
const photoUrl = ref(null);
const loading = ref(true);
const error = ref(null);
onMounted(async () => {
  try {
    const photo = await $fetch('/api/photos');
    photoUrl.value = URL.createObjectURL(photo);
  } catch (err) {
    console.error('Photo API error:', err);
    error.value = 'Failed to load photo';
  } finally {
    loading.value = false;
  }
});

</script>