export default async (_event) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw createError({ statusCode: 500, message: 'NEWS_API_KEY not set' });

  let data;
  try {
    data = await $fetch('https://newsapi.org/v2/top-headlines', {
      params: { sources: 'bbc-news,bbc-sport,four-four-two', pageSize: 20, apiKey },
      headers: { 'User-Agent': 'morning-dashboard/1.0' }
    });
  } catch (err) {
    console.error('NewsAPI fetch error:', err);
    throw createError({ statusCode: 502, message: 'Failed to reach NewsAPI' });
  }

  if (data.status !== 'ok') {
    throw createError({ statusCode: 502, message: `NewsAPI error: ${data.message}` });
  }

  const articles = (data.articles || [])
    .filter(a => a.title && a.title !== '[Removed]')
    .map((a, i) => ({ id: i, title: a.title, source: a.source?.name ?? '', url: a.url }));

  if (!articles.length) {
    throw createError({ statusCode: 500, message: 'No articles returned' });
  }

  return { articles, updated: new Date().toISOString() };
};
