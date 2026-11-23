import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Local development equivalent of the /api/send-email serverless function.
// Reads RESEND_API_KEY from the server-side .env, never from import.meta.env.
function resendDevEndpoint(env) {
  const apiKey = env.RESEND_API_KEY;

  return {
    name: 'resend-dev-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          res.end(JSON.stringify({ configured: Boolean(apiKey) }));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const body = JSON.parse(raw || '{}');

          if (!apiKey) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: 'RESEND_API_KEY is not configured in .env' }));
            return;
          }
          if (!body.to || !body.subject) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing recipient or subject.' }));
            return;
          }

          const from =
            env.EMAIL_FROM ||
            'CITE Hackathon 2026 <onboarding@resend.dev>';

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from,
              to: Array.isArray(body.to) ? body.to : [body.to],
              subject: body.subject,
              html: body.html || `<p>${String(body.text || '').replace(/\n/g, '<br/>')}</p>`,
              text: body.text || '',
            }),
          });

          const data = await response.json().catch(() => ({}));
          res.statusCode = response.status;
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Email delivery failed' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), resendDevEndpoint(env)],
    // Supabase config is injected at build time from server-side env vars.
    // These are public-by-design values (anon key, not service role); RLS is
    // the real access boundary.
    define: {
      __SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL || ''),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY || ''),
    },
    build: {
      target: 'es2019',
      cssCodeSplit: true,
    },
  };
});
