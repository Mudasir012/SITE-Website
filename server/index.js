import path from 'node:path';
import { pathToFileURL } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { assertBackendConfiguration, config } from './config.js';
import { logger } from './logger.js';
import ambassadorsRouter from './routes/ambassadors.js';
import emailRouter from './routes/email.js';
import { emailService } from './services/email.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5199',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5199',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin === config.appUrl) return callback(null, true);
      if (!config.isProduction && devOrigins.includes(origin)) return callback(null, true);
      if (!config.isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'cite-email-backend',
    provider: emailService.provider,
    configured: emailService.configured,
    time: new Date().toISOString(),
  });
});

app.use('/api/email', emailRouter);
app.use('/api/ambassadors', ambassadorsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  logger.error('Unhandled backend error', {
    error: error?.message,
    path: req.originalUrl,
  });

  if (error?.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }

  return res.status(500).json({ error: 'Internal server error.' });
});

export function startServer() {
  assertBackendConfiguration();

  return app.listen(config.port, () => {
    logger.info('CITE email backend listening', {
      port: config.port,
      provider: emailService.provider,
      appUrl: config.appUrl,
      production: config.isProduction,
    });

    if (emailService.provider === 'mock') {
      logger.info('Mock email mode is active; captured messages are written locally', {
        outbox: path.relative(process.cwd(), config.mockOutboxDir),
      });
    }
  });
}

const isMainModule =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  startServer();
}

export default app;
