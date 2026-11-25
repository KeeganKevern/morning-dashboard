// Met Office weather warnings for the top of the Today panel, from the
// region's RSS feed (no key). Yorkshire & Humber unless MET_OFFICE_REGION
// says otherwise (e.g. UK, to see the whole country).

const FEED = 'https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region';
const CACHE_MS = 10 * 60 * 1000;

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1] ?? '');

// "Yellow warning of rain affecting South West England: Cornwall, Devon
//  valid from 0600 Sun 22 Nov to 2359 Sun 22 Nov"
const parseWarning = item => {
  const title = tag(item, 'title');
  const description = tag(item, 'description');
  const level = title.match(/^(Yellow|Amber|Red)\b/i)?.[1].toLowerCase() ?? 'yellow';
  const hazard = title.match(/warning of (.+?) affecting/i)?.[1] ?? 'weather';
  const time = t => `${t.slice(0, 2)}:${t.slice(2)}`;
  const valid = description.match(/valid from (\d{4}) (\w{3} \d{1,2} \w{3}) to (\d{4}) (\w{3} \d{1,2} \w{3})/i);
  return {
    level,
    hazard,
    areas: description.split(':')[1]?.replace(/ valid from.*$/i, '').trim() ?? '',
    from: valid ? `${time(valid[1])} ${valid[2]}` : null,
    to: valid ? `${time(valid[3])} ${valid[4]}` : null,
    url: tag(item, 'link')
  };
};

let cache = null; // { data, at }

export default async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const region = process.env.MET_OFFICE_REGION || 'yh';
  let xml;
  try {
    xml = await $fetch(`${FEED}/${encodeURIComponent(region)}`, {
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (morning-dashboard)' },
      timeout: 10000,
      retry: 0
    });
  } catch (err) {
    console.error('Met Office warnings error:', err.message);
    if (cache) return cache.data; // keep the last known warnings
    throw createError({ statusCode: 502, message: 'Met Office warnings unavailable' });
  }

  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const order = { red: 0, amber: 1, yellow: 2 };
  const data = {
    region: tag(xml, 'title').replace(/^Met Office warnings for /, ''),
    warnings: items.map(parseWarning).sort((a, b) => order[a.level] - order[b.level]),
    updated: new Date().toISOString()
  };
  cache = { data, at: Date.now() };
  return data;
};
