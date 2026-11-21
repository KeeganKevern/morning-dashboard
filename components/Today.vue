<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl text-white w-full h-full p-3 flex flex-col min-h-0">
    <div class="flex items-baseline justify-between mb-2">
      <span class="text-xs font-semibold tracking-widest uppercase text-zinc-400">Today</span>
      <span v-if="projects.data.value?.warning" class="text-[0.65rem] font-semibold text-amber-400">{{ projects.data.value.warning }}</span>
    </div>

    <div class="flex-1 min-h-0 grid grid-cols-4 gap-4">
      <!-- TimeTree -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Calendar</h3>
        <p v-if="!events.data.value" class="note" :class="tone(events)">{{ status(events, 'Loading events...') }}</p>
        <template v-else>
          <p v-if="events.data.value.stale" class="note text-amber-400">TimeTree export is out of date</p>
          <p v-if="!events.data.value.events.length" class="note text-zinc-500">Nothing on today</p>
          <ul class="space-y-1 overflow-hidden">
            <li v-for="(e, i) in events.data.value.events" :key="i" class="flex gap-2 text-sm leading-tight">
              <span class="shrink-0 w-14 whitespace-nowrap text-zinc-400 tabular-nums">{{ e.allDay ? 'All day' : e.time }}</span>
              <span class="text-zinc-100 truncate">{{ e.title }}</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- Google Tasks -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Tasks</h3>
        <p v-if="!tasks.data.value" class="note" :class="tone(tasks)">{{ status(tasks, 'Loading tasks...') }}</p>
        <template v-else>
          <p v-if="!tasks.data.value.tasks.length" class="note text-zinc-500">Nothing due</p>
          <ul class="space-y-1 overflow-hidden">
            <li v-for="t in tasks.data.value.tasks" :key="t.id" class="flex gap-2 text-sm leading-tight">
              <span class="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full" :class="t.overdue ? 'bg-red-400' : t.due ? 'bg-amber-400' : 'bg-zinc-600'" />
              <span class="truncate" :class="t.overdue ? 'text-red-300' : 'text-zinc-100'">{{ t.title }}</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- Job tracker -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Applications</h3>
        <p v-if="!jobs.data.value" class="note" :class="tone(jobs)">{{ status(jobs, 'Loading applications...') }}</p>
        <template v-else>
          <div class="flex gap-3 text-xs text-zinc-400 mb-1.5">
            <span v-for="(n, s) in jobs.data.value.counts" :key="s"><span class="text-zinc-100 font-semibold">{{ n }}</span> {{ s.toLowerCase() }}</span>
          </div>
          <p class="text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">To chase · {{ jobs.data.value.chase.length }}<span class="normal-case tracking-normal"> (oldest first)</span></p>
          <p v-if="!jobs.data.value.chase.length" class="note text-zinc-500">Nothing to chase</p>
          <ul class="space-y-1 overflow-hidden">
            <li v-for="(c, i) in jobs.data.value.chase" :key="i" class="flex gap-2 text-sm leading-tight">
              <span class="truncate text-zinc-100">{{ c.title }}<span class="text-zinc-500"> · {{ c.employer }}</span></span>
              <span class="ml-auto shrink-0 text-xs text-amber-400 tabular-nums">{{ c.days ?? '?' }}d</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- KP next steps -->
      <section class="min-h-0 flex flex-col">
        <h3 class="section-title">Project next steps</h3>
        <p v-if="!projects.data.value" class="note" :class="tone(projects)">{{ status(projects, 'Loading projects...') }}</p>
        <template v-else>
          <p v-if="!projects.data.value.projects.length" class="note text-zinc-500">No active next steps</p>
          <ul class="space-y-1.5 overflow-hidden">
            <li v-for="p in projects.data.value.projects" :key="p.project" class="text-sm leading-tight">
              <span class="block text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400">{{ p.project }}</span>
              <span class="text-zinc-100 line-clamp-2">{{ p.step }}</span>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
const events = usePolled('/api/timetree', 15 * MINUTE);
const tasks = usePolled('/api/tasks', 5 * MINUTE);
const jobs = usePolled('/api/jobs', 30 * MINUTE);
const projects = usePolled('/api/projects', 60 * MINUTE);

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
  color: rgb(161 161 170);
  margin-bottom: 0.375rem;
}
.note {
  font-size: 0.75rem;
}
</style>
