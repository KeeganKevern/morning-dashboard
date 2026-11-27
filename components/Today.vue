<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-50 w-full h-full p-3 flex flex-col min-h-0">
    <div class="flex items-baseline justify-between mb-2">
      <span class="title-trim text-xs font-semibold tracking-widest uppercase text-zinc-400">Today</span>
      <span v-if="projects.data.value?.warning" class="text-[0.65rem] font-semibold text-amber-400">{{ projects.data.value.warning }}</span>
    </div>

    <!-- Met Office warnings: only shown when there are any -->
    <div v-if="metWarnings.length" class="mb-2 flex flex-col gap-1">
      <div
        v-for="(w, i) in metWarnings"
        :key="i"
        class="flex items-center gap-2 rounded-lg border px-2.5 py-1 text-sm leading-tight"
        :class="LEVEL_STYLES[w.level]"
      >
        <span class="font-bold">⚠ {{ w.level[0].toUpperCase() + w.level.slice(1) }} warning: {{ w.hazard }}</span>
        <span v-if="w.from" class="opacity-90">{{ w.from }} – {{ w.to }}</span>
        <span class="ml-auto truncate text-xs opacity-75">{{ w.areas }}</span>
      </div>
    </div>

    <div class="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_auto_auto] gap-y-3">
      <!-- Calendar and tasks lead the panel -->
      <div class="min-h-0 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-5">
        <!-- TimeTree -->
        <section class="min-h-0 flex flex-col">
          <h3 class="section-title section-title-main">Calendar</h3>
          <p v-if="!events.data.value" class="note" :class="tone(events)">{{ status(events, 'Loading events...') }}</p>
          <template v-else>
            <p v-if="events.data.value.stale" class="note text-amber-400 mb-1">TimeTree export is out of date</p>
            <AutoScroll>
              <!-- Today first, then tomorrow underneath -->
              <div v-for="day in calendarDays" :key="day.label" class="mb-3 last:mb-0">
                <p class="text-xs uppercase tracking-wider mb-1.5" :class="day.colour">{{ day.label }}</p>
                <p v-if="!day.events.length" class="note text-zinc-600">Nothing on {{ day.label.toLowerCase() }}</p>
                <ul class="space-y-1.5">
                  <li v-for="(e, i) in day.events" :key="i" class="flex gap-3 text-lg leading-tight">
                    <span class="shrink-0 w-[4.5rem] whitespace-nowrap text-zinc-400 tabular-nums">{{ e.allDay ? 'All day' : e.time }}</span>
                    <span class="min-w-0 break-words" :class="day.text">{{ e.title }}</span>
                  </li>
                </ul>
              </div>
            </AutoScroll>
          </template>
        </section>

        <!-- Google Tasks: urgent ones as large tiles, everything else listed beside them -->
        <section class="min-h-0 flex flex-col">
          <h3 class="section-title section-title-main">Tasks</h3>
          <p v-if="!tasks.data.value" class="note" :class="tone(tasks)">{{ status(tasks, 'Loading tasks...') }}</p>
          <!-- With nothing urgent, All tasks takes the room the tiles would have used -->
          <div
            v-else
            class="flex-1 min-h-0 grid gap-x-3"
            :class="tasks.data.value.urgent.length ? 'grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : 'grid-cols-[auto_minmax(0,1fr)]'"
          >
            <div class="min-h-0 flex flex-col">
              <p class="group-label text-red-400">Urgent</p>
              <p v-if="!tasks.data.value.urgent.length" class="note text-zinc-500">Nothing urgent</p>
              <AutoScroll>
                <ul class="space-y-1.5">
                  <li v-for="t in tasks.data.value.urgent" :key="t.id" class="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 leading-tight">
                    <span class="block text-lg text-zinc-50 break-words">{{ t.title }}</span>
                    <span class="block text-xs mt-0.5" :class="t.overdue ? 'text-red-400' : 'text-amber-400'">{{ urgentWhen(t) }}</span>
                  </li>
                </ul>
              </AutoScroll>
            </div>
            <div class="min-h-0 flex flex-col border-l border-zinc-800 pl-3">
              <p class="group-label text-zinc-400">All tasks</p>
              <p v-if="!tasks.data.value.rest.length" class="note text-zinc-500">Nothing else</p>
              <AutoScroll>
                <ul class="space-y-1.5">
                  <li v-for="t in tasks.data.value.rest" :key="t.id" class="leading-tight">
                    <span class="block text-base break-words" :class="t.due ? 'text-zinc-100' : 'text-zinc-400'">{{ t.title }}</span>
                    <span v-if="t.due" class="block text-xs text-zinc-500">by {{ dayMonth(t.due) }}</span>
                  </li>
                </ul>
              </AutoScroll>
            </div>
          </div>
        </section>
      </div>

      <!-- Applications: counts, then this fortnight's applications sliding four at a time -->
      <section class="border-t border-zinc-800 pt-2.5">
        <p v-if="!jobs.data.value" class="note" :class="tone(jobs)">{{ status(jobs, 'Loading applications...') }}</p>
        <div v-else class="flex items-center gap-3">
          <div class="shrink-0 flex flex-col gap-1">
            <div class="flex gap-1.5">
              <span class="chip bg-sky-400/15 text-sky-300">To review {{ jobs.data.value.review.length }}</span>
              <span class="chip bg-amber-400/15 text-amber-300">To chase {{ jobs.data.value.chase.length }}</span>
            </div>
            <div class="flex gap-1.5">
              <span class="chip bg-zinc-700/60 text-zinc-300">T={{ jobs.data.value.appliedTotal ?? '?' }}</span>
              <span class="chip bg-emerald-400/15 text-emerald-300">Applied {{ jobs.data.value.recentDays }}d: {{ jobs.data.value.applied.length }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0 self-stretch border-l border-zinc-800 pl-3 overflow-hidden flex flex-col justify-center">
            <p v-if="!jobs.data.value.applied.length" class="note text-zinc-500">No applications in the last {{ jobs.data.value.recentDays }} days</p>
            <Transition v-else name="table-slide" mode="out-in">
              <ul :key="appliedPage" class="grid grid-cols-2 gap-x-4 gap-y-1">
                <li v-for="(j, i) in appliedRows" :key="i" class="flex gap-2 text-sm leading-tight min-w-0">
                  <span class="truncate text-zinc-100">{{ j.title }}<span class="text-zinc-500"> · {{ j.employer }}</span></span>
                  <span class="ml-auto shrink-0 text-xs tabular-nums text-emerald-400">{{ j.days }}d</span>
                </li>
              </ul>
            </Transition>
            <p v-if="appliedPages > 1" class="text-[0.6rem] text-zinc-600 text-right tabular-nums mt-0.5">{{ appliedPage + 1 }} / {{ appliedPages }}</p>
          </div>
        </div>
      </section>

      <!-- KP next steps: two projects at a time, swapping to the next two -->
      <section class="border-t border-zinc-800 pt-2.5">
        <p v-if="!projects.data.value" class="note" :class="tone(projects)">{{ status(projects, 'Loading projects...') }}</p>
        <p v-else-if="!projectList.length" class="note text-zinc-500">No active next steps</p>
        <Transition v-else name="steps-fade" mode="out-in">
          <div :key="stepPage" class="grid grid-cols-2 gap-2">
            <div v-for="p in stepRows" :key="p.project" class="rounded-lg border border-zinc-800 px-2.5 py-1.5 min-w-0">
              <span class="block text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400 truncate">{{ p.project }}</span>
              <p class="text-sm leading-snug text-zinc-100 line-clamp-2">{{ p.step }}</p>
            </div>
          </div>
        </Transition>
      </section>
    </div>
  </div>
</template>

<script setup>
import AutoScroll from './AutoScroll.vue';

const events = usePolled('/api/timetree', 15 * MINUTE);
const tasks = usePolled('/api/tasks', 5 * MINUTE);
const jobs = usePolled('/api/jobs', 30 * MINUTE);
const projects = usePolled('/api/projects', 60 * MINUTE);

const calendarDays = computed(() => {
  const d = events.data.value;
  if (!d) return [];
  return [
    { label: 'Today', events: d.events, colour: 'text-zinc-300', text: 'text-zinc-100' },
    // Tomorrow is a heads-up, so a little quieter than today
    { label: 'Tomorrow', events: d.tomorrow ?? [], colour: 'text-zinc-500', text: 'text-zinc-300' }
  ];
});

// "2 days late", "Today", "Tomorrow", "Sunday · in 2 days"
const urgentWhen = t => {
  const d = t.daysLeft;
  if (d < -1) return `${-d} days late`;
  if (d === -1) return '1 day late';
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  const weekday = new Date(`${t.due}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  return `${weekday} · in ${d} days`;
};
// "14 Dec"
const dayMonth = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Pages that swap on a timer, like the league table
const usePages = (list, size, ms) => {
  const page = ref(0);
  const pages = computed(() => Math.max(1, Math.ceil(list.value.length / size)));
  const rows = computed(() => list.value.slice(page.value * size, (page.value + 1) * size));
  // A refresh can shorten the list; never sit on a page that no longer exists
  watch(pages, n => { if (page.value >= n) page.value = 0; });
  let timer = null;
  onMounted(() => { timer = setInterval(() => (page.value = (page.value + 1) % pages.value), ms); });
  onBeforeUnmount(() => clearInterval(timer));
  return { page, pages, rows };
};

const appliedList = computed(() => jobs.data.value?.applied ?? []);
const { page: appliedPage, pages: appliedPages, rows: appliedRows } = usePages(appliedList, 4, 20 * 1000);

const projectList = computed(() => projects.data.value?.projects ?? []);
const { page: stepPage, rows: stepRows } = usePages(projectList, 2, 15 * 1000);

const warnings = usePolled('/api/warnings', 15 * MINUTE);

const metWarnings = computed(() => warnings.data.value?.warnings ?? []);
const LEVEL_STYLES = {
  yellow: 'bg-yellow-400/15 border-yellow-500/60 text-yellow-200',
  amber: 'bg-amber-500/20 border-amber-500 text-amber-200',
  red: 'bg-red-600/25 border-red-500 text-red-200'
};

// 503 means a key or file isn't set up yet; anything else is a real failure
const notSetUp = source => source.error.value?.statusCode === 503;
const status = (source, loadingText) => {
  if (source.loading.value) return loadingText;
  return source.error.value?.data?.message || source.error.value?.statusMessage || 'Unavailable';
};
const tone = source => (source.loading.value || notSetUp(source) ? 'text-zinc-500' : 'text-red-400');
</script>

<style>
.section-title {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--title, var(--color-zinc-400));
  margin-bottom: 0.375rem;
}
/* Calendar and Tasks lead the panel */
.section-title-main {
  font-size: 0.75rem;
  color: var(--title-main, var(--color-zinc-300));
  margin-bottom: 0.5rem;
}
/* Urgent / All tasks */
.group-label {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.375rem;
}
.chip {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.note {
  font-size: 0.75rem;
}
.steps-fade-enter-active,
.steps-fade-leave-active {
  transition: opacity 0.4s ease;
}
.steps-fade-enter-from,
.steps-fade-leave-to {
  opacity: 0;
}
</style>
