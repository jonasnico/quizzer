import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://[YOUR_USERNAME].github.io',
  base: '/trivia',
  vite: {
    plugins: [tailwindcss()],
  },
});
