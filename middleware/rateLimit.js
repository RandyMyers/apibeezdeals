const rateLimit = require("express-rate-limit");

const windowMs = 15 * 60 * 1000;

exports.authRateLimit = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: "Too many auth attempts. Try again later." },
});

exports.formsRateLimit = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: "Too many requests. Try again later." },
});

exports.generalRateLimit = rateLimit({
  windowMs,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: "Too many requests. Try again later." },
});
