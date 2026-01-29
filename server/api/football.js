export default defineEventHandler(async (event) => {
  try {
    const data = await $fetch(  "https://raw.githubusercontent.com/openfootball/football.json/master/england/2025-26/en.1.json");

    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
