// Use Astro's native Satteri pipeline; no client-side link interception is needed.
export default function markdownLinkTargets({ site }) {
  const origin = new URL(site).origin;
  return {
    name: "portfolio-link-targets",
    element: {
      filter: ["a"],
      visit(node, context) {
        const href = node.properties?.href;
        if (typeof href !== "string") return;
        const url = new URL(href, site);
        const external =
          ["http:", "https:"].includes(url.protocol) && url.origin !== origin;
        const document = /\.(?:pdf|docx?|xlsx?|pptx?)(?:[?#]|$)/i.test(href);
        if (!external && !document) return;
        context.setProperty(node, "target", "_blank");
        const existing = node.properties.rel;
        context.setProperty(node, "rel", [
          ...new Set([
            ...(Array.isArray(existing)
              ? existing
              : String(existing ?? "").split(/\s+/)
            ).filter(Boolean),
            "noopener",
            "noreferrer",
          ]),
        ]);
      },
    },
  };
}
