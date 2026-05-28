const Store = require("../models/Store");
const CouponSubmission = require("../models/CouponSubmission");
const asyncHandler = require("../utils/asyncHandler");
const { createPublicId } = require("../utils/publicId");

function serializeSubmission(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.publicId,
    userPublicId: o.userPublicId,
    storePublicId: o.storePublicId,
    title: o.title,
    description: o.description,
    code: o.code || undefined,
    discountValue: o.discountValue || undefined,
    type: o.type,
    status: o.status,
    adminNote: o.adminNote || undefined,
    couponId: o.createdCouponPublicId || undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

exports.create = asyncHandler(async (req, res) => {
  const {
    storePublicId,
    title,
    description,
    code,
    discountValue,
    type,
  } = req.body || {};
  const sid = String(storePublicId || "").trim();
  if (!sid) {
    const err = new Error("storePublicId is required (must be an existing store)");
    err.status = 400;
    throw err;
  }
  const store = await Store.findOne({ publicId: sid, isPublished: true }).lean();
  if (!store) {
    const err = new Error("Store not found — you can only submit coupons for stores we list");
    err.status = 400;
    throw err;
  }
  const t = String(title || "").trim();
  if (!t) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  const row = await CouponSubmission.create({
    publicId: createPublicId("sub"),
    userId: req.user._id,
    userPublicId: req.user.publicId,
    storePublicId: sid,
    title: t,
    description: description != null ? String(description).slice(0, 8000) : "",
    code: code != null ? String(code).slice(0, 120) : "",
    discountValue: discountValue != null ? String(discountValue).slice(0, 80) : "",
    type: ["code", "deal", "sale"].includes(type) ? type : "code",
  });
  res.status(201).json({ submission: serializeSubmission(row) });
});
