const SENSITIVE_KEY = /(token|secret|password|service.?role|action.?link|authorization|api.?key|magic.?link)/i;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const TOKEN_QUERY_PATTERN = /([?&](?:token|access_token|refresh_token|code)=)[^&\s]+/gi;
const LINK_PATTERN = /(action_link["'\s:=]+)(https?:\/\/[^\s"']+)/gi;

export function redactString(value) {
  return String(value)
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(TOKEN_QUERY_PATTERN, '$1[REDACTED]')
    .replace(LINK_PATTERN, '$1[REDACTED]');
}

export function redact(value, depth = 0) {
  if (depth > 6) return '[Truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (SENSITIVE_KEY.test(key)) return [key, '[REDACTED]'];
      return [key, redact(item, depth + 1)];
    })
  );
}

function emit(level, message, meta) {
  const payload = {
    level,
    time: new Date().toISOString(),
    message: redactString(message),
  };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = redact(meta);
  }

  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};
