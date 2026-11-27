const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length > 3 && email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function validateEmailContent({ to, subject, html, text }) {
  const errors = [];

  if (!isValidEmail(to)) errors.push('A valid recipient email is required.');
  if (!subject || !String(subject).trim()) errors.push('Subject is required.');
  if (String(subject || '').length > 200) errors.push('Subject must be 200 characters or fewer.');
  if (!html && !text) errors.push('Email HTML or text content is required.');
  if (String(html || '').length > 250000) errors.push('Email HTML is too large.');
  if (String(text || '').length > 250000) errors.push('Email text is too large.');

  return errors;
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}
