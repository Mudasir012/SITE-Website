import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Clock, LogOut, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { ambassadorService, supabase } from '../../lib/supabase.js';
import AmbassadorDashboard from './AmbassadorDashboard.jsx';
import AmbassadorSignIn from './AmbassadorSignIn.jsx';
import { AuthShell } from './AmbassadorAuthShell.jsx';

function friendlyPortalError(error) {
  const message = error?.message || '';

  if (/could not find the function|does not exist|schema cache/i.test(message)) {
    return 'The ambassador portal database setup is not applied yet. Run the ambassador SQL migrations in the Supabase SQL Editor.';
  }

  if (/no ambassador account|not linked|no invitation|invitation is waiting/i.test(message)) {
    return 'This email is not linked to an ambassador account. Ask the admin to send you an invitation.';
  }

  return message || 'Could not load the ambassador portal. Please try again.';
}

const toneStyles = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

function StatusScreen({ icon: Icon, title, tone = 'info', children, onLogout, onBackToSite, onGoToSetup }) {
  return (
    <AuthShell
      title={title}
      action={
        <button
          type="button"
          onClick={onBackToSite}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 whitespace-nowrap"
        >
          ← Public Site
        </button>
      }
    >
      <div className={`mb-5 p-3.5 rounded-xl border flex items-start gap-3 ${toneStyles[tone]}`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs leading-relaxed">{children}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onGoToSetup && (
          <button
            type="button"
            onClick={onGoToSetup}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Finish setup
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </AuthShell>
  );
}

export default function AmbassadorPortal({ onBackToSite, onNavigate }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const goToSetup = () => {
    if (onNavigate) onNavigate('ambassadorSetup', '/ambassador/setup');
    else window.location.assign('/ambassador/setup');
  };

  const loadAccount = useCallback(async (currentUser) => {
    if (!currentUser) {
      setAccount(null);
      setDashboard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ownAccount = await ambassadorService.getAccount();
      if (!ownAccount) {
        throw new Error('This email is not linked to an ambassador account.');
      }
      setAccount(ownAccount);

      if (ownAccount.status === 'approved') {
        const stats = await ambassadorService.getDashboard();
        setDashboard(stats);
      } else {
        setDashboard(null);
      }
    } catch (err) {
      setAccount(null);
      setDashboard(null);
      setError(friendlyPortalError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const current = await ambassadorService.getCurrentUser();
      setUser(current || null);
      await loadAccount(current);
    } catch (err) {
      setError(friendlyPortalError(err));
      setLoading(false);
    }
  }, [loadAccount]);

  useEffect(() => {
    bootstrap();

    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setAccount(null);
        setDashboard(null);
        setLoading(false);
        return;
      }

      setUser(session.user);
      loadAccount(session.user);
    });

    return () => subscription?.unsubscribe();
  }, [bootstrap, loadAccount]);

  const handleSignedIn = async (signedInUser) => {
    setUser(signedInUser);
    await loadAccount(signedInUser);
  };

  const handleLogout = async () => {
    await ambassadorService.logout();
    setUser(null);
    setAccount(null);
    setDashboard(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="admin-theme min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Checking ambassador session…
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AmbassadorSignIn onBackToSite={onBackToSite} onSignedIn={handleSignedIn} />;
  }

  if (!account) {
    return (
      <StatusScreen
        icon={ShieldAlert}
        tone="danger"
        title="Portal access unavailable"
        onLogout={handleLogout}
        onBackToSite={onBackToSite}
      >
        {error || 'Your account is not linked to an approved ambassador application.'}
      </StatusScreen>
    );
  }

  if (account.status === 'invited') {
    return (
      <StatusScreen
        icon={ShieldCheck}
        tone="info"
        title="Finish your account setup"
        onLogout={handleLogout}
        onBackToSite={onBackToSite}
        onGoToSetup={goToSetup}
      >
        Your invitation is ready. Open the setup page to choose a password and submit your details.
      </StatusScreen>
    );
  }

  if (account.status === 'pending') {
    return (
      <StatusScreen
        icon={Clock}
        tone="warning"
        title="Awaiting admin approval"
        onLogout={handleLogout}
        onBackToSite={onBackToSite}
      >
        Your account <strong className="text-slate-900">{account.email}</strong> was created
        successfully. The organizing team will review it shortly. Your dashboard unlocks once you
        are approved.
      </StatusScreen>
    );
  }

  if (account.status === 'rejected') {
    return (
      <StatusScreen
        icon={XCircle}
        tone="danger"
        title="Account not approved"
        onLogout={handleLogout}
        onBackToSite={onBackToSite}
      >
        Your ambassador account was not approved. Contact the CITE team if you believe this is a
        mistake.
      </StatusScreen>
    );
  }

  if (!dashboard) {
    return (
      <StatusScreen
        icon={ShieldAlert}
        tone="warning"
        title="Dashboard unavailable"
        onLogout={handleLogout}
        onBackToSite={onBackToSite}
      >
        {error || 'Your approved dashboard could not be loaded. Please try again.'}
      </StatusScreen>
    );
  }

  return (
    <AmbassadorDashboard
      profile={{ ...dashboard, full_name: account.full_name || dashboard.full_name }}
      onLogout={handleLogout}
      onBackToSite={onBackToSite}
    />
  );
}
