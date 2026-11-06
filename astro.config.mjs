import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { productionSite } from "./config/site.mjs";
export default defineConfig({
  site: productionSite(),
  base: "/",
  output: "static",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
