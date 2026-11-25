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
        :src="photoUrl(current)"
        decoding="async"
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

const photoUrl = name => `/api/photos/${encodeURIComponent(name)}`;

// A random photo, never the same one twice in a row. It is downloaded and
// decoded before it is shown, so the fade doesn't stall the scrolling
// widgets while a Pi 3 decodes the JPEG mid-animation.
let picking = false;
const pickNext = async () => {
  const names = data.value?.photos ?? [];
  if (!names.length) return (current.value = null);
  if (picking) return;
  const others = names.length > 1 ? names.filter(n => n !== current.value) : names;
  const next = others[Math.floor(Math.random() * others.length)];
  picking = true;
  try {
    const img = new Image();
    img.src = photoUrl(next);
    await img.decode();
  } catch {
    // Show it anyway; the <img> reports its own failure
  } finally {
    picking = false;
  }
  current.value = next;
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
