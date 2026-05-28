/**
 * Canonical public site URL for sitemaps, robots, IndexNow, JSON-LD.
 */

function resolvePublicSiteUrl(req) {
  const fromEnv =
    process.env.CLIENT_PUBLIC_URL ||
    process.env.REACT_APP_SITE_URL ||
    process.env.REACT_APP_CLIENT_URL;

  if (fromEnv) return String(fromEnv).replace(/\/$/, "");

  if (req) {
    const host = req.get("host") || "";
    const protocol = req.protocol || "https";
    return `${protocol}://${host}`
      .replace(":5000", "")
      .replace(":5001", "")
      .replace(/\/$/, "");
  }

  return "https://coupondealz.com";
}

module.exports = { resolvePublicSiteUrl };
