const mongoose = require("mongoose");

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 320 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
