export const MINUTE = 60 * 1000;

// After a failure, try again this soon instead of waiting a whole interval
// (football polls hourly, so one failed request would otherwise leave it stale for an hour).
const RETRY_AFTER = 2 * MINUTE;

// Every polled source reports here, so one "Updated" label can speak for the
// whole screen: url -> { updatedAt, failing }
const sources = reactive(new Map());

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
      // A 503 means a key isn't set up yet, which isn't a failing refresh
      sources.set(url, { updatedAt: updatedAt.value, failing: !!error.value && error.value.statusCode !== 503 });
    }
  };

  const loop = async () => {
    await refresh();
    if (stopped) return;
    timer = setTimeout(loop, error.value ? Math.min(RETRY_AFTER, intervalMs) : intervalMs);
  };

  onMounted(loop);

  onBeforeUnmount(() => {
    stopped = true;
    clearTimeout(timer);
  });

  return { data, error, loading, refresh };
}

// The screen-wide status: when anything last refreshed, and how many sources
// are currently failing (and showing their last good data)
export function useRefreshStatus() {
  return computed(() => {
    const all = [...sources.values()];
    const times = all.map(s => s.updatedAt).filter(Boolean);
    const latest = times.length ? new Date(Math.max(...times)) : null;
    return {
      time: latest?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) ?? null,
      failing: all.filter(s => s.failing).length
    };
  });
}
