const express = require("express");

const router = express.Router();

function siteBase(req) {
  return (
    process.env.CLIENT_PUBLIC_URL ||
    process.env.REACT_APP_SITE_URL ||
    `${req.protocol}://${req.get("host")}`.replace(":5000", "").replace(":5001", "")
  ).replace(/\/$/, "");
}

const LLMS_TXT = (base) => `# DealBeez (CouponDealz) — llms.txt
# ${base}/llms.txt

User-agent: *
Allow: /

Citation: DealBeez (${base})

# High-value paths
/faq: ${base}/faq
/stores: ${base}/stores, ${base}/store/{slug}
/coupons: ${base}/coupons, ${base}/coupon/{id}
/categories: ${base}/categories, ${base}/category/{slug}
/blog: ${base}/blog, ${base}/blog/{slug}

Disallow: /api/
Disallow: /admin/
Disallow: /search
Disallow: /signin
Disallow: /register
Disallow: /dashboard
Disallow: /submit-deal

Contact: ${base}/contact
`;

router.get("/llms.txt", (req, res) => {
  const base = siteBase(req);
  res.type("text/plain").send(LLMS_TXT(base));
});

router.get("/llms-full.txt", (req, res) => {
  const base = siteBase(req);
  res.type("text/plain").send(`${LLMS_TXT(base)}
# API (read-only public content)
Content API: ${base.replace(/\/$/, "")}/api/v1/

Sitemaps:
- ${base}/sitemap-index.xml
- ${base}/sitemap.xml
- ${base}/sitemap-images.xml
- ${base}/sitemap-news.xml
`);
});

module.exports = router;
