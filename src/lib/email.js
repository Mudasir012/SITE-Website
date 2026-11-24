// Email templates. Delivery always goes through the server-side endpoint
// (/api/send-email) so the Resend key is never exposed to the browser.

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
    const res = await fetch('/api/send-email', { method: 'GET' });
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch {
    return { configured: false };
  }
}

export async function sendEmail({ to, subject, html, text }) {
  let res;
  try {
    res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<p>${escapeHtml(text || '').replace(/\n/g, '<br/>')}</p>`,
        text: text || '',
      }),
    });
  } catch {
    throw new Error('Email service is temporarily unavailable. Please try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const reason = data?.error?.message || data?.error || data?.message;
    throw new Error(
      typeof reason === 'string' && reason
        ? reason
        : `Email service rejected the request (HTTP ${res.status}).`
    );
  }

  if (!data?.id) throw new Error('Email service did not confirm delivery.');
  return { success: true, id: data.id };
}

/**
 * Participant Approval Email Template
 */
export async function sendRegistrationApprovalEmail({ to, fullName, eventTitle, venue, dates }) {
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
  });
}

/**
 * Announcement / Broadcast Template
 */
export async function sendBroadcastEmail({ to, subject, body }) {
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
  });
}
