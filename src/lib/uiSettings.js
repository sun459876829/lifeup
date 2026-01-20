import { safeLoad, safeSave } from "./storage";

const UI_SETTINGS_KEY = "lifeup.uiSettings.v1";

const DEFAULT_UI_SETTINGS = {
  showStatsPanel: true,
  showFocusTimer: true,
};

export function loadUiSettings() {
  return safeLoad(UI_SETTINGS_KEY, { ...DEFAULT_UI_SETTINGS }, (raw) => {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_SETTINGS, ...(parsed || {}) };
  });
}

export function saveUiSettings(settings) {
  safeSave(UI_SETTINGS_KEY, settings);
}

export { DEFAULT_UI_SETTINGS, UI_SETTINGS_KEY };
