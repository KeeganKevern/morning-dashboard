// Puts the colour theme from DASHBOARD_THEME (.env) on <html data-theme="...">.
// Accepts the slug or the display name ("Ocean - Dark"), or "rotate" for a
// different theme each day, in order (worked out from the UK date, since the
// Pi's read-only overlay can't remember anything between boots). Anything else
// falls back to Standard - Dark. Read on every page load.
// ?theme=ocean-dark in the address previews a theme without changing .env.
import { useServerHooks } from 'nuxt/server';
import { getQuery } from 'h3';

const THEMES = ['standard-dark', 'green-trim-dark', 'ocean-dark', 'sunset-dark', 'burnt-orange-dark'];
const DAY = 24 * 60 * 60 * 1000;

const slug = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Days since 1970 by the UK calendar date, so it changes at UK midnight
const ukDayNumber = () => {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  return Math.floor(Date.parse(`${ymd}T00:00:00Z`) / DAY);
};

export const pickTheme = setting => {
  const wanted = slug(setting);
  if (wanted === 'rotate') return THEMES[ukDayNumber() % THEMES.length];
  return THEMES.includes(wanted) ? wanted : 'standard-dark';
};

export default defineNitroPlugin(() => {
  // Nuxt 4.6+ runs the renderer's hooks here, not on the Nitro app
  useServerHooks().hook('render:html', (html, { event }) => {
    const theme = pickTheme(getQuery(event).theme || process.env.DASHBOARD_THEME);
    html.htmlAttrs.push(`data-theme="${theme}"`);
  });
});
