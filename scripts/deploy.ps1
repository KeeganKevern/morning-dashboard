# Deploys the dashboard to the Pi from the PC:
#   .\scripts\deploy.ps1                 build, copy, install and reboot the Pi
#   .\scripts\deploy.ps1 -NoBuild        reuse the existing .output
#   .\scripts\deploy.ps1 -NoReboot       restart only the server (overlay off only)
#   .\scripts\deploy.ps1 -PiHost pi@<ip> another address
# Needs SSH key sign-in to the Pi (ssh pi@<ip> works without a password).
param(
  [string]$PiHost = 'pi@192.168.0.142',
  [switch]$NoBuild,
  [switch]$NoReboot
)
# Native tools (npm, tar, scp, ssh) are checked by exit code; Windows PowerShell
# would otherwise treat their progress output on stderr as a failure
$ErrorActionPreference = 'Continue'
$PSDefaultParameterValues = @{ '*:ErrorAction' = 'Stop' } # script scope only
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not $NoBuild) {
  npm run build
  if ($LASTEXITCODE) { throw 'Build failed' }
}
if (-not (Test-Path '.output/server/index.mjs')) { throw 'No build in .output; run without -NoBuild' }
if (-not (Test-Path '.env')) { throw 'No .env' }

# Stage: app/ (what lands in /home/pi/morning-dashboard) and pi/ (system files)
$stage = Join-Path $env:TEMP 'morning-dashboard-deploy'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$stage/app/scripts", "$stage/pi" | Out-Null
Copy-Item '.output' "$stage/app/.output" -Recurse
Copy-Item 'scripts/timetree-sync.mjs' "$stage/app/scripts/"
Copy-Item 'pi/*' "$stage/pi/"

# The Pi's .env: the PC's keys with Pi paths (no local photo folder)
$skip = '^(PHOTOS_DIR|TIMETREE_ICS|TIMETREE_PYTHON|PORT|HOST)='
$lines = Get-Content '.env' | Where-Object { $_ -notmatch $skip }
$lines += 'TIMETREE_ICS=/home/pi/morning-dashboard/data/timetree.ics'
$lines += 'TIMETREE_PYTHON=/home/pi/timetree-venv/bin/python'
[IO.File]::WriteAllText("$stage/app/.env", (($lines -join "`n") + "`n"))

# What was deployed, for checking on the Pi
$commit = (git rev-parse --short HEAD).Trim()
$dirty = if (git status --porcelain) { ' + uncommitted changes' } else { '' }
[IO.File]::WriteAllText("$stage/app/.deployed", "$commit$dirty, $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n")

# Shell scripts must have Unix line endings
foreach ($f in Get-ChildItem "$stage/pi" -File) {
  $text = [IO.File]::ReadAllText($f.FullName) -replace "`r`n", "`n"
  [IO.File]::WriteAllText($f.FullName, $text)
}

$bundle = Join-Path $env:TEMP 'morning-dashboard-deploy.tgz'
tar -czf $bundle -C $stage app pi
if ($LASTEXITCODE) { throw 'Packing failed' }
Write-Host ("Bundle: {0:N1} MB" -f ((Get-Item $bundle).Length / 1MB))

scp -o BatchMode=yes $bundle "${PiHost}:/tmp/morning-dashboard-deploy.tgz"
if ($LASTEXITCODE) { throw 'Copy to the Pi failed' }

$flag = if ($NoReboot) { '--no-reboot' } else { '' }
ssh -o BatchMode=yes $PiHost "rm -rf /tmp/mdd && mkdir /tmp/mdd && tar -xzf /tmp/morning-dashboard-deploy.tgz -C /tmp/mdd && bash /tmp/mdd/pi/install.sh /tmp/mdd $flag"
if ($LASTEXITCODE) { throw "Install on the Pi failed ($LASTEXITCODE)" }

Write-Host 'Deployed.'
