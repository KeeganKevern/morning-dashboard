// Google Tasks for the Today panel: tasks due today or overdue on any list,
// then undated tasks from the default list.

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';

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
  const defaultId = lists[0]?.id; // the first list is the default one
  const perList = await Promise.all(lists.map(async l => ({ list: l, tasks: await openTasks(l.id) })));

  const due = [];
  const undated = [];
  for (const { list, tasks } of perList) {
    for (const t of tasks) {
      // Tasks stores due dates as midnight UTC, so the date part is the day
      const dueDay = t.due?.slice(0, 10);
      const item = { id: t.id, title: t.title.trim(), list: list.title, due: dueDay ?? null, overdue: !!dueDay && dueDay < today };
      if (dueDay && dueDay <= today) due.push(item);
      else if (!dueDay && list.id === defaultId) undated.push(item);
    }
  }
  due.sort((a, b) => a.due.localeCompare(b.due));

  return { tasks: [...due, ...undated], updated: new Date().toISOString() };
};
