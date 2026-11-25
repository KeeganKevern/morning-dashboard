// Photos for the photo tile. With PHOTOS_FOLDER_ID set they come from that shared
// Google Drive folder through the Drive API, as small thumbnails (kind to a Pi 3).
// Otherwise they fall back to the local folder in PHOTOS_DIR.
import { readdir } from 'node:fs/promises';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const LIST_TTL_MS = 60 * 60 * 1000; // the folder is re-listed hourly
const THUMB_SIZE = 800;             // longest edge in px
const THUMB_CACHE_MAX = 40;

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export const photoType = name => IMAGE_TYPES[name.slice(name.lastIndexOf('.')).toLowerCase()];

export const usingDrive = () => !!process.env.PHOTOS_FOLDER_ID;

// ---- Local folder (fallback) ----
const listLocal = async () => {
  const dir = process.env.PHOTOS_DIR;
  if (!dir) throw createError({ statusCode: 500, message: 'PHOTOS_FOLDER_ID or PHOTOS_DIR not set' });

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('Photos folder unreadable:', err.message);
    throw createError({ statusCode: 500, message: 'Photos folder not found' });
  }
  return { dir, names: entries.filter(e => e.isFile() && photoType(e.name)).map(e => e.name).sort() };
};

// ---- Google Drive ----
let listCache = null; // { at, files: Map(id -> { id, name, mimeType, thumbnailLink }) }
const thumbs = new Map(); // id -> { type, body } (insertion order, oldest dropped first)

const fetchDriveList = async () => {
  const files = new Map();
  let pageToken;
  do {
    const res = await googleGet(DRIVE_FILES, {
      q: `'${process.env.PHOTOS_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, modifiedTime)',
      pageSize: 200,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken
    });
    for (const f of res.files ?? []) files.set(f.id, f);
    pageToken = res.nextPageToken;
  } while (pageToken);
  return files;
};

const driveList = async ({ force = false } = {}) => {
  if (!force && listCache && Date.now() - listCache.at < LIST_TTL_MS) return listCache.files;
  try {
    listCache = { at: Date.now(), files: await fetchDriveList() };
    // Forget thumbnails of photos that have gone from the folder
    for (const id of thumbs.keys()) if (!listCache.files.has(id)) thumbs.delete(id);
  } catch (err) {
    console.error('Drive photo list error:', err?.data ?? err.message);
    // Keep serving the last good list if the refresh fails
    if (!listCache) throw createError({ statusCode: 502, message: 'Photos unavailable' });
  }
  return listCache.files;
};

const driveThumb = async file => {
  const headers = { Authorization: `Bearer ${await googleAccessToken()}` };
  // Drive's own thumbnail at a set size; falls back to the file if it has none yet
  const url = file.thumbnailLink
    ? file.thumbnailLink.replace(/=s\d+$/, `=s${THUMB_SIZE}`)
    : `${DRIVE_FILES}/${file.id}?alt=media&supportsAllDrives=true`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Drive photo fetch ${res.status}`);
  return { type: res.headers.get('content-type') || file.mimeType, body: Buffer.from(await res.arrayBuffer()) };
};

// ---- Used by the routes ----

// The keys the tile may ask for: Drive file ids, or file names in the local folder
export const listPhotos = async () => {
  if (!usingDrive()) return (await listLocal()).names;
  return [...(await driveList()).keys()];
};

// One photo's bytes, or null when it isn't in the folder
export const getDrivePhoto = async id => {
  if (thumbs.has(id)) return thumbs.get(id);

  let files = await driveList();
  let file = files.get(id);
  if (!file) return null;

  let photo;
  try {
    photo = await driveThumb(file);
  } catch (err) {
    // Thumbnail links expire: re-list once and try again
    files = await driveList({ force: true });
    file = files.get(id);
    if (!file) return null;
    try {
      photo = await driveThumb(file);
    } catch (err2) {
      console.error('Drive photo error:', err2.message);
      throw createError({ statusCode: 502, message: 'Photo unavailable' });
    }
  }

  thumbs.set(id, photo);
  if (thumbs.size > THUMB_CACHE_MAX) thumbs.delete(thumbs.keys().next().value);
  return photo;
};

export const getLocalPhoto = async name => {
  const { dir, names } = await listLocal();
  // Only names actually in the folder, so nothing outside it can be read
  return names.includes(name) ? { dir, name } : null;
};
