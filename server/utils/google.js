// Shared Google sign-in: swaps the stored refresh token for an access token
// (read-only Tasks, Sheets and Drive) and reuses it until shortly before expiry.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cached = null; // { token, expiresAt }

export const googleAccessToken = async () => {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  // Unset, or still the example values from .env.example
  const missing = v => !v || /^(your_|obtained_by)/.test(v);
  if ([GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN].some(missing)) {
    throw createError({ statusCode: 503, message: 'Google sign-in not set up' });
  }

  try {
    const res = await $fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      }),
      retry: 0
    });
    // Refresh a minute early so a token never expires mid-request
    cached = { token: res.access_token, expiresAt: Date.now() + (res.expires_in - 60) * 1000 };
    return cached.token;
  } catch (err) {
    console.error('Google token refresh error:', err?.data ?? err.message);
    throw createError({ statusCode: 502, message: 'Google sign-in failed' });
  }
};

export const googleGet = async (url, params) =>
  $fetch(url, { headers: { Authorization: `Bearer ${await googleAccessToken()}` }, params, retry: 0 });

// Today's date in the UK as YYYY-MM-DD
export const londonToday = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d);
