/**
 * Robots.txt Generator
 */

const generateRobotsTxt = (options = {}) => {
  const {
    allowAll = true,
    disallowPaths = [],
    allowPaths = [],
    sitemapUrls = [],
    crawlDelay = null,
    baseUrl = 'https://coupondealz.com',
  } = options;

  let robots = 'User-agent: *\n';

  if (allowAll && disallowPaths.length === 0) {
    robots += 'Allow: /\n';
  } else {
    allowPaths.forEach((path) => { robots += `Allow: ${path}\n`; });
    if (allowPaths.length === 0) robots += 'Allow: /\n';
    disallowPaths.forEach((path) => { robots += `Disallow: ${path}\n`; });
  }

  if (crawlDelay) robots += `Crawl-delay: ${crawlDelay}\n`;

  const base = String(baseUrl || 'https://coupondealz.com').replace(/\/$/, '');
  const sitemaps =
    sitemapUrls.length > 0
      ? sitemapUrls
      : [
          `${base}/sitemap-index.xml`,
          `${base}/sitemap.xml`,
          `${base}/sitemap-images.xml`,
          `${base}/sitemap-news.xml`,
        ];

  sitemaps.forEach((url) => {
    robots += `\nSitemap: ${url}\n`;
  });

  robots += '\nUser-agent: Googlebot\nAllow: /\n';
  robots += '\nUser-agent: Bingbot\nAllow: /\n';
  robots += '\nUser-agent: AhrefsBot\nDisallow: /\n';
  robots += '\nUser-agent: SemrushBot\nDisallow: /\n';
  robots += '\nUser-agent: DotBot\nDisallow: /\n';

  return robots;
};

const getDefaultRobotsConfig = () => ({
  allowAll: true,
  disallowPaths: [
    '/api/',
    '/admin/',
    '/search',
    '/signin',
    '/register',
    '/dashboard',
    '/submit-deal',
    '/forgot-password',
    '/reset-password',
  ],
  allowPaths: [],
  sitemapUrls: [],
  crawlDelay: null,
});

module.exports = { generateRobotsTxt, getDefaultRobotsConfig };
