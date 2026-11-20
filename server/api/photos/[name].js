// One photo file from the photos folder
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

export default async event => {
  const name = decodeURIComponent(getRouterParam(event, 'name') || '');
  const { dir, names } = await listPhotos();

  // Only names actually in the folder, so nothing outside it can be read
  if (!names.includes(name)) throw createError({ statusCode: 404, message: 'Photo not found' });

  setResponseHeader(event, 'Content-Type', photoType(name));
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400');
  return sendStream(event, createReadStream(join(dir, name)));
};
