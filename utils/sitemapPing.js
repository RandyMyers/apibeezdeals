/**
 * Ping search engines when sitemap updates (no OAuth required).
 */

async function pingUrl(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function notifySitemapUpdated(siteUrl, options = {}) {
  const base = String(siteUrl || "").replace(/\/$/, "");
  if (!base) return;

  const sitemapUrl = encodeURIComponent(`${base}/sitemap.xml`);
  const pings = [
    `https://www.google.com/ping?sitemap=${sitemapUrl}`,
    `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
  ];

  if (options.indexNowKey) {
    const { pingIndexNow } = require("./indexNow");
    await pingIndexNow([`${base}/sitemap.xml`], { key: options.indexNowKey }).catch(() => {});
  }

  await Promise.allSettled(pings.map((u) => pingUrl(u)));
}

module.exports = { notifySitemapUpdated };
