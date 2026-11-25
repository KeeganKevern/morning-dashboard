// The list of photo keys to choose from (Drive file ids, or local file names)
export default async () => {
  const photos = await listPhotos();
  return { photos, updated: new Date().toISOString() };
};
