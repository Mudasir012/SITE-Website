import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react';
import { publicService } from '../lib/supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY_FORM = { fullName: '', email: '', phone: '', cnic: '', referralCode: '' };

const formatCnic = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('92')) digits = `0${digits.slice(2)}`;
  digits = digits.slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const validate = (values) => {
  const errors = {};
  const name = values.fullName.trim();

  if (name.length < 3) errors.fullName = 'Enter your full name (at least 3 characters).';
  else if (/\d/.test(name)) errors.fullName = 'Name cannot contain numbers.';

  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';

  if (values.cnic.replace(/\D/g, '').length !== 13) {
    errors.cnic = 'CNIC must be 13 digits (XXXXX-XXXXXXX-X).';
  }

  if (!/^03\d{9}$/.test(values.phone.replace(/\D/g, ''))) {
    errors.phone = 'Enter a valid mobile number (03XX-XXXXXXX).';
  }

  return errors;
};

const inputClass = (hasError) =>
  `w-full border bg-arcade-ink px-3.5 py-3 font-display text-sm text-arcade-bone placeholder:text-arcade-mute/60 transition-colors focus:outline-none ${
    hasError
      ? 'border-red-500/70 focus:border-red-400'
      : 'border-white/15 focus:border-arcade-lime'
  }`;

function Field({ id, label, icon: Icon, error, hint, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-mute"
      >
        <Icon className="h-3 w-3 text-arcade-lime" aria-hidden="true" />
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold text-red-400">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-arcade-mute">{hint}</p>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-arcade-mute">{label}</dt>
      <dd className={`text-right text-sm font-semibold text-arcade-bone ${mono ? 'font-mono text-xs tracking-[0.08em]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export default function RegistrationModal({ open, event, onClose }) {
  const reduced = useReducedMotion();
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [ambassadors, setAmbassadors] = useState([]);
  const [ambassadorsLoading, setAmbassadorsLoading] = useState(false);

  const isTrackA = event?.code === 'A';
  const accentBlock = isTrackA ? 'bg-arcade-violet' : 'bg-arcade-limeHot';
  const accentText = isTrackA ? 'text-arcade-violet' : 'text-arcade-limeHot';

  const selectedAmbassador = useMemo(
    () => ambassadors.find((a) => a.referral_code === form.referralCode) || null,
    [ambassadors, form.referralCode]
  );

  // Reset the form and load approved ambassadors every time the dialog opens.
  useEffect(() => {
    if (!open) return undefined;

    setForm(EMPTY_FORM);
    setErrors({});
    setStatus('idle');
    setServerError('');
    setRegistrationId('');
    setAmbassadors([]);
    setAmbassadorsLoading(true);

    let cancelled = false;
    publicService
      .getAmbassadors()
      .then((list) => {
        if (!cancelled) setAmbassadors(list);
      })
      .catch((err) => {
        console.warn('Could not load ambassadors:', err);
        if (!cancelled) setAmbassadors([]);
      })
      .finally(() => {
        if (!cancelled) setAmbassadorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Lock page scroll, close on Escape, and restore focus on close.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  const handlePanelKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = panelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const clearFieldError = (key) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const updateField = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const updateFormattedField = (key, formatter) => (e) => {
    const value = formatter(e.target.value);
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`reg-${firstKey}`)?.focus();
      return;
    }

    setStatus('submitting');
    setServerError('');

    try {
      const id = await publicService.registerForEvent({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        cnic: form.cnic,
        referralCode: form.referralCode || null,
        eventSlug: event.slug,
        eventName: event.name,
      });
      setRegistrationId(id || '');
      setStatus('success');
    } catch (err) {
      console.error('Registration failed:', err);
      const message = String(err?.message || '');
      setStatus('idle');

      if (/could not find the function|schema cache|does not exist|permission denied/i.test(message)) {
        setServerError(
          'Online registration is being set up right now. Please try again shortly or email cite@cuiatd.edu.pk.'
        );
      } else if (/already registered/i.test(message)) {
        setServerError(message);
      } else if (/valid|full name|missing/i.test(message)) {
        setServerError(message);
      } else {
        setServerError('We could not submit your registration. Please check your connection and try again.');
      }

      panelRef.current?.parentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {open && event && (
        <motion.div
          key="registration-overlay"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-arcade-ink/85 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-title"
            onKeyDown={handlePanelKeyDown}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative my-auto w-full max-w-lg overflow-hidden border border-white/15 bg-arcade-coal shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
          >
            <div aria-hidden="true" className={`h-[3px] w-full ${accentBlock}`} />

            {status === 'success' ? (
              <div className="px-5 py-8 sm:px-8">
                <div className="mx-auto grid h-14 w-14 place-items-center bg-arcade-lime text-arcade-ink">
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </div>

                <h2
                  id="registration-title"
                  className="mt-5 text-center font-display text-2xl font-bold uppercase tracking-[-0.04em] text-arcade-bone"
                >
                  Registration received
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-center font-display text-sm leading-relaxed text-arcade-mute">
                  You are on the list for{' '}
                  <strong className="text-arcade-bone">{event.name}</strong>.{' '}
                  {selectedAmbassador ? (
                    <>
                      <strong className="text-arcade-bone">{selectedAmbassador.full_name}</strong>{' '}
                      will review your entry and confirm your seat. We will contact you at{' '}
                      <span className="text-arcade-bone">{form.email.trim()}</span>.
                    </>
                  ) : (
                    <>
                      The CITE committee will review your entry and contact you at{' '}
                      <span className="text-arcade-bone">{form.email.trim()}</span>.
                    </>
                  )}
                </p>

                <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                  {registrationId && (
                    <SummaryRow
                      label="Reference"
                      value={registrationId.slice(0, 8).toUpperCase()}
                      mono
                    />
                  )}
                  <SummaryRow label="Event" value={event.name} />
                  <SummaryRow label="Status" value="Pending review" />
                  {selectedAmbassador && (
                    <SummaryRow label="Ambassador" value={selectedAmbassador.full_name} />
                  )}
                </dl>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex w-full items-center justify-center bg-arcade-lime px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${accentText}`}>
                      Event registration
                    </p>
                    <h2
                      id="registration-title"
                      className="mt-1 font-display text-2xl font-bold uppercase leading-[1.02] tracking-[-0.04em] text-arcade-bone"
                    >
                      {event.name}
                    </h2>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-arcade-mute">
                      {event.eventCode} · {event.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close registration form"
                    className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-arcade-mute transition-colors hover:border-arcade-lime hover:text-arcade-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-lime"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-5 py-6 sm:px-7">
                  <p className="font-display text-sm leading-relaxed text-arcade-mute">
                    Enter your details to reserve a spot. Fields marked{' '}
                    <span className="text-arcade-lime">*</span> are required.
                  </p>

                  {serverError && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2 border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-xs font-semibold leading-relaxed text-red-300"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        id="reg-fullName"
                        label="Full name *"
                        icon={User}
                        error={errors.fullName}
                      >
                        <input
                          ref={firstFieldRef}
                          id="reg-fullName"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          value={form.fullName}
                          onChange={updateField('fullName')}
                          placeholder="e.g. Ayesha Khan"
                          aria-invalid={Boolean(errors.fullName)}
                          aria-describedby={errors.fullName ? 'reg-fullName-error' : undefined}
                          className={inputClass(Boolean(errors.fullName))}
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field
                        id="reg-email"
                        label="Email address *"
                        icon={Mail}
                        error={errors.email}
                      >
                        <input
                          id="reg-email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={updateField('email')}
                          placeholder="you@example.com"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'reg-email-error' : undefined}
                          className={inputClass(Boolean(errors.email))}
                        />
                      </Field>
                    </div>

                    <Field
                      id="reg-cnic"
                      label="CNIC number *"
                      icon={CreditCard}
                      error={errors.cnic}
                    >
                      <input
                        id="reg-cnic"
                        name="cnic"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={form.cnic}
                        onChange={updateFormattedField('cnic', formatCnic)}
                        placeholder="12345-1234567-1"
                        maxLength={15}
                        aria-invalid={Boolean(errors.cnic)}
                        aria-describedby={errors.cnic ? 'reg-cnic-error' : undefined}
                        className={`${inputClass(Boolean(errors.cnic))} font-mono tabular-nums`}
                      />
                    </Field>

                    <Field
                      id="reg-phone"
                      label="Contact number *"
                      icon={Phone}
                      error={errors.phone}
                    >
                      <input
                        id="reg-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={updateFormattedField('phone', formatPhone)}
                        placeholder="0300-1234567"
                        maxLength={12}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'reg-phone-error' : undefined}
                        className={`${inputClass(Boolean(errors.phone))} font-mono tabular-nums`}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field
                        id="reg-referralCode"
                        label="Select your ambassador"
                        icon={Award}
                        hint={
                          ambassadors.length === 0 && !ambassadorsLoading
                            ? 'No approved ambassadors are listed yet — you can still register directly.'
                            : 'Optional. Choose the campus ambassador who referred you, if any.'
                        }
                      >
                        <select
                          id="reg-referralCode"
                          name="referralCode"
                          value={form.referralCode}
                          onChange={updateField('referralCode')}
                          disabled={ambassadorsLoading}
                          style={{ colorScheme: 'dark' }}
                          className={inputClass(false)}
                        >
                          <option value="">
                            {ambassadorsLoading
                              ? 'Loading ambassadors…'
                              : 'No ambassador — direct registration'}
                          </option>
                          {ambassadors.map((ambassador) => (
                            <option key={ambassador.id} value={ambassador.referral_code}>
                              {ambassador.full_name}
                              {ambassador.university ? ` — ${ambassador.university}` : ''} (
                              {ambassador.referral_code})
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group mt-6 inline-flex w-full items-center justify-center gap-2 bg-arcade-lime px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-arcade-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-bone focus-visible:ring-offset-2 focus-visible:ring-offset-arcade-coal disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Register Now
                        <ArrowUpRight
                          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-relaxed text-arcade-mute">
                    Your details are shared only with the CITE organizing committee.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
