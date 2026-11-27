// Email templates. Delivery always goes through the Express backend
// (/api/email/send), which holds the Supabase service-role and Microsoft 365
// credentials. No email provider secret ever reaches the browser.

import { apiFetch } from './api.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

export async function getEmailStatus() {
  try {
    return await apiFetch('/api/email/status');
  } catch {
    return { configured: false, provider: 'unavailable' };
  }
}

export async function sendEmail({ to, subject, html, text, accessToken }) {
  if (!accessToken) {
    throw new Error('Your admin session has expired. Please sign in again.');
  }

  const recipient = Array.isArray(to) ? to[0] : to;
  if (!recipient) throw new Error('A recipient email is required.');

  const data = await apiFetch('/api/email/send', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      to: recipient,
      subject,
      html: html || `<p>${escapeHtml(text || '').replace(/\n/g, '<br/>')}</p>`,
      text: text || '',
    }),
  });

  if (!data?.success) throw new Error('Email service did not confirm delivery.');
  return {
    success: true,
    id: data.deliveryId || data.id || null,
    provider: data.provider,
    mock: Boolean(data.mock),
  };
}

/**
 * Participant Approval Email Template
 */
export async function sendRegistrationApprovalEmail({ to, fullName, eventTitle, venue, dates, accessToken }) {
  const safeName = escapeHtml(fullName);
  const safeTitle = escapeHtml(eventTitle || 'Flagship Hackathon');
  const safeVenue = escapeHtml(venue || 'CS Complex, COMSATS Abbottabad');
  const safeDates = escapeHtml(dates || 'December 2026');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background-color: #065f46; color: #ffffff; padding: 32px 24px; text-align: center; }
          .body { padding: 32px 28px; font-size: 14px; line-height: 1.6; color: #334155; }
          .details { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 20px 0; }
          .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; font-size: 11px; text-align: center; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px;">Registration Confirmed</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">CITE Hackathon 2026 • COMSATS Abbottabad</p>
          </div>
          <div class="body">
            <p>Dear <strong>${safeName}</strong>,</p>
            <p>Congratulations! Your registration for <strong>${safeTitle}</strong> has been officially approved and verified by the administrative committee.</p>

            <div class="details">
              <div><strong>Track:</strong> ${safeTitle}</div>
              <div><strong>Venue:</strong> ${safeVenue}</div>
              <div><strong>Event Window:</strong> ${safeDates}</div>
            </div>

            <p>Please bring your original University Student ID Card with you for on-desk verification on arrival.</p>
            <p>Best regards,<br><strong>CITE 2026 Directorate</strong></p>
          </div>
          <div class="footer">
            COMSATS University Islamabad, Abbottabad Campus • Department of Computer Science
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Congratulations! Your CITE 2026 Registration is Approved (${safeTitle})`,
    html,
    text: `Dear ${fullName},\n\nYour registration for ${eventTitle} has been officially approved.\n\nVenue: ${venue}\nDates: ${dates}\n\nCOMSATS University Abbottabad`,
    accessToken,
  });
}

/**
 * Announcement / Broadcast Template
 */
export async function sendBroadcastEmail({ to, subject, body, accessToken }) {
  const safeBody = escapeHtml(body);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background-color: #0b1b33; color: #ffffff; padding: 28px 24px; text-align: center; }
          .body { padding: 32px 28px; font-size: 14px; line-height: 1.7; color: #334155; }
          .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; font-size: 11px; text-align: center; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px; color: #e5d6ba;">CITE'26 Official Announcement</h2>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">COMSATS University Islamabad, Abbottabad Campus</div>
          </div>
          <div class="body">
            <div style="white-space: pre-line;">${safeBody}</div>
          </div>
          <div class="footer">
            Department of Computer Science • CITE 2026 Organizing Committee
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: body,
    accessToken,
  });
}
