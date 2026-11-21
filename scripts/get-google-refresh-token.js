// One-time helper: exchanges a Google OAuth consent for a long-lived refresh token
// covering read-only Google Tasks (Today panel), Sheets (the job tracker) and
// Drive (the photo folder). Run with: node scripts/get-google-refresh-token.js
// Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET already set in .env, from
// a "Desktop app" OAuth client (which accepts the localhost redirect below).

import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Read the project's .env wherever the script is run from
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
import http from 'node:http';

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = [
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
].join(' ');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\nOpen this URL in a browser and sign in with the Google account that owns your tasks, the job tracker and the photo folder:\n');
console.log(authUrl.toString());
console.log('\nWaiting for the redirect back to localhost...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');

  if (err || !code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Authorization failed: ${err || 'no code returned'}`);
    console.error('Authorization failed:', err || 'no code returned');
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('No refresh token returned — see terminal.');
      console.error('No refresh token in response:', tokenData);
      console.error('If you have authorized this app before, revoke access at https://myaccount.google.com/permissions and try again — Google only returns a refresh token on first consent.');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Success — refresh token printed in the terminal. You can close this tab.');
      console.log('\nAdd this to your .env:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokenData.refresh_token}\n`);
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Token exchange failed — see terminal.');
    console.error('Token exchange failed:', e);
  }

  server.close();
});

server.listen(PORT);
