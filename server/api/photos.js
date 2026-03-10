const fetchPhoto = async () => {      
  try {
    const photo = await $fetch('https://picsum.photos/300/200');     
    return photo;
  } catch (error) {
    console.error('Photos API error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch photos data'
    });
  }
}

export default async (event) => {
  return await fetchPhoto();
}