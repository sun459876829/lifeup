export const UI_SETTINGS_KEY = "lifeup_ui_settings_v1";

export type UiSettings = {
  theme: "light" | "dark" | "system";
  showAdvanced: boolean;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  theme: "dark",
  showAdvanced: false,
};

export function loadUiSettings(): UiSettings {
  if (typeof window === "undefined") return DEFAULT_UI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return DEFAULT_UI_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

export function saveUiSettings(settings: UiSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
