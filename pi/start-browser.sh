#!/bin/bash
# Started at login (~/.config/autostart/dashboard.desktop): waits for the
# dashboard server, then opens it full screen in Chromium.

URL=http://localhost:3000

# Wait up to 3 minutes for the server, so the page never opens on an error
for _ in $(seq 1 90); do
  curl -sf -o /dev/null "$URL" && break
  sleep 2
done

# Pulling the plug is the normal way to switch off, so never offer to
# restore the last session or show crash bubbles
exec chromium \
  --kiosk \
  --incognito \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run \
  --password-store=basic \
  --check-for-update-interval=31536000 \
  --disk-cache-size=1 \
  "$URL"
