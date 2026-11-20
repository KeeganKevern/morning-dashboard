// The list of photo names in the photos folder
export default async () => {
  const { names } = await listPhotos();
  return { photos: names, updated: new Date().toISOString() };
};
