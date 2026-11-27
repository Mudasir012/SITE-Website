import { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail, RefreshCw } from 'lucide-react';
import { ambassadorService } from '../../lib/supabase.js';
import { AuthAlert, AuthShell, Field } from './AmbassadorAuthShell.jsx';

export default function AmbassadorSignIn({ onBackToSite, onSignedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetState = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetState();
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await ambassadorService.signIn(email, password);
        await onSignedIn(user);
      } else {
        await ambassadorService.requestPasswordReset(email);
        setMessage('Password reset link sent. Check your inbox to choose a new password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={mode === 'forgot' ? 'Reset Password' : 'Ambassador Portal Login'}
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
      {error && <AuthAlert>{error}</AuthAlert>}
      {message && <AuthAlert type="success">{message}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Ambassador Email">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ambassador@comsats.edu.pk"
              className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm"
            />
          </div>
        </Field>

        {mode === 'login' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  resetState();
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : mode === 'login' ? (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Send Password Reset Link</span>
              <KeyRound className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {mode === 'forgot' && (
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetState();
            }}
            className="font-bold text-slate-900 hover:underline"
          >
            ← Back to Sign In
          </button>
        </div>
      )}
    </AuthShell>
  );
}
