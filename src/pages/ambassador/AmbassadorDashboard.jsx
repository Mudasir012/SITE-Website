import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { events } from '../../data/tracks.js';
import { ambassadorService } from '../../lib/supabase.js';

const formatCnic = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 13) return value || '—';
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 11) return value || '—';
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusStyles = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  waitlisted: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AmbassadorDashboard({ profile, onLogout, onBackToSite }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copied, setCopied] = useState('');
  const [eventSlug, setEventSlug] = useState(events[0]?.slug || '');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const loadReferrals = async () => {
    try {
      setLoading(true);
      setError('');
      setReferrals(await ambassadorService.getReferrals());
    } catch (err) {
      setError(err.message || 'Could not load your referrals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return referrals.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!term) return true;
      return [row.full_name, row.user_email, row.phone, row.cnic, row.event_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [referrals, search, statusFilter]);

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  const handleReview = async (row, decision) => {
    if (busyId) return;

    setBusyId(row.id);
    setNotice('');
    setActionError('');

    try {
      const result = await ambassadorService.reviewReferral(row.id, decision);
      const finalStatus = result?.status || decision;

      setReferrals((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: finalStatus,
                ambassador_reviewed_at: result?.ambassador_reviewed_at || new Date().toISOString(),
              }
            : item
        )
      );

      if (finalStatus === 'waitlisted') {
        setNotice(
          `${row.full_name} was approved, but the event is full so they were moved to the waitlist.`
        );
      } else if (finalStatus === 'approved') {
        setNotice(`${row.full_name} is approved and now counted as a participant.`);
      } else {
        setNotice(`${row.full_name} was rejected.`);
      }
    } catch (err) {
      setActionError(err.message || 'Could not save your review. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  const pendingCount = referrals.filter((row) => row.status === 'pending').length;

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const selectedEvent = events.find((item) => item.slug === eventSlug) || events[0];
  const eventLink = selectedEvent
    ? `${window.location.origin}${basePath}/tracks/${selectedEvent.slug}`
    : `${window.location.origin}${basePath}/tracks`;

  const statCards = [
    {
      label: 'Total referrals',
      value: profile.total_referrals ?? 0,
      note: 'All registrations linked to you',
      icon: Users,
      accent: 'text-slate-700',
    },
    {
      label: 'Approved',
      value: referrals.length > 0 ? referrals.filter((r) => r.status === 'approved').length : profile.approved_referrals ?? 0,
      note: 'Confirmed participants',
      icon: CheckCircle2,
      accent: 'text-emerald-600',
    },
    {
      label: 'Pending review',
      value: referrals.length > 0 ? referrals.filter((r) => r.status === 'pending').length : profile.pending_referrals ?? 0,
      note: 'Waiting for your decision',
      icon: RefreshCw,
      accent: 'text-amber-600',
    },
    {
      label: 'Leaderboard rank',
      value: profile.rank_position ? `#${profile.rank_position}` : '—',
      note: 'Across all ambassadors',
      icon: Trophy,
      accent: 'text-blue-600',
    },
  ];

  return (
    <div className="admin-theme min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/CUI%20Logo.png"
              alt="COMSATS University Islamabad"
              className="h-9 w-9 object-contain"
            />
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>CITE Ambassador Portal</span>
                <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400 font-mono font-semibold border-l border-slate-200 pl-2">
                  CITE &apos;26
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Department of Computer Science • CUI Abbottabad
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {profile.full_name?.charAt(0) || 'A'}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                {profile.full_name || 'Ambassador'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                Campus Ambassador
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToSite}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
            title="Return to public website"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Public Site</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
            title="Sign out of portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Ambassador Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {profile.full_name} · {profile.university || 'CUI Abbottabad'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{profile.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Approved ambassador
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, note, icon: Icon, accent }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </span>
                  <Icon className={`w-4 h-4 ${accent}`} aria-hidden="true" />
                </div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">{value}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">{note}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-slate-700" />
                  Your referral tools
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Participants select your name from the campus ambassador dropdown when they
                  register. Share your code or an event page to start tracking sign-ups.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 min-w-0 flex-1 sm:flex-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    Code
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 truncate">
                    {profile.referral_code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copy(profile.referral_code, 'code')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors whitespace-nowrap"
                >
                  {copied === 'code' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {copied === 'code' ? 'Copied' : 'Copy code'}
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Share an event page</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a track, then copy its registration link.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <select
                  value={eventSlug}
                  onChange={(event) => setEventSlug(event.target.value)}
                  className="min-w-0 flex-1 md:w-64 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm"
                  aria-label="Event to share"
                >
                  {events.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => copy(eventLink, 'link')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition-all whitespace-nowrap"
                >
                  {copied === 'link' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied === 'link' ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-700" />
                  Referred participants
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Registrations that selected you as their campus ambassador. Approve a referral to
                  confirm them as a participant, or reject it to decline.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-56 sm:flex-none">
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search participants…"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  type="button"
                  onClick={loadReferrals}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
                  aria-label="Refresh referrals"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                {error}
              </div>
            )}

            {notice && (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs leading-relaxed">
                {notice}
              </div>
            )}

            {actionError && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                {actionError}
              </div>
            )}

            {pendingCount > 0 && (
              <div className="mt-5 flex items-start gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>{pendingCount}</strong> referral{pendingCount === 1 ? '' : 's'} waiting
                  for your review.
                </span>
              </div>
            )}

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1020px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">CNIC</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Registered</th>
                    <th className="py-2.5 px-3 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin" />
                        Loading referrals…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {referrals.length === 0
                          ? 'No referrals yet. Share an event page to get started.'
                          : 'No referrals match this search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{row.full_name}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                            {row.user_email}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {formatPhone(row.phone)}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {formatCnic(row.cnic)}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {row.event_name || row.event_slug || 'CITE 2026'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                              statusStyles[row.status] || statusStyles.waitlisted
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {row.status === 'pending' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReview(row, 'approved')}
                                disabled={Boolean(busyId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                title={`Approve ${row.full_name}`}
                              >
                                {busyId === row.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                )}
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(row, 'rejected')}
                                disabled={Boolean(busyId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                title={`Reject ${row.full_name}`}
                              >
                                <XCircle className="h-3 w-3" aria-hidden="true" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {row.ambassador_reviewed_at ? 'Reviewed by you' : 'Admin reviewed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 font-medium">
              Showing {filtered.length} of {referrals.length} referrals · participant details are
              visible only to you
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href={`${basePath}/tracks`}
              className="text-xs text-slate-900 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              Browse all event pages
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
