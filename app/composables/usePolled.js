export const MINUTE = 60 * 1000;

// After a failure, try again this soon instead of waiting a whole interval
// (football polls hourly, so one failed request would otherwise leave it stale for an hour).
const RETRY_AFTER = 2 * MINUTE;

// Fetches `url` on mount, then again every `intervalMs` while the page is open.
// A failed refresh keeps the last good data on screen and flags it as stale,
// so an unattended dashboard never blanks a widget because of one bad request.
export function usePolled(url, intervalMs) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(true); // true only until the first response
  const updatedAt = ref(null);
  let timer = null;
  let stopped = false;

  const refresh = async () => {
    try {
      // No automatic retry inside $fetch: the scheduled retry below handles it,
      // and a doubled football request would spend more of football-data.org's 10-a-minute limit.
      data.value = await $fetch(url, { retry: 0 });
      updatedAt.value = new Date();
      error.value = null;
    } catch (e) {
      console.error(`Refresh failed for ${url}:`, e);
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  const loop = async () => {
    await refresh();
    if (stopped) return;
    timer = setTimeout(loop, error.value ? Math.min(RETRY_AFTER, intervalMs) : intervalMs);
  };

  const updatedLabel = computed(() => {
    if (!updatedAt.value) return '';
    const time = updatedAt.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return error.value ? `Updated ${time} · retrying` : `Updated ${time}`;
  });

  onMounted(loop);

  onBeforeUnmount(() => {
    stopped = true;
    clearTimeout(timer);
  });

  return { data, error, loading, updatedLabel, refresh };
}
