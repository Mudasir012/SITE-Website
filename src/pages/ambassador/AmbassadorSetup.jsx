import { useEffect, useRef, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { ambassadorService } from '../../lib/supabase.js';
import { AuthAlert, AuthShell, Field } from './AmbassadorAuthShell.jsx';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const inputClass =
  'w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm';

const iconInputClass =
  'w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm';

function isRecoveryLink() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('reset') === '1' ||
    Boolean(params.get('reset_token')) ||
    window.location.hash.includes('type=recovery')
  );
}

function getEmailToken(name) {
  const token = new URLSearchParams(window.location.search).get(name);
  return token && token.trim() ? token.trim() : '';
}

function getInviteToken() {
  return getEmailToken('invite_token');
}

function getResetToken() {
  return getEmailToken('reset_token');
}

function clearEmailTokenFromUrl(name) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;

  url.searchParams.delete(name);
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`
  );
}

function friendlyEmailLinkError(error, { isReset }) {
  const message = error?.message || '';
  if (/expired|invalid|used|already/i.test(message)) {
    return isReset
      ? 'This password reset link is invalid, expired, or was already used. Request a fresh one from the ambassador sign-in page.'
      : 'This invitation link is invalid, expired, or was already used. Ask the CITE admin to send a new invitation.';
  }
  return message || 'Could not open your link. Please try again or request a new one.';
}

function PublicSiteAction({ onBackToSite }) {
  return (
    <button
      type="button"
      onClick={onBackToSite}
      className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 whitespace-nowrap"
    >
      ← Public Site
    </button>
  );
}

function TextAction({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors py-1.5 whitespace-nowrap"
    >
      {children}
    </button>
  );
}

export default function AmbassadorSetup({ onBackToSite, onComplete, onGoToPortal }) {
  const [checking, setChecking] = useState(true);
  const [isReset] = useState(isRecoveryLink);
  const [hasSession, setHasSession] = useState(false);
  const [alreadyCreated, setAlreadyCreated] = useState(false);
  const [emailLinkError, setEmailLinkError] = useState('');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    cnic: '',
    university: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailLinkVerification = useRef(null);

  useEffect(() => {
    let active = true;
    const inviteToken = getInviteToken();
    const resetToken = getResetToken();
    const emailToken = inviteToken || resetToken;
    const emailTokenType = inviteToken ? 'invite' : 'recovery';
    const emailTokenParam = inviteToken ? 'invite_token' : 'reset_token';

    async function checkInvite() {
      try {
        let user = null;

        if (emailToken) {
          // Supabase email tokens are one-time. Share the verification promise
          // so a double-invoked effect cannot consume the token twice.
          if (!emailLinkVerification.current) {
            emailLinkVerification.current =
              emailTokenType === 'invite'
                ? ambassadorService.verifyInviteToken(emailToken)
                : ambassadorService.verifyResetToken(emailToken);
          }

          try {
            user = await emailLinkVerification.current;
          } catch (err) {
            if (active) {
              setEmailLinkError(friendlyEmailLinkError(err, { isReset: emailTokenType === 'recovery' }));
            }
            return;
          }

          if (!user) {
            if (active) {
              setEmailLinkError(
                emailTokenType === 'invite'
                  ? 'This invitation link is invalid. Ask the CITE admin to send a new one.'
                  : 'This password reset link is invalid. Request a fresh one from the ambassador sign-in page.'
              );
            }
            return;
          }

          clearEmailTokenFromUrl(emailTokenParam);
        } else {
          user = await ambassadorService.getCurrentUser();
        }

        if (!active) return;
        if (!user) {
          setHasSession(false);
          return;
        }

        setHasSession(true);
        setEmail(user.email || '');

        if (isReset) return;

        try {
          const account = await ambassadorService.getAccount();
          if (active && account?.signup_completed_at) setAlreadyCreated(true);
        } catch {
          // A fresh invite may not have a linked profile until setup completes.
        }
      } catch {
        if (active) setHasSession(false);
      } finally {
        if (active) setChecking(false);
      }
    }

    checkInvite();
    return () => {
      active = false;
    };
  }, [isReset]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await ambassadorService.updatePassword(form.password);
      await onComplete();
    } catch (err) {
      setError(err.message || 'Could not update your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (digitsOnly(form.phone).length < 11) {
      setError('Enter a valid 11-digit phone number.');
      return;
    }
    if (digitsOnly(form.cnic).length !== 13) {
      setError('Enter a valid 13-digit CNIC.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await ambassadorService.completeSetup({
        fullName: form.fullName.trim(),
        phone: digitsOnly(form.phone),
        cnic: digitsOnly(form.cnic),
        university: form.university.trim(),
        password: form.password,
      });
      await onComplete();
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="admin-theme min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Checking your invitation…
          </span>
        </div>
      </div>
    );
  }

  if (emailLinkError) {
    return (
      <AuthShell
        title={isReset ? 'Password Reset Link Problem' : 'Invitation Link Problem'}
        action={<PublicSiteAction onBackToSite={onBackToSite} />}
      >
        <AuthAlert>{emailLinkError}</AuthAlert>
        <p className="text-xs leading-relaxed text-slate-500">
          {isReset
            ? 'Password reset links are single-use and expire for security. Request a fresh one from the ambassador sign-in page.'
            : 'Invitation links are single-use and expire for security. The CITE admin can send you a fresh invitation from the ambassador list.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGoToPortal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Go to sign in
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
          >
            Public site
          </button>
        </div>
      </AuthShell>
    );
  }

  if (isReset) {
    return (
      <AuthShell
        title="Set New Password"
        action={hasSession ? <TextAction onClick={onGoToPortal}>Back to sign in</TextAction> : undefined}
      >
        {error && <AuthAlert>{error}</AuthAlert>}

        {hasSession ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-xs leading-relaxed text-slate-500">
              Choose a new password for <strong className="text-slate-900">{email}</strong>.
            </p>

            <Field label="New password">
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 6 characters"
                  className={iconInputClass}
                />
              </div>
            </Field>

            <Field label="Confirm new password">
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="Repeat password"
                  className={iconInputClass}
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {loading ? 'Updating password…' : 'Set new password'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <div className="text-center text-xs leading-relaxed text-slate-500">
            <p>This reset link is invalid or has expired. Request a fresh one from the ambassador sign-in page.</p>
            <button
              type="button"
              onClick={onGoToPortal}
              className="mt-5 font-bold text-blue-600 hover:underline"
            >
              Go to sign in
            </button>
          </div>
        )}
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell
        title="Invitation Required"
        action={<PublicSiteAction onBackToSite={onBackToSite} />}
      >
        <p className="text-xs leading-relaxed text-slate-500">
          This page opens only from the invitation link emailed by the CITE admin. If you already
          created your account, sign in from the portal instead.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGoToPortal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Go to sign in
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
          >
            Public site
          </button>
        </div>
      </AuthShell>
    );
  }

  if (alreadyCreated) {
    return (
      <AuthShell
        title="Account Already Created"
        action={<PublicSiteAction onBackToSite={onBackToSite} />}
      >
        <p className="text-xs leading-relaxed text-slate-500">
          Your ambassador account is already set up. Continue to the portal to check your approval
          status.
        </p>
        <button
          type="button"
          onClick={onGoToPortal}
          className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
        >
          Open ambassador portal
          <ArrowRight className="w-4 h-4" />
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      wide
      title="Ambassador Account Setup"
      action={<PublicSiteAction onBackToSite={onBackToSite} />}
    >
      <p className="text-xs leading-relaxed text-slate-500">
        Your invitation is for <strong className="text-slate-900">{email}</strong>. Add your details
        and choose a password. The organizing team will review your account before it becomes active.
      </p>

      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            type="text"
            required
            autoComplete="name"
            value={form.fullName}
            onChange={update('fullName')}
            placeholder="Your full name"
            className={inputClass}
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            required
            inputMode="numeric"
            value={form.phone}
            onChange={update('phone')}
            placeholder="03XX-XXXXXXX"
            className={inputClass}
          />
        </Field>

        <Field label="CNIC">
          <input
            type="text"
            required
            inputMode="numeric"
            value={form.cnic}
            onChange={update('cnic')}
            placeholder="XXXXX-XXXXXXX-X"
            className={inputClass}
          />
        </Field>

        <Field label="University / campus">
          <input
            type="text"
            required
            value={form.university}
            onChange={update('university')}
            placeholder="Your university name"
            className={inputClass}
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              placeholder="At least 6 characters"
              className={iconInputClass}
            />
          </div>
        </Field>

        <Field label="Confirm password">
          <div className="relative">
            <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Repeat password"
              className={iconInputClass}
            />
          </div>
        </Field>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
