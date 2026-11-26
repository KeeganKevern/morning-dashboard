// Market summary for the stocks panel: each index's latest close and its
// % change over the last 7 days and 3 months, from Yahoo Finance's (unofficial) chart API.

const SYMBOLS = [
  { id: 'sp500', label: 'S&P 500', symbol: '^GSPC' },
  { id: 'nasdaq', label: 'NASDAQ', symbol: '^IXIC' },
  { id: 'ftse', label: 'FTSE 100', symbol: '^FTSE' },
  // Vanguard LifeStrategy 100% Equity A Acc (GBP, priced once a day)
  { id: 'ls100', label: 'LifeStrategy 100', symbol: '0P0000TKZO.L' }
];

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const DAY = 24 * 60 * 60 * 1000;

const fetchIndexSummary = async ({ id, label, symbol }) => {
  const res = await $fetch(`${YAHOO_BASE}/${encodeURIComponent(symbol)}`, {
    params: { range: '3mo', interval: '1d' }
  });

  const result = res?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${symbol}`);

  // Pair each close with its date, dropping days with no close
  const rawCloses = result.indicators?.quote?.[0]?.close || [];
  const points = (result.timestamp || [])
    .map((t, i) => ({ at: t * 1000, close: rawCloses[i] }))
    .filter(p => typeof p.close === 'number' && !Number.isNaN(p.close));
  if (points.length < 2) throw new Error(`Not enough data for ${symbol}`);

  const first = points[0];
  const last = points[points.length - 1];
  // 7-day change: against the last close on or before a week before the latest
  const weekAgo = [...points].reverse().find(p => p.at <= last.at - 7 * DAY) ?? first;
  const pct = from => ((last.close - from.close) / from.close) * 100;

  return {
    id,
    label,
    last: last.close,
    change7dPct: pct(weekAgo),
    change3mPct: pct(first),
    // The closes each figure compares, so the panel can say exactly what it shows
    closeAt: new Date(last.at).toISOString(),
    weekAgoAt: new Date(weekAgo.at).toISOString(),
    from: new Date(first.at).toISOString()
  };
};

export default async () => {
  // One failing index shouldn't hide the others
  const results = await Promise.allSettled(SYMBOLS.map(fetchIndexSummary));
  const indices = results.filter(r => r.status === 'fulfilled').map(r => r.value);

  results
    .filter(r => r.status === 'rejected')
    .forEach(r => console.error('Stocks API error:', r.reason));

  if (!indices.length) {
    throw createError({ statusCode: 502, message: 'Failed to fetch stock index data' });
  }

  return { indices, updated: new Date().toISOString() };
};
