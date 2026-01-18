const UI_SETTINGS_KEY = "lifeup.uiSettings.v1";

const DEFAULT_UI_SETTINGS = {
  showStatsPanel: true,
  showFocusTimer: true,
};

export function loadUiSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_UI_SETTINGS };
  try {
    const stored = localStorage.getItem(UI_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_UI_SETTINGS };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_UI_SETTINGS, ...(parsed || {}) };
  } catch (error) {
    console.error("Failed to load UI settings", error);
    return { ...DEFAULT_UI_SETTINGS };
  }
}

export function saveUiSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save UI settings", error);
  }
}

export { DEFAULT_UI_SETTINGS, UI_SETTINGS_KEY };
