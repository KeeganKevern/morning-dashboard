#!/bin/bash
# Turns the dashboard screen on and off by the windows in DASHBOARD_SCREEN_TIMES
# (.env, e.g. "04:55-05:30,05:55-06:30,07:55-08:30"). Run every minute by
# dashboard-screen.timer, so the right state comes back after a reboot or a
# power cut. Acts only when the wanted state changes.
#
#   on:  Pi's HDMI signal on, then wake the TV and switch it to the Pi (HDMI-CEC)
#   off: TV to standby (only if it is still showing the Pi), then the Pi's HDMI
#        signal off (display power management, like a monitor sleeping), which
#        also stops Chromium drawing until the next window. Not wlr-randr --off:
#        labwc can't turn its only output back on after that.
#
# Test without waiting: SCREEN_NOW=05:00 bash screen-schedule.sh
set -u

APP=/home/pi/morning-dashboard
DEFAULT_TIMES="04:55-05:30,05:55-06:30,07:55-08:30"
export XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0
STATE="$XDG_RUNTIME_DIR/dashboard-screen"   # RAM only: forgotten at each boot
# Set by cec-listener.sh while Keegan has picked the dashboard on the TV
# outside the windows; the picture stays on until he leaves that input
OVERRIDE="$XDG_RUNTIME_DIR/dashboard-override"
CEC="cec-ctl -d /dev/cec0"

log() { logger -t dashboard-screen "$*"; echo "$*"; }

times=$(sed -n 's/^DASHBOARD_SCREEN_TIMES=//p' "$APP/.env" 2>/dev/null | tr -d '"'"'"' ')
times=${times:-$DEFAULT_TIMES}
now=${SCREEN_NOW:-$(date +%H:%M)}

# HH:MM strings compare correctly as text
in_window=no
for w in ${times//,/ }; do
  start=${w%-*}; end=${w#*-}
  if [[ ! "$now" < "$start" && "$now" < "$end" ]]; then in_window=yes; fi
done
# "screen-schedule.sh window" only answers whether now is in a window
if [ "${1:-}" = window ]; then [ "$in_window" = yes ]; exit; fi

# One run at a time: the timer and the CEC listener can both call this
exec 9>"$XDG_RUNTIME_DIR/dashboard-screen.lock"
flock 9

want=off
[ "$in_window" = yes ] && want=on
[ -e "$OVERRIDE" ] && want=on

have=$(cat "$STATE" 2>/dev/null || echo boot)
[ "$want" = "$have" ] && exit 0

# The desktop may not be up yet just after boot: try again next minute
# The HDMI port by name: with it off, the desktop adds a placeholder (NOOP-1) first
output=$(wlr-randr 2>/dev/null | awk '/^HDMI/ {print $1; exit}')
if [ -z "$output" ]; then
  echo "Desktop not ready yet"
  exit 0
fi

# Chromium sizes its full-screen window from the screen when it starts: started
# with the signal off it opens as a small window. So leave the screen alone until
# the kiosk browser has been up a minute.
kiosk=$(pgrep -of 'chromium.*--kiosk')
if [ -z "$kiosk" ] || [ "$(ps -o etimes= -p "$kiosk" | tr -d ' ')" -lt 60 ]; then
  echo "Browser not settled yet"
  exit 0
fi

# The Pi's HDMI-CEC address only exists while its picture is on and the TV is
# seen (f.f.f.f otherwise): wait up to 20 s for it, then claim a CEC address
cec_ready() {
  local i
  for i in $(seq 1 20); do
    phys=$($CEC 2>/dev/null | awk '/Physical Address/ {print $NF; exit}')
    [ -n "$phys" ] && [ "$phys" != f.f.f.f ] && { $CEC --playback --osd-name Dashboard >/dev/null 2>&1; return 0; }
    sleep 1
  done
  log "No HDMI-CEC address (TV not answering): TV left as it is"
  return 1
}
phys=""

if [ "$want" = on ]; then
  wlopm --on "$output"
  # Picked on the TV (override): it is already on this input, so no CEC needed
  if [ "$in_window" = yes ] && cec_ready; then
    $CEC --to 0 --image-view-on >/dev/null 2>&1
    $CEC --to 15 --active-source "phys-addr=$phys" >/dev/null 2>&1
  fi
  [ "$in_window" = yes ] && log "Screen on ($now, window $times)" || log "Screen on: dashboard picked on the TV"
else
  # A boot outside the windows only blanks the Pi; the TV may be in use. And
  # when Keegan has just left the input ("left", from the listener), the TV is
  # already where he wants it.
  if [ "$have" = on ] && [ "${1:-}" != left ] && cec_ready; then
    # Ask which input is showing; standby only if it is the Pi (or nobody answers).
    # Watching CEC replies needs root (pi has passwordless sudo on the Pi)
    mon=$(mktemp)
    sudo timeout 3 $CEC -m >"$mon" 2>&1 &
    sleep 0.3
    $CEC --to 15 --request-active-source >/dev/null 2>&1
    wait
    shown=$(grep -A3 'ACTIVE_SOURCE' "$mon" | sed -n 's/.*phys-addr: *\([0-9.]*\).*/\1/p' | tail -1)
    rm -f "$mon"
    if [ -z "$shown" ] || [ "$shown" = "$phys" ]; then
      $CEC --to 0 --standby >/dev/null 2>&1
      log "TV to standby"
    else
      log "TV is showing $shown, not the Pi ($phys): left on"
    fi
  fi
  wlopm --off "$output"
  log "Screen off ($now, window $times)"
fi
echo "$want" >"$STATE"
