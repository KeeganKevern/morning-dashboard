import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2026-02-13',
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