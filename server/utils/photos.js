// Photos for the photo tile, read from the folder in PHOTOS_DIR.
// (Later the same tile will read the shared Google Drive folder instead.)
import { readdir } from 'node:fs/promises';

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export const photoType = name => IMAGE_TYPES[name.slice(name.lastIndexOf('.')).toLowerCase()];

export const listPhotos = async () => {
  const dir = process.env.PHOTOS_DIR;
  if (!dir) throw createError({ statusCode: 500, message: 'PHOTOS_DIR not set' });

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('Photos folder unreadable:', err.message);
    throw createError({ statusCode: 500, message: 'Photos folder not found' });
  }
  return { dir, names: entries.filter(e => e.isFile() && photoType(e.name)).map(e => e.name).sort() };
};
