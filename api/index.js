import app from '../server/index.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

/**
 * Vercel rewrites /api/:path* to this single function and passes the original
 * API path as `route`. Restore that path so the existing Express router can
 * handle /api/health, /api/email/*, and /api/ambassadors/* unchanged.
 */
function getRewrittenRoute(req) {
  const fromQuery = req.query?.route;
  if (Array.isArray(fromQuery)) return fromQuery.join('/');
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;

  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams.get('route') || '';
}

export default function handler(req, res) {
  const route = getRewrittenRoute(req);

  if (route) {
    const url = new URL(req.url || '/', 'http://localhost');
    url.searchParams.delete('route');
    req.url = `/api/${route}${url.search}`;
  }

  return app(req, res);
}
