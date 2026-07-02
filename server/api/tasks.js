const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TASKS_URL = 'https://www.googleapis.com/tasks/v1/lists';

const getAccessToken = async (clientId, clientSecret, refreshToken) => {
  const res = await $fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  return res.access_token;
};

export default async (_event) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const taskListId = process.env.GOOGLE_TASKLIST_ID || '@default';

  if (!clientId || !clientSecret || !refreshToken) {
    throw createError({ statusCode: 500, message: 'Google Tasks credentials not set' });
  }

  let accessToken;
  try {
    accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
  } catch (err) {
    console.error('Google token refresh error:', err);
    throw createError({ statusCode: 502, message: 'Failed to refresh Google access token' });
  }

  let data;
  try {
    data = await $fetch(`${TASKS_URL}/${encodeURIComponent(taskListId)}/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { showCompleted: false, showHidden: false }
    });
  } catch (err) {
    console.error('Google Tasks fetch error:', err);
    throw createError({ statusCode: 502, message: 'Failed to reach Google Tasks' });
  }

  const tasks = (data.items || [])
    .filter(t => t.status !== 'completed')
    .map(t => ({ id: t.id, title: t.title, notes: t.notes ?? null, due: t.due ?? null }))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

  return { tasks, updated: new Date().toISOString() };
};
