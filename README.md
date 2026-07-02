# Morning Dashboard

A personal morning briefing screen — running on a Raspberry Pi 3 in kiosk mode, powered on for a fixed weekday window (05:55–06:25) so everything relevant is on screen before you get going.

## What It Shows

- **Weather** — current conditions and hourly forecast for York
- **Liverpool FC** — next fixture, last result, and Premier League table
- **Stock Indices** — 6-month chart for S&P 500, NASDAQ, FTSE 100, and S&P 100
- **News Headlines** — biggest stories of the day, auto-scrolling
- **Photos** — a photo frame, currently cycling through random stock images (Picsum) as a placeholder — see [Vision](#vision)
- **Tasks** — to-do items logged from a phone via the Google Tasks app

## Vision

The dashboard is personal infrastructure, not a product. It's built around specific interests, fetches fresh data once per session, and doesn't need to run outside its daily window.

- **Photos** should eventually feel like a digital photo frame showing your own photos rather than random stock imagery — deferred for now, revisit when that becomes a priority
- **Stocks** are a quick pulse check on market conditions, not a trading tool — a rough 6-month trend plus the latest day-over-day move is enough, no need for a true intraday view
- **News** should surface the biggest stories of the day from a reliable source, not social media noise — the current BBC News/Sport/Four-Four-Two mix is kept as-is even though it isn't personalized (e.g. no Liverpool FC keyword filtering); anything club-significant is expected to surface via BBC News anyway
- **Tasks** should let a to-do logged on a phone during the day show up on the dashboard the next active session, without the dashboard needing to be on to receive it. Since the Pi's server only runs during the active window, this means reading from an always-on third-party service (Google Tasks) rather than the Pi hosting its own capture endpoint
- **Calendar was considered and dropped** — TimeTree (the calendar actually used) has no automatic way to export or sync events out to Google Calendar or anything else, only a one-way import of external calendars *into* TimeTree. Since maintaining events in two calendars manually isn't acceptable, there's no clean data source for a calendar widget right now

## Deployment

Runs on a Raspberry Pi 3 (Raspberry Pi OS), always powered on but idle outside its active window:

- A systemd timer starts the Nuxt server and a Chromium kiosk session at **05:55**, Monday–Friday
- A second systemd timer stops both and blanks the screen at **06:25**
- Both the server and the kiosk restart automatically on crash during the active window
- Because the server restarts each session, every widget's single startup fetch is guaranteed fresh — there's no need for background refresh intervals
- API keys are supplied to the systemd service via `EnvironmentFile=` pointing at `.env` (a plain `.env` in the working directory only works when launched via `npm`/`node` directly, not from a systemd unit)

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required keys:

| Variable | Source |
|---|---|
| `OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/api) |
| `FOOTBALL_DATA_API_KEY` | [football-data.org](https://www.football-data.org/) |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org/) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — create an OAuth 2.0 Client ID (type "Desktop app"), enable the Tasks API for the project |
| `GOOGLE_REFRESH_TOKEN` | Run the one-time helper below once `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set |
| `GOOGLE_TASKLIST_ID` | Defaults to `@default` (your primary Google Tasks list) — override if you want a specific list |

### Getting a Google Tasks refresh token

1. In the Google Cloud Console, add `http://localhost:53682/oauth2callback` as an authorized redirect URI on the OAuth client.
2. With `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in `.env`, run:

   ```bash
   node scripts/get-google-refresh-token.js
   ```

3. Open the printed URL, sign in with the Google account whose Tasks should appear on the dashboard, and grant access.
4. Copy the `GOOGLE_REFRESH_TOKEN` value it prints into `.env`.

This is a one-time step — the refresh token doesn't expire under normal use, so it only needs redoing if access is revoked.

## Development

```bash
npm run dev       # http://localhost:3000
npm run build     # production build
npm run preview   # preview production build
```
