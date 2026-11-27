import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';
import { logger } from '../../logger.js';

function safeFilenamePart(value) {
  return String(value || 'email')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const mockProvider = {
  name: 'mock',
  configured: true,

  async send({ to, subject, html, text }) {
    if (config.isProduction && !config.allowMockInProduction) {
      throw new Error(
        'The mock email provider is disabled in production. Set EMAIL_PROVIDER=graph and configure Microsoft 365.'
      );
    }

    const messageId = `mock-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const filename = `${createdAt.replace(/[:.]/g, '-')}-${safeFilenamePart(to)}.json`;
    const filePath = path.join(config.mockOutboxDir, filename);

    await fs.mkdir(config.mockOutboxDir, { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify(
        {
          messageId,
          provider: 'mock',
          to,
          from: config.msGraphSenderEmail,
          subject,
          html,
          text,
          createdAt,
        },
        null,
        2
      ),
      'utf8'
    );

    logger.info('Mock email captured', {
      to,
      subject,
      file: path.relative(process.cwd(), filePath),
    });

    return { providerMessageId: messageId, mockFile: filePath };
  },
};
