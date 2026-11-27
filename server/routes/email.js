import express from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../logger.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { recordAdminAudit } from '../services/audit.js';
import { emailService } from '../services/email.js';

const router = express.Router();

export const emailSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many email requests. Please wait a few minutes and try again.' },
});

router.get('/status', (req, res) => {
  res.json(emailService.status());
});

router.post('/send', emailSendLimiter, requireAdmin, async (req, res) => {
  const { to, subject, html, text } = req.body || {};

  try {
    const result = await emailService.send({
      to,
      subject,
      html,
      text,
      relatedType: 'admin_email',
      relatedId: null,
      createdBy: req.admin?.email || null,
    });

    await recordAdminAudit({
      actorEmail: req.admin?.email,
      action: 'ADMIN_EMAIL_SENT',
      entityType: 'email',
      entityId: result.deliveryId,
      details: { recipient: to, subject, provider: result.provider },
    });

    return res.status(200).json(result);
  } catch (error) {
    await recordAdminAudit({
      actorEmail: req.admin?.email,
      action: 'ADMIN_EMAIL_FAILED',
      entityType: 'email',
      details: { recipient: to, subject, error: error?.message },
    });

    logger.warn('Admin email request failed', {
      error: error?.message,
      recipient: to,
      admin: req.admin?.email,
    });
    return res.status(502).json({ error: error?.message || 'Email delivery failed.' });
  }
});

export default router;
