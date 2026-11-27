# Morning Dashboard

A personal morning briefing on a 65" TV, driven by a Raspberry Pi 3. Each morning the Pi wakes the TV in set windows and shows what the day needs: the calendar, tasks, job applications, project next steps, and Met Office warnings in the centre, with weather, photos, football, markets, and news around them. Outside the windows the TV is left alone, but picking HDMI 3 shows the dashboard at any time.

It's a Nuxt 4 app (Tailwind 4, `node-server` preset). Each widget polls its own server route, and the routes fetch from outside APIs with the keys kept on the server.

## What it shows

| Widget | Source | Refresh |
|---|---|---|
| **Today: Calendar** | Today's and tomorrow's events from the shared TimeTree calendar, exported once a day to an `.ics` file. Flagged when the export is over 24 hours old. | 15 min |
| **Today: Tasks** | Every open Google Task on every list: Urgent (late, or dated within 3 days) as tiles, then everything else. A task's Date is treated as the day it's needed by. | 5 min |
| **Today: Applications** | The job tracker Google Sheet: To review, To chase, the total ever sent, and applications from the last 14 days. | 30 min |
| **Today: Project next steps** | The suggested next step from each Progress Overview page in Confluence (read only), two at a time. | 60 min |
| **Today: Warnings** | Met Office weather warnings for Yorkshire & Humber, shown only when there are any. | 15 min |
| **Weather** | York from [Open-Meteo](https://open-meteo.com/) (no key): current conditions and 06:00–18:00 hourly, tomorrow's after 18:00. | 30 min |
| **Photos** | A random photo every minute from the shared Google Drive "Dashboard Photos" folder, as 800px thumbnails. | List hourly |
| **Football** | Liverpool, England, and the latest Premier League round rotating every 15 s above a half-height table (football-data.org; England from TheSportsDB's free key). | 60 min |
| **Markets** | S&P 500, NASDAQ, FTSE 100, and Vanguard LifeStrategy 100% Equity (Acc): 7-day and 3-month change, from Yahoo Finance. | 60 min |
| **News ticker** | Two lines from RSS feeds: BBC News and York on top; Liverpool, Premier League, electrical, and AI below. | 15 min |

A failed refresh keeps the last data on screen and tries again after 2 minutes. The top-left label shows the latest refresh and how many sources are retrying. A widget whose keys aren't set up says "not set up" instead.

## The morning schedule

The Pi can't switch its own power on, so it stays on and controls the TV over HDMI-CEC instead:

- **04:45:** the Pi restarts (`DASHBOARD_REBOOT_AT`). This clears memory, re-reads `.env`, picks the day's theme, and runs the TimeTree export a minute after boot. The restart only runs once the Pi has been up for over an hour, because with no clock battery each boot starts with a stale clock.
- **05:00:** the TimeTree export runs again.
- **Screen windows** (`DASHBOARD_SCREEN_TIMES`, now `04:55-05:30,05:55-06:30,07:55-08:30`): at the start of each window the Pi turns its picture on, wakes the TV, and switches it to HDMI 3. At the end it puts the TV on standby, but only if the TV is still showing the Pi.
- **Any other time:** the picture is off. Picking HDMI 3 on the TV turns it on until the TV moves to another input or goes to standby. Turning the TV on by itself never makes the Pi take over.

To test a time without waiting, run this on the Pi: `SCREEN_NOW=05:00 bash ~/screen-schedule.sh`.

## Setup on the PC

```bash
npm install
cp .env.example .env    # then fill it in (see below)
npm run dev             # http://localhost:3000
```

`npm run build` makes the production build in `.output`, and `npm run preview` serves it.

### Settings (`.env`)

`.env` is git-ignored. Never commit it.

| Setting | Meaning |
|---|---|
| `FOOTBALL_DATA_API_KEY` | [football-data.org](https://www.football-data.org/) key (free tier) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | A Google OAuth client of type "Desktop app", in a Cloud project with the Tasks, Sheets, and Drive APIs enabled. One read-only sign-in covers all three. |
| `GOOGLE_REFRESH_TOKEN` | Made with `node scripts/get-google-refresh-token.js` (see [Renewing the tokens](#renewing-the-tokens)) |
| `JOB_TRACKER_SHEET_ID` | The job tracker Google Sheet's ID (from its URL). All five tabs are read. |
| `PHOTOS_FOLDER_ID` | The shared Drive "Dashboard Photos" folder's ID (from its URL) |
| `PHOTOS_DIR` | Optional, used only without `PHOTOS_FOLDER_ID`: a local folder of jpg, png, or webp photos |
| `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` | A read-only scoped Confluence API token and the account email it belongs to |
| `ATLASSIAN_CLOUD_ID` or `ATLASSIAN_SITE` | The site's cloud ID (needed for a scoped token), or its address for a classic token |
| `ATLASSIAN_TOKEN_EXPIRES` | The token's expiry date (`YYYY-MM-DD`). The Today panel warns 14 days before. |
| `TIMETREE_EMAIL`, `TIMETREE_PASSWORD`, `TIMETREE_CALENDAR_CODE` | TimeTree sign-in and the shared calendar's code, used by `scripts/timetree-sync.mjs` |
| `TIMETREE_ICS` | Where the TimeTree export is written and read |
| `TIMETREE_PYTHON` | Optional: the Python that runs the exporter (`python` on Windows, `python3` otherwise) |
| `MET_OFFICE_REGION` | Optional warnings region code: `yh` (default, Yorkshire & Humber) or `UK` |
| `DASHBOARD_THEME` | See [Themes](#themes) |
| `DASHBOARD_SCREEN_TIMES` | Pi only: comma-separated `HH:MM-HH:MM` windows when the TV is woken and shows the dashboard |
| `DASHBOARD_REBOOT_AT` | Pi only: the daily restart time (`HH:MM`, default `04:45`), a little before the first window. Set into the timer at each deploy. |

### TimeTree export

TimeTree has no API, so the calendar comes from the unofficial [timetree-exporter](https://pypi.org/project/timetree-exporter/):

```bash
pip install timetree-exporter
node scripts/timetree-sync.mjs
```

The script writes to a temporary file and swaps it in only if the export succeeds, so a failed run never replaces the last good calendar.

## Themes

`DASHBOARD_THEME` picks the colours: `standard-dark` (default), `green-trim-dark`, `ocean-dark`, `sunset-dark`, or `burnt-orange-dark`. Display names such as `Ocean - Dark` also work. `rotate` gives a different theme each UK day, in that order. Since the Pi restarts each morning, that's a new theme each boot. Anything else falls back to Standard - Dark.

Add `?theme=<name>` to the address to preview a theme without changing `.env`. The themes are in `app/assets/css/main.css`. Each one redefines Tailwind's zinc greys and a few accents, so the components need no theme logic. All the themes are dark, which also spares the OLED.

## The Pi

A Raspberry Pi 3 Model B on the TV's HDMI 3, running Raspberry Pi OS (trixie) with the labwc desktop, powered by a 5 V 2 A wall plug. It runs with the **read-only overlay** on, so pulling the plug can't damage the SD card. Everything below is installed by the deploy. Nothing on the Pi is changed by hand.

### Deploying

From the PC, with SSH key sign-in to the Pi already working:

```powershell
.\scripts\deploy.ps1              # build, copy, install, and restart the Pi
.\scripts\deploy.ps1 -NoBuild     # reuse the existing .output (e.g. after a .env change)
.\scripts\deploy.ps1 -NoReboot    # restart only the server (overlay off only)
.\scripts\deploy.ps1 -PiHost pi@<ip>
```

`deploy.ps1` builds the app and packs `.output`, `scripts/timetree-sync.mjs`, the `pi/` folder, and a copy of `.env` with the Pi's own `TIMETREE_ICS` and `TIMETREE_PYTHON`. It copies them over SSH and runs `pi/install.sh` on the Pi. With the overlay on, `install.sh` writes to the real SD card at `/media/root-ro`, keeps the previous copy as `.old`, and keeps the last TimeTree export. Then it restarts the Pi. `/home/pi/morning-dashboard/.deployed` records which commit was deployed and when.

### System files (`pi/`)

| File | Does |
|---|---|
| `install.sh` | Installs the app to `/home/pi/morning-dashboard` and the files below, then restarts. It masks the automatic apt and PackageKit updates (their downloads fill the overlay's RAM), sets the restart time from `DASHBOARD_REBOOT_AT`, and warns if the emoji font for the weather icons is missing. |
| `tv-edid.bin` | A saved copy of the TV's display details (EDID, serial blanked), loaded at boot with `drm.edid_firmware=` and `video=HDMI-A-1:1920x1080@60D`. Without it, a restart with the TV on standby leaves the Pi at 1024×768 all day. |
| `dashboard.service` | The Node server on `127.0.0.1:3000`, loading `.env`. IPv4 first, because the home network has no working IPv6. |
| `start-browser.sh`, `dashboard.desktop` | Desktop autostart: waits for the server, then opens Chromium full screen (kiosk, incognito). |
| `timetree-sync.service`, `.timer` | The TimeTree export a minute after boot and at 05:00, with the Python in `/home/pi/timetree-venv` |
| `screen-schedule.sh`, `dashboard-screen.service`, `.timer` | Every minute: the picture on in the windows and off outside them (`wlopm`; never `wlr-randr --off`, which labwc can't undo), waking the TV, switching its input, and putting it on standby over HDMI-CEC |
| `cec-listener.sh`, `dashboard-cec-listener.service` | Runs as root, since watching CEC needs it. Keeps the Pi registered on HDMI-CEC as "Dashboard" and turns the picture on when HDMI 3 is picked outside the windows. |
| `dashboard-reboot.timer`, `.service` | The daily restart at `DASHBOARD_REBOOT_AT`, only after an hour up |

### Installing packages on the Pi

The overlay throws away changes at each restart, so turn it off first:

```bash
sudo raspi-config nonint do_overlayfs 1 && sudo reboot   # overlay off
# install, e.g. sudo apt-get install fonts-noto-color-emoji
sudo raspi-config nonint do_overlayfs 0 && sudo reboot   # overlay back on
```

The scripts need `cec-ctl` (v4l-utils), `wlopm`, Chromium, Node, and a Python venv with the exporter:

```bash
python3 -m venv /home/pi/timetree-venv
/home/pi/timetree-venv/bin/pip install timetree-exporter
```

The "Failed to start systemd-remount-fs" and swap "Dependency failed" lines at boot are harmless side effects of the overlay.

## Renewing the tokens

After changing any of these in `.env`, run `.\scripts\deploy.ps1 -NoBuild` to send the new `.env` to the Pi.

- **Google** (Tasks, Applications, Photos): the OAuth app is published to production, so the refresh token doesn't expire with normal use. In Testing mode it would last only 7 days. If Google ever rejects it (revoked, or the client changed), make a new one:
  1. Add `http://localhost:53682/oauth2callback` as a redirect URI on the OAuth client, if it isn't there already.
  2. With `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`, run `node scripts/get-google-refresh-token.js`.
  3. Open the printed URL, sign in, grant the read-only access, and copy the printed `GOOGLE_REFRESH_TOKEN` into `.env`.
- **Confluence** (project next steps): Atlassian API tokens last at most a year, and the Today panel warns 14 days before `ATLASSIAN_TOKEN_EXPIRES`. Make a new read-only scoped token in your Atlassian account's security settings, then update `ATLASSIAN_API_TOKEN` and `ATLASSIAN_TOKEN_EXPIRES`.
- **TimeTree:** if the password changes, update `TIMETREE_PASSWORD`. The calendar shows "out of date" when the daily export has failed for 24 hours.
- **football-data.org:** the key doesn't expire. Replace `FOOTBALL_DATA_API_KEY` only if it's regenerated.

## More

The full technical reference, plans, and decisions are kept in Confluence (KP space): **Dashboard app** describes the code, and **Progress Overview: Morning Dashboard** has the route, tasks, and decisions.
