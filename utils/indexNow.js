/**
 * IndexNow ping (Bing, Yandex, etc.) — fire-and-forget on publish/update.
 */

const { resolvePublicSiteUrl } = require("./siteUrl");
const { absoluteLanguageUrl } = require("./sitemapLanguages");

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

async function pingIndexNow(urls, options = {}) {
  const key = process.env.INDEXNOW_API_KEY || options.key;
  if (!key || !urls?.length) return;

  const host = new URL(resolvePublicSiteUrl(options.req)).hostname;
  const unique = [...new Set(urls.filter(Boolean))];

  const body = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: unique.slice(0, 10_000),
  };

  await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      if (!res.ok && process.env.NODE_ENV !== "production") {
        console.warn(`IndexNow ${endpoint}: HTTP ${res.status}`);
      }
    })
  );
}

function notifyStorePublished(store, req) {
  if (!store?.slug) return;
  const base = resolvePublicSiteUrl(req);
  const path = `/store/${store.slug}`;
  pingIndexNow([absoluteLanguageUrl(base, path, "en")], { req }).catch(() => {});
}

function notifyCouponPublished(coupon, req) {
  const id = coupon?.publicId || coupon?.id;
  if (!id) return;
  const base = resolvePublicSiteUrl(req);
  const path = `/coupon/${id}`;
  pingIndexNow([absoluteLanguageUrl(base, path, "en")], { req }).catch(() => {});
}

function notifyBlogPublished(post, req) {
  if (!post?.slug) return;
  const base = resolvePublicSiteUrl(req);
  const path = `/blog/${post.slug}`;
  pingIndexNow([absoluteLanguageUrl(base, path, "en")], { req }).catch(() => {});
}

module.exports = {
  pingIndexNow,
  notifyStorePublished,
  notifyCouponPublished,
  notifyBlogPublished,
};
