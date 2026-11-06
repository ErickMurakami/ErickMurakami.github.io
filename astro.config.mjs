import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { productionSite } from "./config/site.mjs";
import { satteri } from "@astrojs/markdown-satteri";
import markdownLinkTargets from "./src/lib/markdown-link-targets.mjs";
export default defineConfig({
  site: productionSite(),
  base: "/",
  output: "static",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  markdown: {
    processor: satteri({
      hastPlugins: [markdownLinkTargets({ site: productionSite() })],
    }),
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
