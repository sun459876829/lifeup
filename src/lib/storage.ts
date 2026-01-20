export function safeLoad<T>(
  key: string,
  fallback: T,
  parser?: (raw: string) => T
): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = parser ? parser(raw) : (JSON.parse(raw) as T);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSave<T>(
  key: string,
  value: T,
  serializer?: (value: T) => string
) {
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
