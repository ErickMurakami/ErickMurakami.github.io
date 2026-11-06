// Shared by the static build and its output validation.
export function productionSite(value = process.env.PORTFOLIO_SITE_URL) {
  const url = new URL(value || "https://erickmurakami.github.io/");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "PORTFOLIO_SITE_URL must be an HTTPS origin without a path, credentials, query or fragment.",
    );
  return url.origin;
}
