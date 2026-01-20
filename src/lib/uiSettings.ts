import { safeLoad, safeSave } from "./storage";

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
  return safeLoad(UI_SETTINGS_KEY, DEFAULT_UI_SETTINGS, (raw: string) => {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_SETTINGS, ...parsed };
  });
}

export function saveUiSettings(settings: UiSettings) {
  safeSave(UI_SETTINGS_KEY, settings);
}
