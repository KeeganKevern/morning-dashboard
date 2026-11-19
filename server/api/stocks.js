// Market summary for the bottom ticker: each index's latest close and its
// % change over the last 3 months, from Yahoo Finance's (unofficial) chart API.

const SYMBOLS = [
  { id: 'sp500', label: 'S&P 500', symbol: '^GSPC' },
  { id: 'nasdaq', label: 'NASDAQ', symbol: '^IXIC' },
  { id: 'ftse', label: 'FTSE 100', symbol: '^FTSE' },
  { id: 'sp100', label: 'S&P 100', symbol: '^OEX' }
];

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const fetchIndexSummary = async ({ id, label, symbol }) => {
  const res = await $fetch(`${YAHOO_BASE}/${encodeURIComponent(symbol)}`, {
    params: { range: '3mo', interval: '1d' }
  });

  const result = res?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${symbol}`);

  const closes = (result.indicators?.quote?.[0]?.close || [])
    .filter(c => typeof c === 'number' && !Number.isNaN(c));
  if (closes.length < 2) throw new Error(`Not enough data for ${symbol}`);

  const first = closes[0];
  const last = closes[closes.length - 1];
  const timestamps = result.timestamp || [];

  return {
    id,
    label,
    last,
    change3mPct: ((last - first) / first) * 100,
    from: timestamps[0] ? new Date(timestamps[0] * 1000).toISOString() : null
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
