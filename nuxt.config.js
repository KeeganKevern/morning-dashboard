import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
   css: ['./app/assets/css/main.css'],
    vite: {
    plugins: [
      tailwindcss(),
    ]},
  
  // Disable TypeScript
  typescript: {
    typeCheck: false
  }
})