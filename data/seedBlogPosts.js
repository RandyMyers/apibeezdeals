/** Seed blog posts (matches former client mock data). */
module.exports = [
  {
    slug: "stack-coupons-smart",
    title: "How to Stack Coupons Without Getting Burned",
    excerpt:
      "Learn which stores allow stacking and how to read the fine print before checkout.",
    content:
      "Stacking coupons sounds simple until a retailer rejects your code at checkout.\n\n" +
      "Start by checking the store's official coupon policy. Some merchants allow one code per order, " +
      "while others permit a percentage-off code plus free shipping.\n\n" +
      "Always apply the highest-value code first, then test secondary codes in a new tab before you pay.",
    featuredImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop",
    readMins: 6,
    isPublished: true,
    publishedAt: new Date("2026-04-08"),
  },
  {
    slug: "holiday-shopping-timeline",
    title: "The Best Time to Shop Major Holidays",
    excerpt:
      "A month-by-month look at when retailers typically drop their deepest discounts.",
    content:
      "Holiday sales rarely happen on a single day anymore. Black Friday deals often start in early November, " +
      "and Cyber Monday extensions can run through the following week.\n\n" +
      "Use this timeline to plan purchases: back-to-school in August, Halloween in early October, " +
      "and post-holiday clearance in January for the steepest markdowns on seasonal items.",
    featuredImage:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=340&fit=crop",
    readMins: 8,
    isPublished: true,
    publishedAt: new Date("2026-04-05"),
  },
  {
    slug: "cashback-plus-codes",
    title: "Combining Cash Back Portals With Promo Codes",
    excerpt:
      "Double-dip savings when the portal and the merchant both allow it — we explain how.",
    content:
      "Cash back portals track your visit with a referral link. If you leave the site and return with a coupon tab, " +
      "you may lose tracking.\n\n" +
      "Best practice: click through the portal first, add items to cart, then apply a promo code only if the portal's " +
      "terms allow code stacking. Screenshot your cart total in case you need to file a missing-cashback claim.",
    featuredImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop",
    readMins: 5,
    isPublished: true,
    publishedAt: new Date("2026-03-28"),
  },
];
