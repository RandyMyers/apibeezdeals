/**
 * Generic store SEO backfill when FAQs/meta are missing.
 */
function storeFaqs(storeName) {
  return [
    {
      question: `What is the best ${storeName} coupon code today?`,
      answer: `Visit the <strong>${storeName}</strong> page on DealBeez for today's active codes. Verified offers are labeled and checked regularly by our team.`,
      order: 1,
      isActive: true,
      group: "faq",
    },
    {
      question: `How do I use a ${storeName} promo code?`,
      answer: `<p>Copy the code from DealBeez, open ${storeName}'s checkout, and paste it into the promo or coupon field before you pay. Discounts apply instantly when the code is valid.</p>`,
      order: 2,
      isActive: true,
      group: "faq",
    },
    {
      question: `Is DealBeez free for ${storeName} shoppers?`,
      answer: `Yes. Browsing and using ${storeName} coupons on DealBeez is 100% free. We may earn a commission from the store when you complete a purchase through our links.`,
      order: 3,
      isActive: true,
      group: "faq",
    },
    {
      question: `Why is my ${storeName} coupon not working?`,
      answer: `Codes may expire, require a minimum spend, or apply only to selected items. Try another code on the ${storeName} store page or check exclusions listed with each offer.`,
      order: 4,
      isActive: true,
      group: "troubleshooting",
    },
  ];
}

function storeSeoDefaults(store) {
  const name = store.name || "this store";
  return {
    metaTitle: `${name} Coupon Codes & Deals | DealBeez`,
    metaDescription: `Get verified ${name} coupon codes and promo deals. Save with tested offers updated regularly on DealBeez.`,
    seoH1: `${name} Coupons & Promo Codes`,
    seoIntro: `<p>Save at <strong>${name}</strong> with verified coupon codes and exclusive deals curated by DealBeez. Check back often for new promotions.</p>`,
    logoAlt: store.logoAlt || `${name} logo`,
    faqs: storeFaqs(name),
    contentUpdatedAt: new Date(),
    lastVerifiedAt: new Date(),
  };
}

module.exports = { storeFaqs, storeSeoDefaults };
