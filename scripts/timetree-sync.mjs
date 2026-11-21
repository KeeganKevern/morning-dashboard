// Exports the shared TimeTree calendar to TIMETREE_ICS with the unofficial
// timetree-exporter (pip install timetree-exporter). Run it once a day; the
// Today panel flags the calendar as out of date if the file goes 24 hours
// without an update. Run with: node scripts/timetree-sync.mjs
//
// Needs in .env: TIMETREE_EMAIL, TIMETREE_PASSWORD, TIMETREE_CALENDAR_CODE
// (from the calendar's URL, or shown when timetree-exporter runs without -c)
// and TIMETREE_ICS.

import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Read the project's .env wherever the script is run from
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
import { spawnSync } from 'node:child_process';
import { renameSync, rmSync, statSync } from 'node:fs';

const { TIMETREE_EMAIL, TIMETREE_PASSWORD, TIMETREE_CALENDAR_CODE, TIMETREE_ICS } = process.env;
const missing = Object.entries({ TIMETREE_EMAIL, TIMETREE_PASSWORD, TIMETREE_CALENDAR_CODE, TIMETREE_ICS })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Set ${missing.join(', ')} in .env first.`);
  process.exit(1);
}

// Write to a temporary file, then swap it in, so a failed export never
// replaces the last good calendar with a broken one
const tmp = `${TIMETREE_ICS}.tmp`;
// Run as a Python module so it works without the Scripts folder on PATH
const python = process.env.TIMETREE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const run = spawnSync(python, ['-m', 'timetree_exporter', '-o', tmp, '-c', TIMETREE_CALENDAR_CODE, '-e', TIMETREE_EMAIL], {
  env: { ...process.env, TIMETREE_EMAIL, TIMETREE_PASSWORD },
  encoding: 'utf8',
  timeout: 5 * 60 * 1000
});

let ok = run.status === 0;
try { ok = ok && statSync(tmp).size > 0; } catch { ok = false; }

if (!ok) {
  rmSync(tmp, { force: true });
  console.error('TimeTree export failed:', run.error?.message || run.stderr?.trim() || `exit ${run.status}`);
  process.exit(1);
}

renameSync(tmp, TIMETREE_ICS);
console.log(`TimeTree calendar exported to ${TIMETREE_ICS}`);
