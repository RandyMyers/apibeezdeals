/**
 * Language list for sitemaps — mirrors client/src/config/languageConfig.js
 */

const SUPPORTED_LANGUAGES = [
  { code: "en", locale: "en-US", urlCode: "en", default: true },
  { code: "ga", locale: "ga-IE", urlCode: "ga" },
  { code: "de", locale: "de-DE", urlCode: "de" },
  { code: "es", locale: "es-ES", urlCode: "es" },
  { code: "it", locale: "it-IT", urlCode: "it" },
  { code: "no", locale: "no-NO", urlCode: "no" },
  { code: "fi", locale: "fi-FI", urlCode: "fi" },
  { code: "da", locale: "da-DK", urlCode: "da" },
  { code: "sv", locale: "sv-SE", urlCode: "sv" },
  { code: "fr", locale: "fr-FR", urlCode: "fr" },
  { code: "pt", locale: "pt-PT", urlCode: "pt" },
  { code: "nl", locale: "nl-NL", urlCode: "nl" },
  { code: "en-GB", locale: "en-GB", urlCode: "uk" },
  { code: "en-AU", locale: "en-AU", urlCode: "au" },
  { code: "de-AT", locale: "de-AT", urlCode: "at" },
];

const DEFAULT_LANGUAGE = "en";

function getDefaultLanguage() {
  return DEFAULT_LANGUAGE;
}

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

function generateLanguageUrl(path, langCode) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  if (!lang || lang.code === DEFAULT_LANGUAGE) {
    return clean;
  }
  const prefix = lang.urlCode || lang.code;
  return clean === "/" ? `/${prefix}` : `/${prefix}${clean}`;
}

function absoluteLanguageUrl(baseUrl, path, langCode) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  return `${base}${generateLanguageUrl(path, langCode)}`;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getDefaultLanguage,
  getSupportedLanguages,
  generateLanguageUrl,
  absoluteLanguageUrl,
};
