const { CONTENT_LOCALE_CODES } = require("../utils/contentLocales");
const { LEGAL_PAGE_LABELS } = require("./i18n/legalPageLabels");

const localizedFaqs = {
  en: [
    {
      question: "How do I use a coupon code?",
      answer:
        "Find the coupon you want, click <strong>See Coupon</strong> to reveal the code, then paste it at checkout on the store website.",
      order: 1,
    },
    {
      question: "Are the coupons verified?",
      answer:
        "Yes. Our editorial team verifies coupons daily and labels recently tested offers as verified.",
      order: 2,
    },
    {
      question: "Is DealBeez free to use?",
      answer:
        "Yes, 100% free. We may earn a commission from partner stores at no extra cost to you.",
      order: 3,
    },
    {
      question: "How often are new deals added?",
      answer:
        "We add new coupons and deals throughout the day. Community submissions are reviewed within 24 hours.",
      order: 4,
    },
    {
      question: "Why did my coupon code not work?",
      answer:
        "Codes can expire, have minimum spend rules, or exclude certain products. Try another verified code from the same store page.",
      order: 5,
    },
    {
      question: "Do you sell my personal data?",
      answer:
        "No. We do not sell personally identifiable information. See our Privacy Policy for details on analytics and account data.",
      order: 6,
    },
  ],
};

function buildLocaleBlock(pageSlug, base) {
  const labels = LEGAL_PAGE_LABELS[pageSlug] || {};
  return (locale) => {
    const loc = labels[locale] || labels.en || {};
    return {
      title: loc.title || base.title,
      subtitle: loc.subtitle || base.subtitle,
      bodyHtml: base.bodyHtml,
      faqs: localizedFaqs[locale] || localizedFaqs.en || base.faqs || [],
      updatedAt: new Date(),
    };
  };
}

const termsBase = {
  title: "Terms of Service",
  subtitle: "Please read these terms carefully.",
  bodyHtml: [
    "<p>By using DealBeez, you agree to use the service lawfully and in accordance with merchant and platform policies.</p>",
    "<p>You may not scrape content in bulk, attempt abuse, or misuse affiliate tracking links.</p>",
    "<p>Replace this template with counsel-approved terms before public launch in regulated markets.</p>",
  ].join(""),
};

const privacyBase = {
  title: "Privacy Policy",
  subtitle: "Last updated May 2026.",
  bodyHtml: [
    "<p>We collect limited usage analytics to improve browsing, deal relevance, and fraud prevention.</p>",
    "<p>We do not sell personally identifiable information. You can request account and data deletion from support.</p>",
    "<p>Replace this template with counsel-approved privacy text before public launch.</p>",
  ].join(""),
};

const faqBase = {
  title: "Frequently Asked Questions",
  subtitle: "Quick answers to common questions.",
  bodyHtml: "",
  faqs: localizedFaqs.en,
};

function buildTranslations(pageSlug, baseObj) {
  const builder = buildLocaleBlock(pageSlug, baseObj);
  const map = {};
  map.en = builder("en");
  for (const locale of CONTENT_LOCALE_CODES) {
    map[locale] = builder(locale);
  }
  return map;
}

module.exports = [
  {
    slug: "terms",
    ...termsBase,
    isPublished: true,
    languageTranslations: buildTranslations("terms", termsBase),
  },
  {
    slug: "privacy",
    ...privacyBase,
    isPublished: true,
    languageTranslations: buildTranslations("privacy", privacyBase),
  },
  {
    slug: "faq",
    ...faqBase,
    isPublished: true,
    languageTranslations: buildTranslations("faq", faqBase),
  },
];
