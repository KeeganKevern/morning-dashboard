# Morning Dashboard

A personal morning briefing screen — designed to be opened once at the start of the day, or left running on a dedicated display. Pulls together everything relevant at a glance before you get going.

## What It Shows

- **Weather** — current conditions and hourly forecast for York
- **Liverpool FC** — next fixture, last result, and Premier League table
- **Stock Indices** — 6-month chart for S&P 500, NASDAQ, FTSE 100, and S&P 100
- **News Headlines** — biggest stories of the day, auto-scrolling
- **Photos** — a personal photo frame, cycling through a random image from your own collection

## Vision

The dashboard is personal infrastructure, not a product. It's built around specific interests and stays open all day, refreshing quietly in the background.

- **Photos** should feel like a digital photo frame — showing your own photos rather than random stock imagery
- **Stocks** are a quick pulse check on market conditions, not a trading tool
- **News** should surface the biggest stories of the day from a reliable source, not social media noise

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

## Development

```bash
npm run dev       # http://localhost:3000
npm run build     # production build
npm run preview   # preview production build
```
