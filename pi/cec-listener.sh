#!/bin/bash
# Shows the dashboard outside the screen windows when it is picked on the TV.
# Listens to HDMI-CEC (run as root by dashboard-cec-listener.service: watching
# CEC needs root). When the TV switches to the Pi's input (HDMI 3, or "Dashboard"
# in Anynet+), it sets the override and screen-schedule.sh turns the picture on.
# When the TV moves to another input or goes to standby, the override is cleared
# and the picture goes off again. Inside a window the schedule is in charge, so
# the TV following the Pi's own wake-up there is ignored.
set -u

RUN=/run/user/1000
OVERRIDE="$RUN/dashboard-override"
SCHEDULE=/home/pi/screen-schedule.sh
LAST_PHYS="$RUN/dashboard-cec-phys"   # last good address: it drops out at times

log() { logger -t dashboard-cec "$*"; }
schedule() { runuser -u pi -- /bin/bash "$SCHEDULE" "$@" >/dev/null 2>&1; }

our_port() {
  local p
  p=$(cec-ctl -d /dev/cec0 2>/dev/null | awk '/Physical Address/ {print $NF; exit}')
  if [ -n "$p" ] && [ "$p" != f.f.f.f ]; then echo "$p" >"$LAST_PHYS"; fi
  p=$(cat "$LAST_PHYS" 2>/dev/null || echo 3.0.0.0)
  echo "${p%%.*}"   # the TV's HDMI port number: 3 for 3.0.0.0
}

picked() {
  runuser -u pi -- /bin/bash "$SCHEDULE" window && return   # the schedule has it
  [ -e "$OVERRIDE" ] && return
  runuser -u pi -- touch "$OVERRIDE"
  log "Dashboard picked on the TV: picture on"
  schedule
}

left() {
  [ -e "$OVERRIDE" ] || return
  rm -f "$OVERRIDE"
  log "TV left the dashboard ($1): picture off"
  schedule left
}

# Wait for the desktop (its runtime folder) after boot
until [ -d "$RUN" ]; do sleep 5; done

# Announce the Pi to the TV as "Dashboard", a playback device: until it has, the
# TV doesn't list it in Anynet+ or tell it about input changes. That only takes
# while the HDMI address is valid, and it drops out every 10-20 s, so keep
# checking in the background and claim again whenever it isn't held.
(
  while true; do
    info=$(cec-ctl -d /dev/cec0 2>/dev/null)
    phys=$(awk '/Physical Address/ {print $NF; exit}' <<<"$info")
    mask=$(awk '/Logical Address Mask/ {print $NF; exit}' <<<"$info")
    if [ "$phys" != f.f.f.f ] && [ "$mask" = 0x0000 ]; then
      cec-ctl -d /dev/cec0 --playback --osd-name Dashboard >/dev/null 2>&1 && log "Announced to the TV as Dashboard ($phys)"
    fi
    sleep 2
  done
) &

pending=""
# Line-buffered, or the pipe holds messages back until a buffer fills
stdbuf -oL cec-ctl -d /dev/cec0 -m 2>/dev/null | while IFS= read -r line; do
  case "$line" in
    # Only messages from other devices: the Pi's own are "Transmitted by"
    *"Received from"*"STANDBY (0x36)"*)
      left "TV to standby"; pending="" ;;
    *"Received from"*"ROUTING_CHANGE"*|*"Received from"*"SET_STREAM_PATH"*|*"Received from"*"ACTIVE_SOURCE"*|*"Received from"*"ROUTING_INFORMATION"*)
      pending=yes ;;
    *"orig-phys-addr:"*) ;;
    *"phys-addr:"*)
      [ -n "$pending" ] || continue
      pending=""
      addr=${line##*: }
      if [ "${addr%%.*}" = "$(our_port)" ]; then picked; else left "now on $addr"; fi ;;
  esac
done
