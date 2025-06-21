import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://jonasnico.github.io",
  base: "/quizzer",
  vite: {
    plugins: [tailwindcss()],
  },
});
