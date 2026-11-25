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

    <div class="flex-1 min-h-0 grid grid-cols-2 grid-rows-[minmax(0,2fr)_minmax(0,3fr)] gap-x-5 gap-y-4">
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

      <!-- Google Tasks -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title section-title-main">Tasks</h3>
        <p v-if="!tasks.data.value" class="note" :class="tone(tasks)">{{ status(tasks, 'Loading tasks...') }}</p>
        <template v-else>
          <p v-if="!tasks.data.value.tasks.length" class="note text-zinc-500">Nothing due</p>
          <ul class="space-y-1.5 overflow-hidden">
            <li v-for="t in tasks.data.value.tasks" :key="t.id" class="flex gap-2.5 text-lg leading-tight">
              <span class="shrink-0 w-2 h-2 mt-2 rounded-full" :class="t.overdue ? 'bg-red-400' : t.due ? 'bg-amber-400' : 'bg-zinc-600'" />
              <span class="min-w-0 break-words" :class="t.overdue ? 'text-red-300' : 'text-zinc-100'">{{ t.title }}</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- Job tracker -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Applications</h3>
        <p v-if="!jobs.data.value" class="note" :class="tone(jobs)">{{ status(jobs, 'Loading applications...') }}</p>
        <AutoScroll v-else>
          <!-- Three groups; days are since the last note (review, chase) or since applying -->
          <div v-for="g in jobGroups" :key="g.key" class="mb-2.5 last:mb-0">
            <p class="text-[0.65rem] uppercase tracking-wider mb-1" :class="g.colour">{{ g.label }} · {{ g.items.length }}</p>
            <p v-if="!g.items.length" class="note text-zinc-600">{{ g.empty }}</p>
            <ul class="space-y-1">
              <li v-for="(j, i) in g.items" :key="i" class="flex gap-2 text-sm leading-tight">
                <span class="truncate text-zinc-100">{{ j.title }}<span class="text-zinc-500"> · {{ j.employer }}</span></span>
                <span class="ml-auto shrink-0 text-xs tabular-nums" :class="g.colour">{{ j.days ?? '?' }}d</span>
              </li>
            </ul>
          </div>
        </AutoScroll>
      </section>

      <!-- KP next steps -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Project next steps</h3>
        <p v-if="!projects.data.value" class="note" :class="tone(projects)">{{ status(projects, 'Loading projects...') }}</p>
        <p v-else-if="!projects.data.value.projects.length" class="note text-zinc-500">No active next steps</p>
        <!-- Every active project, in full, scrolling slowly when they don't all fit -->
        <AutoScroll v-else :speed="9">
          <ul class="space-y-2.5">
            <li v-for="p in projects.data.value.projects" :key="p.project" class="text-sm leading-snug">
              <span class="block text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400">{{ p.project }}</span>
              <span class="text-zinc-100">{{ p.step }}</span>
            </li>
          </ul>
        </AutoScroll>
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

const jobGroups = computed(() => {
  const j = jobs.data.value;
  if (!j) return [];
  return [
    { key: 'review', label: 'To review', items: j.review, empty: 'Nothing to review', colour: 'text-sky-400' },
    { key: 'chase', label: 'To chase', items: j.chase, empty: 'Nothing marked To chase', colour: 'text-amber-400' },
    { key: 'applied', label: `Applied · last ${j.recentDays} days`, items: j.applied, empty: 'None recently', colour: 'text-emerald-400' }
  ];
});
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
.note {
  font-size: 0.75rem;
}
</style>
