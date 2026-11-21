// Each KP project's suggested next step for the Today panel, read from the
// "Progress Overview: <Project>" pages in Confluence (read-only; kk-update-docs
// stays the only writer). Up to 5 active projects, freshest next step first.

const PROJECTS_FOLDER = '15794197'; // KP > Projects
const MAX_PROJECTS = 5;
const WARN_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

// A scoped (read-only) token goes through Atlassian's API gateway, which
// needs the site's cloud id; a classic token can use the site URL directly
const baseUrl = () => {
  const { ATLASSIAN_CLOUD_ID, ATLASSIAN_SITE } = process.env;
  if (ATLASSIAN_CLOUD_ID) return `https://api.atlassian.com/ex/confluence/${ATLASSIAN_CLOUD_ID}/wiki`;
  return `https://${ATLASSIAN_SITE}/wiki`;
};

const text = html => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

// "<strong>Next step:</strong> Do X. <em>(set </em><time datetime="2026-11-19" />..."
const parseNextStep = body => {
  const at = body.indexOf('Next step:');
  if (at === -1) return null;
  const rest = body.slice(at + 'Next step:'.length);
  const end = rest.search(/<\/p>|<\/ac:rich-text-body>/);
  const para = end === -1 ? rest : rest.slice(0, end);
  const set = para.match(/datetime="(\d{4}-\d{2}-\d{2})"/)?.[1] ?? null;
  const step = text(para.replace(/<em>\s*\(set[\s\S]*$/, '')).replace(/^<\/strong>\s*/, '').trim();
  return { step, set };
};

const tokenWarning = () => {
  const expires = process.env.ATLASSIAN_TOKEN_EXPIRES;
  if (!expires) return null;
  const days = Math.ceil((Date.parse(`${expires}T00:00:00Z`) - Date.now()) / DAY);
  if (Number.isNaN(days) || days > WARN_DAYS) return null;
  return days <= 0 ? 'Confluence token has expired' : `Confluence token expires in ${days} day${days === 1 ? '' : 's'}`;
};

export default async () => {
  const { ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN, ATLASSIAN_CLOUD_ID, ATLASSIAN_SITE } = process.env;
  if (!ATLASSIAN_EMAIL || !ATLASSIAN_API_TOKEN || (!ATLASSIAN_CLOUD_ID && !ATLASSIAN_SITE)) {
    throw createError({ statusCode: 503, message: 'Confluence token not set up' });
  }

  let res;
  try {
    res = await $fetch(`${baseUrl()}/rest/api/content/search`, {
      headers: { Authorization: `Basic ${Buffer.from(`${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}`).toString('base64')}` },
      params: {
        cql: `space = "KP" and type = page and ancestor = ${PROJECTS_FOLDER} and title ~ "Progress Overview"`,
        expand: 'body.storage',
        limit: 50
      },
      retry: 0
    });
  } catch (err) {
    console.error('Confluence read error:', err.statusCode, err?.data?.message ?? err.message);
    throw createError({ statusCode: 502, message: 'Failed to read Confluence', data: { warning: tokenWarning() } });
  }

  const projects = (res.results || [])
    .filter(p => p.title.startsWith('Progress Overview: '))
    .map(p => ({ project: p.title.replace('Progress Overview: ', ''), ...parseNextStep(p.body?.storage?.value || '') }))
    // No next step, or one marked none or paused, means the project isn't active
    .filter(p => p.step && !/^(none set|paused)/i.test(p.step))
    .sort((a, b) => (b.set || '').localeCompare(a.set || ''))
    .slice(0, MAX_PROJECTS);

  return { projects, warning: tokenWarning(), updated: new Date().toISOString() };
};
