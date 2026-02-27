<template>
  <div class="bg-slate-800 rounded-md p-3 text-white ">
    <div v-if="loading">Loading markets...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>
    <div v-else-if="indices.length" class="grid grid-cols-2 gap-2">
      <div
        v-for="index in indices"
        :key="index.id"
        class="bg-slate-900 rounded-md px-2 py-2 flex flex-col gap-1 "
      >
        <div class="flex justify-between items-baseline text-xs">
          <div class="flex flex-col">
            <span class="font-semibold">{{ index.label }}</span>
            <span v-if="index.points.length" class="text-[0.7rem] text-slate-400">
              {{ formatShortDate(index.firstDate) }} – {{ formatShortDate(index.lastDate) }}
            </span>
          </div>
          <span
            v-if="index.points.length"
            class="text-[0.75rem] font-semibold"
            :class="changeClass(index.points)"
          >
            {{ formatChange(index.points) }}
          </span>
        </div>

        <div class="h-12 w-40">
          <svg
            v-if="index.points.length"
            :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
            class="w-full h-full"
          >
            <g v-for="tick in buildTicks(index.points)" :key="tick.x">
              <line
                :x1="tick.x"
                :x2="tick.x"
                y1="0"
                :y2="VIEWBOX_HEIGHT"
                class="stroke-slate-700"
                stroke-width="0.3"
                stroke-linecap="round"
                opacity="0.6"
              />
              <text
                :x="tick.x"
                :y="VIEWBOX_HEIGHT - 1"
                font-size="3"
                text-anchor="middle"
                class="fill-slate-400"
              >
                {{ tick.label }}
              </text>
            </g>
            <polyline
              :points="buildPolyline(index.points)"
              fill="none"
              class="stroke-blue-400"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <div v-else class="text-[0.7rem] text-slate-400">
            No data
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const indices = ref([]);
const loading = ref(true);
const error = ref(null);

const VIEWBOX_WIDTH = 80;
const VIEWBOX_HEIGHT = 30;

const fetchStocks = async () => {
  try {
    loading.value = true;
    const data = await $fetch('/api/stocks');
    indices.value = data?.indices ?? [];
    error.value = null;
  } catch (e) {
    console.error(e);
    error.value = 'Failed to load markets';
  } finally {
    loading.value = false;
  }
};

const formatShortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const buildTicks = (points) => {
  if (!points.length) return [];

  const count = points.length;
  const stepX = count > 1 ? VIEWBOX_WIDTH / (count - 1) : 0;

  const rawIndexes = [0, Math.floor(count / 2), count - 1];
  const indexes = [...new Set(rawIndexes)].filter(i => i >= 0 && i < count);

  return indexes.map(i => ({
    x: +(i * stepX).toFixed(2),
    label: formatShortDate(points[i].date)
  }));
};

const buildPolyline = (points) => {
  if (!points.length) return '';

  const closes = points.map(p => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);

  const span = Math.max(max - min, 1e-6);
  const stepX = points.length > 1 ? VIEWBOX_WIDTH / (points.length - 1) : 0;

  return points
    .map((p, i) => {
      const x = i * stepX;
      const norm = (p.close - min) / span;
      const y = VIEWBOX_HEIGHT - norm * VIEWBOX_HEIGHT;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

const getChange = (points) => {
  if (!points || points.length < 2) return null;

  const last = points[points.length - 1].close;
  const prev = points[points.length - 2].close;

  if (typeof last !== 'number' || typeof prev !== 'number' || prev === 0) {
    return null;
  }

  const diff = last - prev;
  const pct = (diff / prev) * 100;

  return { diff, pct };
};

const formatChange = (points) => {
  const c = getChange(points);
  if (!c) return '';

  const sign = c.diff >= 0 ? '+' : '';
  return `${sign}${c.diff.toFixed(2)} (${sign}${c.pct.toFixed(2)}%)`;
};

const changeClass = (points) => {
  const c = getChange(points);
  if (!c) return 'text-slate-200';
  return c.diff >= 0 ? 'text-emerald-400' : 'text-red-400';
};

onMounted(() => {
  fetchStocks();
  // Refresh hourly
  setInterval(fetchStocks, 60 * 60 * 1000);
});
</script>

