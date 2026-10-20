const STATS_KEY = "kalimati-stats";
const SETTINGS_KEY = "kalimati-settings";
const SAVED_WORDS_KEY = "kalimati-saved-words";
const CUSTOM_WORDS_KEY = "kalimati-custom-words";

function readObject(key, defaults) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" ? { ...defaults, ...value } : { ...defaults };
  } catch (error) {
    console.warn(`تعذّرت قراءة البيانات المحفوظة (${key}):`, error);
    return { ...defaults };
  }
}

export function getStats() {
  const stats = readObject(STATS_KEY, { answered: 0, correct: 0, wordProgress: {} });
  if (!stats.wordProgress || typeof stats.wordProgress !== "object") {
    stats.wordProgress = {};
  }
  return stats;
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getSettings() {
  return readObject(SETTINGS_KEY, { reminderEnabled: false });
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSavedWords() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_WORDS_KEY));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn("تعذّرت قراءة الكلمات المحفوظة:", error);
    return [];
  }
}

export function saveSavedWords(savedWords) {
  localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
}

export function getCustomWords() {
  try {
    const value = JSON.parse(localStorage.getItem(CUSTOM_WORDS_KEY));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn("تعذّرت قراءة كلمات المستخدم:", error);
    return [];
  }
}

export function saveCustomWords(customWords) {
  localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));
}
