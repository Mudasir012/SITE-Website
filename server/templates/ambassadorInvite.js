const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

export function buildAmbassadorInvite({ email, actionLink, appUrl }) {
  const safeEmail = escapeHtml(email || '');
  const safeLink = escapeHtml(actionLink);
  const safeAppUrl = escapeHtml(appUrl);

  const subject = 'Create your CITE 2026 Campus Ambassador account';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f2; margin: 0; padding: 24px; color: #111111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #deded8; overflow: hidden; }
          .header { background: #050505; color: #ffffff; padding: 30px 26px; border-bottom: 4px solid #FCBF04; }
          .eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #FCBF04; font-weight: 700; }
          h1 { margin: 0; font-size: 24px; line-height: 1.15; letter-spacing: -0.03em; text-transform: uppercase; }
          .body { padding: 30px 26px; font-size: 14px; line-height: 1.7; color: #333333; }
          .cta { display: inline-block; margin: 22px 0; padding: 14px 22px; background: #FCBF04; color: #050505; text-decoration: none; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
          .note { margin-top: 18px; padding: 14px; background: #f7f7f4; border-left: 3px solid #FCBF04; font-size: 12px; color: #555555; }
          .footer { padding: 20px 26px; border-top: 1px solid #e6e6e0; font-size: 11px; line-height: 1.6; color: #777777; }
          .link { word-break: break-all; color: #0b57d0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="eyebrow">CITE 2026 · Campus Ambassador</p>
            <h1>You're invited to join the ambassador portal</h1>
          </div>
          <div class="body">
            <p>Hello,</p>
            <p>An administrator has invited <strong>${safeEmail}</strong> to become a CITE 2026 campus ambassador.</p>
            <p>Open the link below to set your password and add your phone number, CNIC, and university. After you submit your details, the organizing team will review your account.</p>
            <p><a class="cta" href="${safeLink}">Create My Account</a></p>
            <p>If the button does not work, copy this link into your browser:</p>
            <p class="link">${safeLink}</p>
            <div class="note">
              This invitation is personal and can be used once. After setup, sign in at ${safeAppUrl}/ambassador with this email and your new password.
            </div>
            <p>If you were not expecting this invitation, you can ignore this message.</p>
          </div>
          <div class="footer">
            COMSATS University Islamabad, Abbottabad Campus<br>
            Department of Computer Science · CITE 2026 Organizing Committee
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    'Hello,',
    '',
    `An administrator has invited ${email} to become a CITE 2026 campus ambassador.`,
    'Open this link to set your password and submit your details (phone, CNIC, university):',
    actionLink,
    '',
    'After setup, sign in with this email and your new password at ' + `${appUrl}/ambassador.`,
    'This invitation is personal and can be used once.',
    '',
    'COMSATS University Islamabad, Abbottabad Campus',
    'Department of Computer Science · CITE 2026 Organizing Committee',
  ].join('\n');

  return { subject, html, text };
}
