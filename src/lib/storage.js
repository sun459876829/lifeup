export function safeLoad(key, fallback, parser) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = parser ? parser(raw) : JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSave(key, value, serializer) {
  if (typeof window === "undefined") return;
  try {
    const payload = serializer
      ? serializer(value)
      : typeof value === "string"
      ? value
      : JSON.stringify(value);
    window.localStorage.setItem(key, payload);
  } catch {
    // ignore
  }
}
