const SYMBOLS = [
  { id: 'sp500', label: 'S&P 500', symbol: '^GSPC' },
  { id: 'nasdaq', label: 'NASDAQ', symbol: '^IXIC' },
  { id: 'ftse', label: 'FTSE 100', symbol: '^FTSE' },
  { id: 'sp100', label: 'S&P 100', symbol: '^OEX' }
];

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const fetchIndexHistory = async (symbol) => {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=6mo&interval=1d`;

  const res = await $fetch(url);

  if (!res?.chart?.result?.length) {
    throw new Error(`No data returned for ${symbol}`);
  }

  const result = res.chart.result[0];
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  const points = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString(),
      close: closes[i]
    }))
    .filter(p => typeof p.close === 'number' && !Number.isNaN(p.close));

  return {
    symbol,
    currency: result.meta?.currency || 'USD',
    firstDate: points[0]?.date || null,
    lastDate: points[points.length - 1]?.date || null,
    points
  };
};

export default async (event) => {
  try {
    const results = await Promise.all(
      SYMBOLS.map(meta =>
        fetchIndexHistory(meta.symbol).then(data => ({
          id: meta.id,
          label: meta.label,
          ...data
        }))
      )
    );

    return {
      indices: results,
      updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Stocks API error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch stock index data'
    });
  }
};
