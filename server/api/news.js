// Headlines for the two-line news ticker, from RSS and Atom feeds (no key).
// Top line: world and local news. Bottom line: interests. Each line takes
// the newest items from the last 24 hours and interleaves its categories.

const FEEDS = [
  { line: 'top', tag: 'NEWS', limit: 6, url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { line: 'top', tag: 'YORK', limit: 2, url: 'https://feeds.bbci.co.uk/news/england/york_and_north_yorkshire/rss.xml' },
  { line: 'bottom', tag: 'LFC', limit: 3, url: 'https://feeds.bbci.co.uk/sport/football/teams/liverpool/rss.xml' },
  { line: 'bottom', tag: 'PL', limit: 3, url: 'https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml' },
  // Current± and Electrical Review have no RSS feed; these are the nearest equivalents
  { line: 'bottom', tag: 'ELEC', limit: 3, url: 'https://www.energylivenews.com/feed/' },
  { line: 'bottom', tag: 'ELEC', limit: 3, url: 'https://www.electricaltimes.co.uk/feed/' },
  { line: 'bottom', tag: 'AI', limit: 3, url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { line: 'bottom', tag: 'AI', limit: 3, url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' }
];

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 5 * 60 * 1000;

// --- A small RSS/Atom reader: titles, links and dates are all we need ---

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const tagText = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};

const parseFeed = xml => {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.map(b => {
    const link = tagText(b, 'link') || (b.match(/<link\b[^>]*href="([^"]+)"/i)?.[1] ?? '');
    const date = new Date(tagText(b, 'pubDate') || tagText(b, 'published') || tagText(b, 'updated') || tagText(b, 'dc:date'));
    return { title: tagText(b, 'title'), link, published: date };
  }).filter(i => i.title && !Number.isNaN(i.published.getTime()));
};

const fetchFeed = async feed => {
  const xml = await $fetch(feed.url, {
    responseType: 'text',
    headers: { 'User-Agent': 'Mozilla/5.0 (morning-dashboard)' },
    timeout: 10000,
    retry: 0
  });
  const cutoff = Date.now() - MAX_AGE_MS;
  return parseFeed(xml)
    .filter(i => i.published.getTime() >= cutoff)
    .sort((a, b) => b.published - a.published)
    .slice(0, feed.limit)
    .map(i => ({ tag: feed.tag, title: i.title, url: i.link, published: i.published.toISOString() }));
};

// Take one item from each category in turn so no topic dominates a line
const interleave = items => {
  const byTag = new Map();
  for (const item of items) {
    if (!byTag.has(item.tag)) byTag.set(item.tag, []);
    byTag.get(item.tag).push(item);
  }
  const queues = [...byTag.values()];
  const out = [];
  while (queues.some(q => q.length)) {
    for (const q of queues) if (q.length) out.push(q.shift());
  }
  return out;
};

let cache = null; // { data, at }

export default async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`News feed failed (${FEEDS[i].url}):`, r.reason?.message ?? r.reason);
  });

  // A story can appear in more than one feed (e.g. Liverpool and Premier League)
  const seen = new Set();
  const all = results
    .flatMap((r, i) => (r.status === 'fulfilled' ? r.value.map(item => ({ ...item, line: FEEDS[i].line })) : []))
    .filter(item => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (!all.length) {
    if (cache) return cache.data; // keep the last headlines rather than none
    throw createError({ statusCode: 502, message: 'No news feeds could be read' });
  }

  const strip = ({ line, ...item }) => item;
  const data = {
    top: interleave(all.filter(i => i.line === 'top')).map(strip),
    bottom: interleave(all.filter(i => i.line === 'bottom')).map(strip),
    updated: new Date().toISOString()
  };
  cache = { data, at: Date.now() };
  return data;
};
