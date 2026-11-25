// Football column data: the Premier League table, Liverpool's next and last
// match, the latest PL round's results (football-data.org) and England's
// fixtures (TheSportsDB's free key). Cached on the server so reloads stay
// under football-data.org's 10 requests a minute.

const FD_BASE = 'https://api.football-data.org/v4';
const SDB_BASE = 'https://www.thesportsdb.com/api/v1/json/123';
const LIVERPOOL_ID = 64;
const ENGLAND_ID = '133914';
// Nations League, friendlies, Euro qualifying, World Cup qualifying
const ENGLAND_LEAGUES = ['4490', '4562', '5519', '5518'];
const TZ = 'Europe/London';
const DAY = 24 * 60 * 60 * 1000;

const CACHE_MS = 10 * 60 * 1000;
const ENGLAND_CACHE_MS = 6 * 60 * 60 * 1000;
const ENGLAND_RETRY_MS = 30 * 60 * 1000;
const ENGLAND_WINDOW_DAYS = 30;

const ordinal = n => {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

// "Sunday 22nd" and "16:30", always in UK time whatever the server's zone
const formatDate = d => {
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: TZ });
  const day = Number(d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: TZ }));
  return `${weekday} ${day}${ordinal(day)}`;
};
const formatTime = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

const fdGet = (path, params) =>
  $fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
    params,
    retry: 0
  });

const isoDay = d => d.toISOString().slice(0, 10);

const fetchFootballData = async () => {
  const today = new Date();
  const [standings, upcoming, finished, recent] = await Promise.all([
    fdGet('/competitions/PL/standings'),
    fdGet(`/teams/${LIVERPOOL_ID}/matches`, { status: 'SCHEDULED', limit: 5 }),
    fdGet(`/teams/${LIVERPOOL_ID}/matches`, { status: 'FINISHED', limit: 5 }),
    fdGet('/competitions/PL/matches', {
      status: 'FINISHED',
      dateFrom: isoDay(new Date(today - 14 * DAY)),
      dateTo: isoDay(today)
    })
  ]);

  const nextMatch = [...upcoming.matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
  const lastMatch = [...finished.matches].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];

  // The latest round that has any finished games
  const latestRound = Math.max(0, ...recent.matches.map(m => m.matchday ?? 0));
  const roundMatches = recent.matches
    .filter(m => m.matchday === latestRound)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map(m => ({
      home: m.homeTeam.tla,
      away: m.awayTeam.tla,
      score: `${m.score.fullTime.home} - ${m.score.fullTime.away}`
    }));

  return {
    table: standings.standings[0].table.map(team => ({
      position: team.position,
      team: team.team.name,
      shortName: team.team.tla,
      // "Brighton Hove", "Tottenham": fits the table on the TV without cutting off
      displayName: team.team.shortName || team.team.name,
      played: team.playedGames,
      won: team.won,
      drawn: team.draw,
      lost: team.lost,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalDifference,
      points: team.points
    })),
    liverpool: {
      lastMatch: lastMatch ? {
        home: lastMatch.homeTeam.tla,
        away: lastMatch.awayTeam.tla,
        score: `${lastMatch.score.fullTime.home} - ${lastMatch.score.fullTime.away}`
      } : null,
      nextMatch: nextMatch ? {
        date: formatDate(new Date(nextMatch.utcDate)),
        time: formatTime(new Date(nextMatch.utcDate)),
        home: nextMatch.homeTeam.tla,
        away: nextMatch.awayTeam.tla,
        competition: nextMatch.competition.name
      } : null
    },
    results: roundMatches.length ? { matchday: latestRound, matches: roundMatches } : null
  };
};

// --- England (TheSportsDB) ---

const sdbGet = async (file, params) => {
  try {
    return await $fetch(`${SDB_BASE}/${file}`, { params, retry: 0 });
  } catch (err) {
    console.error(`TheSportsDB ${file} failed:`, err.message);
    sdbFailed = true;
    return null;
  }
};

// Set when any lookup fails (the free key rate-limits hard), so the England
// result is cached briefly and retried instead of kept for 6 hours
let sdbFailed = false;

// TheSportsDB times are UTC, usually without a zone marker
const eventDate = e => {
  const ts = e.strTimestamp || `${e.dateEvent}T${e.strTime || '00:00:00'}`;
  return new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(ts) ? ts : `${ts}Z`);
};

const shortName = name => (name || '').replace(/ and /g, ' & ');

// England's next fixture: the next-events lookup first, then the season lists
// (the free key caps each list, so this can still miss fixtures)
const findEnglandNext = async now => {
  const next = await sdbGet('eventsnext.php', { id: ENGLAND_ID });
  const fromNext = (next?.events || []).map(e => ({ e, at: eventDate(e) })).filter(x => x.at > now);
  if (fromNext.length) return fromNext.sort((a, b) => a.at - b.at)[0];

  const year = now.getUTCFullYear();
  // Split seasons (Nations League) and calendar years (friendlies); the free
  // key allows few calls, so only these two are tried per competition
  const seasons = [`${year}-${year + 1}`, `${year}`];
  const found = [];
  for (const league of ENGLAND_LEAGUES) {
    for (const s of seasons) {
      const res = await sdbGet('eventsseason.php', { id: league, s });
      for (const e of res?.events || []) {
        if ((e.idHomeTeam === ENGLAND_ID || e.idAwayTeam === ENGLAND_ID) && eventDate(e) > now) {
          found.push({ e, at: eventDate(e) });
        }
      }
      if (res?.events?.length) break; // found this league's current season
    }
  }
  return found.sort((a, b) => a.at - b.at)[0] ?? null;
};

const fetchEngland = async now => {
  const [nextFound, last] = await Promise.all([
    findEnglandNext(now),
    sdbGet('eventslast.php', { id: ENGLAND_ID })
  ]);
  const lastEvent = (last?.results || last?.events || [])[0];

  return {
    nextMatch: nextFound ? {
      at: nextFound.at.toISOString(),
      date: formatDate(nextFound.at),
      time: formatTime(nextFound.at),
      home: shortName(nextFound.e.strHomeTeam),
      away: shortName(nextFound.e.strAwayTeam),
      competition: nextFound.e.strLeague
    } : null,
    lastMatch: lastEvent ? {
      home: shortName(lastEvent.strHomeTeam),
      away: shortName(lastEvent.strAwayTeam),
      score: `${lastEvent.intHomeScore ?? '-'} - ${lastEvent.intAwayScore ?? '-'}`
    } : null
  };
};

// --- Caches ---

let footballCache = null; // { data, at }
let englandCache = null;

export default async () => {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    throw createError({ statusCode: 500, message: 'FOOTBALL_DATA_API_KEY not set' });
  }

  const now = new Date();

  if (!footballCache || Date.now() - footballCache.at > CACHE_MS) {
    try {
      footballCache = { data: await fetchFootballData(), at: Date.now() };
    } catch (err) {
      console.error('Football API error:', err);
      // Serve the last good data rather than an empty column
      if (!footballCache) throw createError({ statusCode: 502, message: 'Failed to fetch football data' });
    }
  }

  // England is optional: a TheSportsDB failure just leaves the card out
  if (!englandCache || Date.now() - englandCache.at > englandCache.ttl) {
    sdbFailed = false;
    const data = await fetchEngland(now);
    englandCache = { data, at: Date.now(), ttl: sdbFailed ? ENGLAND_RETRY_MS : ENGLAND_CACHE_MS };
  }
  const england = englandCache.data;

  // Skip England when there's no fixture in the next 30 days
  const englandNextAt = england.nextMatch ? new Date(england.nextMatch.at) : null;
  const showEngland = englandNextAt && englandNextAt - now <= ENGLAND_WINDOW_DAYS * DAY;

  return {
    ...footballCache.data,
    england: showEngland ? england : null,
    updated: new Date(footballCache.at).toISOString()
  };
};
