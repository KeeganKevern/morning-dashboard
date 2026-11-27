// Today's events from the shared TimeTree calendar, read from the .ics file
// that timetree-exporter writes once a day (scripts/timetree-sync). TimeTree
// has no official API, so a missing or stale file is reported, not hidden.
import { readFile, stat } from 'node:fs/promises';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // a day without a fresh export
const DAY = 24 * 60 * 60 * 1000;
const TZ = 'Europe/London';
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// One formatter each: making a new one per call took ~10 s per request on a Pi 3
const YMD = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const HM = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const ymd = d => YMD.format(d);
const hm = d => HM.format(d);

// The answer only changes with a new export or a new day
let cached = null; // { key, body }

// Lines folded onto the next line start with a space or tab
const unfold = ics => ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);

const unescape = s => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

// "DTSTART;VALUE=DATE:20261120" / "DTSTART;TZID=Asia/Tokyo:20261120T090000" / "...Z"
const parseDate = (params, value) => {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h) return { allDay: true, day: `${y}-${mo}-${d}` };
  if (z) return { allDay: false, at: new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +s)) };
  // Local time in the event's zone: find the UTC instant whose wall time matches
  const tz = params.match(/TZID=([^;:]+)/)?.[1] || TZ;
  const guess = Date.UTC(+y, mo - 1, +d, +h, +mi, +s);
  const wall = new Date(new Date(guess).toLocaleString('en-US', { timeZone: tz }) + ' UTC').getTime();
  return { allDay: false, at: new Date(guess - (wall - guess)) };
};

const parseEvents = ics => {
  const events = [];
  let ev = null;
  for (const line of unfold(ics)) {
    if (line === 'BEGIN:VEVENT') { ev = { exdates: [] }; continue; }
    if (line === 'END:VEVENT') { if (ev?.start) events.push(ev); ev = null; continue; }
    if (!ev) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const [name, ...rest] = line.slice(0, i).split(';');
    const params = rest.join(';');
    const value = line.slice(i + 1);
    if (name === 'SUMMARY') ev.title = unescape(value);
    else if (name === 'DTSTART') ev.start = parseDate(params, value);
    else if (name === 'DTEND') ev.end = parseDate(params, value);
    else if (name === 'RRULE') ev.rrule = Object.fromEntries(value.split(';').map(p => p.split('=')));
    else if (name === 'EXDATE') value.split(',').forEach(v => ev.exdates.push(parseDate(params, v)));
  }
  return events;
};

// The day (YYYY-MM-DD, UK) an occurrence starts on
const startDay = s => (s.allDay ? s.day : ymd(s.at));

// Does a (possibly recurring) event have an occurrence on `today`?
const occursOn = (ev, today) => {
  const first = startDay(ev.start);
  const lengthDays = ev.end && ev.start.allDay && ev.end.allDay
    ? Math.max(1, Math.round((Date.parse(ev.end.day) - Date.parse(ev.start.day)) / DAY))
    : 1;
  const covers = day => day <= today && today < ymd(new Date(Date.parse(`${day}T12:00:00Z`) + lengthDays * DAY));

  if (!ev.rrule) return covers(first);

  const { FREQ, INTERVAL = '1', UNTIL, COUNT, BYDAY } = ev.rrule;
  const step = Number(INTERVAL) || 1;
  const until = UNTIL ? startDay(parseDate('', UNTIL) ?? { allDay: true, day: '9999-12-31' }) : '9999-12-31';
  const skip = new Set(ev.exdates.filter(Boolean).map(startDay));
  const byDay = BYDAY ? BYDAY.split(',').map(d => d.slice(-2)) : null;

  let n = 0;
  const base = new Date(`${first}T12:00:00Z`);
  for (let k = 0; k < 5000; k++) {
    const d = new Date(base);
    if (FREQ === 'DAILY') d.setUTCDate(d.getUTCDate() + k * step);
    else if (FREQ === 'WEEKLY') d.setUTCDate(d.getUTCDate() + k * 7 * step);
    else if (FREQ === 'MONTHLY') d.setUTCMonth(d.getUTCMonth() + k * step);
    else if (FREQ === 'YEARLY') d.setUTCFullYear(d.getUTCFullYear() + k * step);
    else return covers(first);

    // Weekly rules with BYDAY repeat on each listed weekday of that week
    const days = FREQ === 'WEEKLY' && byDay
      ? byDay.map(wd => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + ((WEEKDAYS.indexOf(wd) - d.getUTCDay() + 7) % 7)); return x; })
      : [d];

    for (const day of days.map(x => x.toISOString().slice(0, 10)).sort()) {
      if (day > until || day > today) return false;
      if (day < first) continue;
      n++;
      if (COUNT && n > Number(COUNT)) return false;
      if (!skip.has(day) && covers(day)) return true;
    }
  }
  return false;
};

export default async () => {
  const file = process.env.TIMETREE_ICS;
  if (!file) throw createError({ statusCode: 503, message: 'TimeTree not set up' });

  let info;
  try {
    info = await stat(file);
  } catch {
    throw createError({ statusCode: 503, message: 'TimeTree unavailable' });
  }

  const today = ymd(new Date());
  const status = () => ({
    stale: Date.now() - info.mtimeMs > STALE_AFTER_MS, // the export timer has stopped
    exported: info.mtime.toISOString(),
    updated: new Date().toISOString()
  });
  const key = `${info.mtimeMs}|${today}`;
  if (cached?.key === key) return { ...cached.body, ...status() };

  let ics;
  try {
    ics = await readFile(file, 'utf8');
  } catch {
    throw createError({ statusCode: 503, message: 'TimeTree unavailable' });
  }
  // The UK date after today (noon avoids any clock-change edge)
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + DAY).toISOString().slice(0, 10);

  const all = parseEvents(ics);
  // All-day events first, then by start time. endTime is the clock time the
  // event ends (null for all-day events and ones with no end).
  const eventsOn = day => all
    .filter(ev => occursOn(ev, day))
    .map(ev => ({
      title: ev.title || '(no title)',
      allDay: ev.start.allDay,
      time: ev.start.allDay ? null : hm(ev.start.at),
      endTime: !ev.start.allDay && ev.end && !ev.end.allDay ? hm(ev.end.at) : null
    }))
    .sort((a, b) => (a.allDay === b.allDay ? (a.time || '').localeCompare(b.time || '') : a.allDay ? -1 : 1));

  const body = { events: eventsOn(today), tomorrow: eventsOn(tomorrow) };
  cached = { key, body };
  return { ...body, ...status() };
};
