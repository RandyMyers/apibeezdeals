/** Non-English locale codes aligned with client languageConfig (English is base content). */
const CONTENT_LOCALE_CODES = [
  "ga",
  "de",
  "es",
  "it",
  "no",
  "fi",
  "da",
  "sv",
  "fr",
  "pt",
  "nl",
  "en-GB",
  "en-AU",
  "de-AT",
];

function isContentLocale(code) {
  return CONTENT_LOCALE_CODES.includes(String(code || "").trim());
}

module.exports = { CONTENT_LOCALE_CODES, isContentLocale };
