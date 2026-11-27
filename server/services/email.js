import { config, isGraphConfigured } from '../config.js';
import { logger } from '../logger.js';
import { normalizeEmail, validateEmailContent } from '../lib/validation.js';
import { recordDelivery } from './deliveryLog.js';
import { graphProvider } from './emailProviders/graph.js';
import { mockProvider } from './emailProviders/mock.js';
import { tokenService } from './microsoftGraph/tokenService.js';

const provider = config.emailProvider === 'graph' ? graphProvider : mockProvider;

export const emailService = {
  provider: provider.name,
  configured: provider.name === 'mock' ? true : isGraphConfigured,

  status() {
    return {
      configured: this.configured,
      provider: this.provider,
      graphConfigured: isGraphConfigured,
      requiresReauth: tokenService.requiresReauth,
      tokenStore: 'supabase',
      sender: config.msGraphSenderEmail,
    };
  },

  async send({
    to,
    subject,
    html,
    text,
    relatedType = null,
    relatedId = null,
    createdBy = null,
  }) {
    const recipient = normalizeEmail(to);
    const cleanSubject = String(subject || '').trim();
    const errors = validateEmailContent({ to: recipient, subject: cleanSubject, html, text });

    if (errors.length > 0) {
      throw new Error(errors[0]);
    }

    try {
      const result = await provider.send({
        to: recipient,
        subject: cleanSubject,
        html,
        text,
      });

      const deliveryStatus =
        provider.name === 'mock'
          ? 'captured'
          : result?.outcome === 'submitted'
            ? 'submitted'
            : 'sent';

      const deliveryId = await recordDelivery({
        recipient,
        subject: cleanSubject,
        provider: provider.name,
        status: deliveryStatus,
        relatedType,
        relatedId,
        createdBy,
      });

      logger.info('Email delivery succeeded', {
        provider: provider.name,
        recipient,
        subject: cleanSubject,
        deliveryId,
      });

      return {
        success: true,
        provider: provider.name,
        deliveryId,
        providerMessageId: result?.providerMessageId || null,
        mock: provider.name === 'mock',
      };
    } catch (error) {
      const safeMessage = error?.message || 'Email delivery failed.';

      await recordDelivery({
        recipient,
        subject: cleanSubject,
        provider: provider.name,
        status: 'failed',
        errorMessage: safeMessage,
        relatedType,
        relatedId,
        createdBy,
      });

      logger.error('Email delivery failed', {
        provider: provider.name,
        recipient,
        subject: cleanSubject,
        error: safeMessage,
      });

      throw new Error(safeMessage);
    }
  },
};
