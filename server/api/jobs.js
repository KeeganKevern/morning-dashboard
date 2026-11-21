// Job applications for the Today panel, from the job tracker Google Sheet:
// counts of active statuses, and the applications to chase (Applied, with no
// dated note for 14 days or more).

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const TABS = ['Office', 'Careers', 'Other', 'Remote', 'Engineering'];
const CHASE_AFTER_DAYS = 14;
const COUNTED = ['Applying', 'Applied', 'To review'];
const DAY = 24 * 60 * 60 * 1000;

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Notes lines start with "12 Nov 2026:" or "2026-11-20:"; the newest is the last activity
const latestNoteDate = notes => {
  let latest = null;
  for (const line of (notes || '').split('\n')) {
    let d = null;
    const dmy = line.match(/^\s*(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})/);
    const iso = line.match(/^\s*(\d{4})-(\d{2})-(\d{2})/);
    if (dmy && MONTHS[dmy[2].toLowerCase()] !== undefined) d = Date.UTC(+dmy[3], MONTHS[dmy[2].toLowerCase()], +dmy[1]);
    else if (iso) d = Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
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

  const counts = Object.fromEntries(COUNTED.map(s => [s, 0]));
  const chase = [];
  const today = Date.parse(`${londonToday()}T00:00:00Z`);

  res.valueRanges.forEach((range, i) => {
    const [header, ...rows] = range.values || [];
    if (!header) return;
    const col = name => header.indexOf(name);
    const [cTitle, cEmployer, cFound, cStatus, cNotes] = ['Title', 'Employer', 'Date found', 'Status', 'Notes'].map(col);

    for (const row of rows) {
      const status = (row[cStatus] || '').trim();
      if (status in counts) counts[status]++;
      if (status !== 'Applied') continue;

      const last = latestNoteDate(row[cNotes]) ?? Date.parse(`${row[cFound]}T00:00:00Z`);
      const days = Number.isNaN(last) ? null : Math.round((today - last) / DAY);
      if (days === null || days >= CHASE_AFTER_DAYS) {
        chase.push({ title: row[cTitle] || '', employer: row[cEmployer] || '', tab: TABS[i], days });
      }
    }
  });

  chase.sort((a, b) => (b.days ?? 999) - (a.days ?? 999));
  return { counts, chase, updated: new Date().toISOString() };
};
