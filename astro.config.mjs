import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  site: "https://erickmurakami.github.io",
  base: "/",
  output: "static",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
