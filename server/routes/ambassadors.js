import express from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../logger.js';
import { isUuid, isValidEmail, normalizeEmail } from '../lib/validation.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  deleteAmbassadorAccount,
  inviteAmbassadorByEmail,
} from '../services/ambassadorInvites.js';

const router = express.Router();

export const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many invitation requests. Please wait a few minutes and try again.' },
});

export const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many account changes. Please wait a few minutes and try again.' },
});

// Admin-only invitation. The admin supplies the email explicitly; the backend
// creates the auth invite, the ambassador placeholder record, and the email.
router.post('/invite', inviteLimiter, requireAdmin, async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  try {
    const result = await inviteAmbassadorByEmail({
      email,
      adminEmail: req.admin?.email || null,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.warn('Admin ambassador invitation failed', {
      error: error?.message,
      recipient: email,
      admin: req.admin?.email,
    });
    return res.status(502).json({ error: error?.message || 'Could not send the invitation.' });
  }
});

// Admin-only account deletion. Removes the Supabase Auth user and soft-deletes
// the profile so historical referral data and the audit trail are preserved.
router.delete('/:id', deleteLimiter, requireAdmin, async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ambassador id.' });
  }

  try {
    const result = await deleteAmbassadorAccount({
      id: req.params.id,
      adminEmail: req.admin?.email || null,
    });
    return res.status(200).json(result);
  } catch (error) {
    logger.warn('Admin ambassador deletion failed', {
      error: error?.message,
      ambassadorId: req.params.id,
      admin: req.admin?.email,
    });
    return res.status(502).json({ error: error?.message || 'Could not delete the ambassador account.' });
  }
});

export default router;
