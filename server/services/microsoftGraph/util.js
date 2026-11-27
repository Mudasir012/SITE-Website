export function timeoutSignal(timeoutMs) {
  if (
    typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.timeout === 'function'
  ) {
    return AbortSignal.timeout(timeoutMs);
  }
  return undefined;
}

export function parseRetryAfterMs(value, now = Date.now()) {
  if (value === null || value === undefined || value === '') return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = Date.parse(String(value));
  if (Number.isNaN(date)) return null;
  return Math.max(0, date - now);
}
