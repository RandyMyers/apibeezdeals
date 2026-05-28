const Coupon = require("../models/Coupon");

/** Throws 404 if no published coupon with this public id. */
async function assertPublishedCoupon(publicId) {
  const c = await Coupon.findOne({ publicId, isPublished: true }).lean();
  if (!c) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  return c;
}

module.exports = { assertPublishedCoupon };
