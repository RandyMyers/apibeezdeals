/**
 * Default category SEO + FAQs for seeding.
 */
function categoryFaqs(name) {
  return [
    {
      question: `How do I find the best ${name} coupons on DealBeez?`,
      answer: `Browse our <strong>${name}</strong> category page for verified promo codes, updated deals, and store-specific offers. Filter by store and check the verified badge for recently tested codes.`,
      order: 1,
      isActive: true,
    },
    {
      question: `Are ${name} coupon codes free to use?`,
      answer: `Yes. All coupons listed on DealBeez are free. We may earn an affiliate commission when you shop through our links, at no extra cost to you.`,
      order: 2,
      isActive: true,
    },
    {
      question: `How often are ${name} deals updated?`,
      answer: `We refresh ${name} offers daily. Expired codes are removed or marked inactive, and new promotions are added within 24 hours when possible.`,
      order: 3,
      isActive: true,
    },
    {
      question: `Why is my ${name} promo code not working?`,
      answer: `Common reasons include expired codes, minimum order values, excluded products, or new-customer-only restrictions. Try another code from the same store or visit the store page for troubleshooting FAQs.`,
      order: 4,
      isActive: true,
    },
  ];
}

function categorySeoBlock(name) {
  return {
    metaTitle: `${name} Coupons & Promo Codes | DealBeez`,
    metaDescription: `Save on ${name} with verified coupon codes and deals. Browse top stores, active promo codes, and money-saving tips updated daily.`,
    seoIntro: `<p>Find the latest <strong>${name}</strong> coupons and promo codes from trusted retailers. DealBeez lists verified offers so you can save at checkout with codes that are tested regularly.</p>`,
    faqs: categoryFaqs(name),
  };
}

module.exports = { categorySeoBlock, categoryFaqs };
