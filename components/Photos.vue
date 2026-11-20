<template>
  <div class="relative w-full h-full overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl">
    <div v-if="!current" class="h-full flex items-center justify-center text-sm" :class="error && !loading ? 'text-red-400' : 'text-zinc-500'">
      {{ loading ? 'Loading photos...' : error ? 'Photos unavailable' : 'No photos in the folder yet' }}
    </div>

    <!-- Each photo fades in over the last, shown whole (letterboxed, never cropped) -->
    <Transition name="photo-fade">
      <img
        v-if="current"
        :key="current"
        :src="`/api/photos/${encodeURIComponent(current)}`"
        alt=""
        class="absolute inset-0 w-full h-full object-contain"
      />
    </Transition>
  </div>
</template>

<script setup>
const CHANGE_MS = MINUTE;

// The folder list is checked hourly, so new photos appear within the hour
const { data, error, loading } = usePolled('/api/photos', 60 * MINUTE);

const current = ref(null);

// A random photo, never the same one twice in a row
const pickNext = () => {
  const names = data.value?.photos ?? [];
  if (!names.length) return (current.value = null);
  const others = names.length > 1 ? names.filter(n => n !== current.value) : names;
  current.value = others[Math.floor(Math.random() * others.length)];
};

// First photo as soon as the list arrives, or if the shown one was removed
watch(data, () => {
  if (!current.value || !data.value?.photos?.includes(current.value)) pickNext();
});

let timer = null;
onMounted(() => { timer = setInterval(pickNext, CHANGE_MS); });
onBeforeUnmount(() => clearInterval(timer));
</script>

<style>
.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 1s ease;
}
.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}
</style>
