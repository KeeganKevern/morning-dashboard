// Google Tasks for the Today panel: every open task on every list, in two groups.
//   - urgent: late, or dated within the next URGENT_DAYS days
//   - rest:   dated later (soonest first), then undated ones (background tasks)
// The task's Date in the Tasks app is the only date Google shares with other
// apps (its Deadline isn't), so the Date is treated as the day it's needed by.

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';
const URGENT_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;

const openTasks = async listId => {
  const res = await googleGet(`${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks`, {
    showCompleted: false,
    showHidden: false,
    maxResults: 100
  });
  return (res.items || []).filter(t => t.status !== 'completed' && t.title?.trim());
};

export default async () => {
  let lists;
  try {
    lists = (await googleGet(`${TASKS_BASE}/users/@me/lists`, { maxResults: 100 })).items || [];
  } catch (err) {
    if (err.statusCode && !err.response) throw err; // sign-in problems already explained
    console.error('Google Tasks lists error:', err.message);
    throw createError({ statusCode: 502, message: 'Failed to reach Google Tasks' });
  }

  const today = londonToday();
  const todayAt = Date.parse(`${today}T00:00:00Z`);
  const perList = await Promise.all(lists.map(async l => ({ list: l, tasks: await openTasks(l.id) })));

  const urgent = [];
  const dated = [];
  const undated = [];
  for (const { list, tasks } of perList) {
    for (const t of tasks) {
      // Tasks stores dates as midnight UTC, so the date part is the day
      const due = t.due?.slice(0, 10) ?? null;
      // Days until the date: negative when late, 0 today
      const daysLeft = due ? Math.round((Date.parse(`${due}T00:00:00Z`) - todayAt) / DAY) : null;
      const item = { id: t.id, title: t.title.trim(), list: list.title, due, daysLeft, overdue: daysLeft !== null && daysLeft < 0 };
      if (daysLeft === null) undated.push(item);
      else if (daysLeft <= URGENT_DAYS) urgent.push(item);
      else dated.push(item);
    }
  }
  const byDate = (a, b) => a.due.localeCompare(b.due);
  urgent.sort(byDate);
  dated.sort(byDate);

  return { urgent, rest: [...dated, ...undated], urgentDays: URGENT_DAYS, updated: new Date().toISOString() };
};
