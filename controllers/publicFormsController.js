const ContactMessage = require("../models/ContactMessage");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const asyncHandler = require("../utils/asyncHandler");
const { createPublicId } = require("../utils/publicId");
const {
  sendContactFormNotification,
  sendNewsletterWelcomeEmail,
} = require("../utils/email");

exports.submitContact = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 200);
  const email = String(req.body?.email || "")
    .toLowerCase()
    .trim()
    .slice(0, 320);
  const message = String(req.body?.message || "").trim().slice(0, 8000);
  if (!name || !email || !message) {
    const err = new Error("name, email, and message are required");
    err.status = 400;
    throw err;
  }
  await ContactMessage.create({
    publicId: createPublicId("ct"),
    name,
    email,
    message,
  });
  sendContactFormNotification({ name, email, message }).catch((err) =>
    console.error("contact notify email:", err.message)
  );
  res.status(201).json({ ok: true });
});

exports.subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "")
    .toLowerCase()
    .trim()
    .slice(0, 320);
  if (!email || !email.includes("@")) {
    const err = new Error("valid email is required");
    err.status = 400;
    throw err;
  }
  const exists = await NewsletterSubscriber.findOne({ email }).lean();
  if (exists) {
    res.json({ ok: true, existing: true });
    return;
  }
  await NewsletterSubscriber.create({
    publicId: createPublicId("nl"),
    email,
  });
  sendNewsletterWelcomeEmail({ to: email }).catch((err) =>
    console.error("newsletter welcome email:", err.message)
  );
  res.status(201).json({ ok: true });
});
