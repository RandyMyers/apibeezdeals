const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send password reset email. Returns true if sent, false if SMTP not configured.
 */
async function sendPasswordResetEmail({ to, resetLink }) {
  const tx = getTransporter();
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@coupondealz.com";
  if (!tx) return false;

  await tx.sendMail({
    from,
    to,
    subject: "Reset your CouponDealz password",
    text: `Reset your password using this link (valid for 1 hour):\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Reset your password using the link below (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this email.</p>`,
  });
  return true;
}

/** Notify admin inbox about a new contact message (SMTP + ADMIN_NOTIFY_EMAIL required). */
async function sendContactFormNotification({ name, email, message }) {
  const tx = getTransporter();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@coupondealz.com";
  if (!tx || !to) return false;

  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  await tx.sendMail({
    from,
    to,
    replyTo: email,
    subject: `CouponDealz contact: ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;</p><p>${esc(message).replace(/\n/g, "<br/>")}</p>`,
  });
  return true;
}

/** Optional welcome email after newsletter subscribe (SMTP required). */
async function sendNewsletterWelcomeEmail({ to }) {
  const tx = getTransporter();
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@coupondealz.com";
  if (!tx) return false;

  await tx.sendMail({
    from,
    to,
    subject: "You're on the CouponDealz list",
    text: "Thanks for subscribing — we'll send savings tips and highlights when we have something worth your inbox.",
    html: "<p>Thanks for subscribing — we’ll send savings tips and highlights when we have something worth your inbox.</p>",
  });
  return true;
}

module.exports = {
  sendPasswordResetEmail,
  sendContactFormNotification,
  sendNewsletterWelcomeEmail,
};
