#!/bin/bash
# Runs on the Pi, called by scripts/deploy.ps1 with the unpacked bundle:
#   bash install.sh <stage dir> [--no-reboot]
# Installs the app to /home/pi/morning-dashboard and the system files, then
# reboots. With the read-only overlay on, it writes to the real SD card
# (/media/root-ro) instead of the RAM overlay, so the deploy survives reboots.
set -euo pipefail

STAGE=$1
REBOOT=yes
[ "${2:-}" = "--no-reboot" ] && REBOOT=no

APP=home/pi/morning-dashboard
ROOT=""
if grep -q ' /media/root-ro ' /proc/mounts; then
  ROOT=/media/root-ro
  echo "Read-only overlay is on: writing to the SD card at $ROOT"
  sudo mount -o remount,rw "$ROOT"
  trap 'sync; sudo mount -o remount,ro "$ROOT" || true' EXIT
fi

# App: build the new copy beside the old one, then swap them over
sudo rm -rf "$ROOT/$APP.new"
sudo mkdir -p "$ROOT/$APP.new"
sudo cp -a "$STAGE/app/." "$ROOT/$APP.new/"
# Keep the last TimeTree export so the calendar isn't empty until the next one
[ -d "$ROOT/$APP/data" ] && sudo cp -a "$ROOT/$APP/data" "$ROOT/$APP.new/"
sudo chown -R 1000:1000 "$ROOT/$APP.new"
sudo chmod 600 "$ROOT/$APP.new/.env"
sudo rm -rf "$ROOT/$APP.old"
[ -d "$ROOT/$APP" ] && sudo mv "$ROOT/$APP" "$ROOT/$APP.old"
sudo mv "$ROOT/$APP.new" "$ROOT/$APP"

# System files
sudo install -m 644 "$STAGE"/pi/dashboard.service "$STAGE"/pi/timetree-sync.service \
  "$STAGE"/pi/timetree-sync.timer "$ROOT/etc/systemd/system/"
sudo install -m 755 -o 1000 -g 1000 "$STAGE/pi/start-browser.sh" "$ROOT/home/pi/start-browser.sh"
sudo install -d -o 1000 -g 1000 "$ROOT/home/pi/.config/autostart"
sudo install -m 644 -o 1000 -g 1000 "$STAGE/pi/dashboard.desktop" "$ROOT/home/pi/.config/autostart/dashboard.desktop"

# No automatic package checks: with the read-only overlay their downloads
# (~130 MB of apt cache) fill RAM. Update by turning the overlay off first.
NO_UPDATES="apt-daily.timer apt-daily-upgrade.timer packagekit.service"

if [ -n "$ROOT" ]; then
  sudo systemctl --root="$ROOT" enable dashboard.service timetree-sync.timer
  sudo systemctl --root="$ROOT" mask $NO_UPDATES
else
  sudo systemctl daemon-reload
  sudo systemctl enable dashboard.service timetree-sync.timer
  sudo systemctl mask $NO_UPDATES
fi

# The weather icons are emoji: without this font they show as empty boxes
fc-list : family | grep -i 'emoji' >/dev/null || echo "WARNING: no emoji font; turn the overlay off and run: sudo apt-get install fonts-noto-color-emoji"

echo "Installed $(cat "$ROOT/$APP/.deployed" 2>/dev/null || echo 'build')"

if [ "$REBOOT" = yes ]; then
  echo "Rebooting the Pi in 3 seconds"
  sync
  # Scheduled, so this SSH session ends cleanly before the reboot cuts it
  sudo systemd-run --quiet --on-active=3 systemctl reboot
elif [ -z "$ROOT" ]; then
  sudo systemctl restart dashboard.service
  echo "Server restarted (browser left as it was)"
fi
