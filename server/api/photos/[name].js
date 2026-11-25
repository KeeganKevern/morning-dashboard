// One photo: a thumbnail from the shared Drive folder, or a file from PHOTOS_DIR
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

export default async event => {
  const key = decodeURIComponent(getRouterParam(event, 'name') || '');
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400');

  if (usingDrive()) {
    const photo = await getDrivePhoto(key);
    if (!photo) throw createError({ statusCode: 404, message: 'Photo not found' });
    setResponseHeader(event, 'Content-Type', photo.type);
    return photo.body;
  }

  const local = await getLocalPhoto(key);
  if (!local) throw createError({ statusCode: 404, message: 'Photo not found' });
  setResponseHeader(event, 'Content-Type', photoType(local.name));
  return sendStream(event, createReadStream(join(local.dir, local.name)));
};
