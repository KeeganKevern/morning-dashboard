// Job applications for the Today panel, from the job tracker Google Sheet.
// Three lists, nothing else:
//   - To review: rows with Status "To review"
//   - To chase:  rows Keegan has set to "To chase" (nothing is chased by default)
//   - Applied:   rows with Status "Applied" that were applied for in the last 14 days
// plus appliedTotal: every application ever sent (Applied, To chase, Rejected,
// Interview or Offer), however long ago.

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const TABS = ['Office', 'Careers', 'Other', 'Remote', 'Engineering'];
const RECENT_DAYS = 14;
// Statuses that mean the application was sent
const SENT = /^(applied|to chase|rejected|interview|offer)/i;
const DAY = 24 * 60 * 60 * 1000;

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Notes lines start with "12 Nov 2026:" or "2026-11-20:"
const lineDate = line => {
  const dmy = line.match(/^\s*(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})/);
  if (dmy && MONTHS[dmy[2].toLowerCase()] !== undefined) return Date.UTC(+dmy[3], MONTHS[dmy[2].toLowerCase()], +dmy[1]);
  const iso = line.match(/^\s*(\d{4})-(\d{2})-(\d{2})/);
  return iso ? Date.UTC(+iso[1], +iso[2] - 1, +iso[3]) : null;
};

const datedLines = notes => (notes || '').split('\n').map(l => ({ line: l, at: lineDate(l) })).filter(x => x.at);

// When it was applied for: the first dated "applied" note; failing that, the
// newest dated note (usually "CV built"); failing that, when the job was found
const appliedDate = (notes, found) => {
  const lines = datedLines(notes);
  const applied = lines.filter(x => /:\s*applied\b/i.test(x.line)).map(x => x.at);
  if (applied.length) return Math.min(...applied);
  if (lines.length) return Math.max(...lines.map(x => x.at));
  const f = Date.parse(`${found}T00:00:00Z`);
  return Number.isNaN(f) ? null : f;
};

// Days since the newest dated note, or since the job was found
const lastActivity = (notes, found) => {
  const lines = datedLines(notes);
  if (lines.length) return Math.max(...lines.map(x => x.at));
  const f = Date.parse(`${found}T00:00:00Z`);
  return Number.isNaN(f) ? null : f;
};

export default async () => {
  const sheetId = process.env.JOB_TRACKER_SHEET_ID;
  if (!sheetId) throw createError({ statusCode: 503, message: 'JOB_TRACKER_SHEET_ID not set' });

  let res;
  try {
    res = await googleGet(`${SHEETS_BASE}/${sheetId}/values:batchGet`, {
      ranges: TABS.map(t => `${t}!A1:N`)
    });
  } catch (err) {
    if (err.statusCode && !err.response) throw err;
    console.error('Job tracker read error:', err?.data?.error?.message ?? err.message);
    throw createError({ statusCode: 502, message: 'Failed to read the job tracker' });
  }

  const today = Date.parse(`${londonToday()}T00:00:00Z`);
  const daysSince = at => (at === null ? null : Math.round((today - at) / DAY));
  const review = [];
  const chase = [];
  const applied = [];
  let appliedTotal = 0;

  res.valueRanges.forEach((range, i) => {
    const [header, ...rows] = range.values || [];
    if (!header) return;
    const col = name => header.indexOf(name);
    const [cTitle, cEmployer, cFound, cStatus, cNotes] = ['Title', 'Employer', 'Date found', 'Status', 'Notes'].map(col);

    for (const row of rows) {
      const status = (row[cStatus] || '').trim();
      const item = { title: row[cTitle] || '', employer: row[cEmployer] || '', tab: TABS[i] };
      if (SENT.test(status)) appliedTotal++;
      if (status === 'To review') {
        review.push({ ...item, days: daysSince(lastActivity(row[cNotes], row[cFound])) });
      } else if (status === 'To chase') {
        chase.push({ ...item, days: daysSince(lastActivity(row[cNotes], row[cFound])) });
      } else if (status === 'Applied') {
        const days = daysSince(appliedDate(row[cNotes], row[cFound]));
        if (days !== null && days <= RECENT_DAYS) applied.push({ ...item, days });
      }
    }
  });

  // Oldest first for things waiting on Keegan; newest first for recent applications
  const oldestFirst = (a, b) => (b.days ?? -1) - (a.days ?? -1);
  review.sort(oldestFirst);
  chase.sort(oldestFirst);
  applied.sort((a, b) => a.days - b.days);

  return { review, chase, applied, appliedTotal, recentDays: RECENT_DAYS, updated: new Date().toISOString() };
};
