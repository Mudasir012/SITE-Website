import { useState, useEffect } from 'react';
import {
  Award,
  Search,
  CheckCircle,
  RefreshCw,
  Trophy,
  Users,
  Copy,
  Check,
  Eye,
  MailPlus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

function StatusBadge({ ambassador }) {
  if (!ambassador.signup_completed_at) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
        Invite sent
      </span>
    );
  }

  if (ambassador.status === 'approved') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Approved
      </span>
    );
  }

  if (ambassador.status === 'rejected') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Rejected
      </span>
    );
  }

  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      Pending approval
    </span>
  );
}

export default function AdminAmbassadors() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [portalMessage, setPortalMessage] = useState('');
  const [portalError, setPortalError] = useState('');
  const [detailAmbassador, setDetailAmbassador] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadAmbassadors = async () => {
    try {
      setLoading(true);
      const list = await adminService.getAmbassadors({ search, status: statusFilter });
      setAmbassadors(list);
    } catch (err) {
      console.error('Error fetching ambassadors from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmbassadors();
  }, [search, statusFilter]);

  const showResult = (message, error = '') => {
    setPortalMessage(message);
    setPortalError(error);
    if (message || error) {
      window.setTimeout(() => {
        setPortalMessage('');
        setPortalError('');
      }, 7000);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    const email = inviteEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showResult('', 'Enter a valid email address.');
      return;
    }

    setInviting(true);
    try {
      const result = await adminService.inviteAmbassador(email);
      showResult(
        result.mock
          ? `Invitation for ${email} was captured by the mock email provider. Check server/.mail-outbox.`
          : `Invitation sent to ${email}.`
      );
      setInviteEmail('');
      loadAmbassadors();
    } catch (err) {
      showResult('', err.message || 'Could not send the invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (ambassador) => {
    setBusyId(ambassador.id);
    try {
      const result = await adminService.inviteAmbassador(ambassador.email);
      showResult(
        result.mock
          ? `Fresh invitation for ${ambassador.email} captured in server/.mail-outbox.`
          : `Fresh invitation sent to ${ambassador.email}.`
      );
      loadAmbassadors();
    } catch (err) {
      showResult('', err.message || 'Could not resend the invitation.');
    } finally {
      setBusyId('');
    }
  };

  const handleUpdateStatus = (id, status, name) => {
    const isReject = status === 'rejected';
    setConfirmModal({
      isOpen: true,
      title: `${isReject ? 'Reject' : 'Approve'} Ambassador`,
      message: `${isReject ? 'Reject' : 'Approve'} the ambassador account for "${name}"? This change is recorded in the audit log.`,
      isDestructive: isReject,
      action: async () => {
        try {
          await adminService.updateAmbassadorStatus(id, status);
          showResult(`Ambassador account ${status}.`);
          setDetailAmbassador(null);
          loadAmbassadors();
        } catch (err) {
          showResult('', err.message || 'Could not update the ambassador account.');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDelete = (ambassador) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Ambassador Account',
      message: `Permanently delete the sign-in account for "${ambassador.full_name || ambassador.email}"? Their profile will be removed from the active list and this action will be written to the audit log.`,
      isDestructive: true,
      action: async () => {
        try {
          await adminService.deleteAmbassadorAccount(ambassador.id);
          showResult(`Account for ${ambassador.email} was deleted.`);
          setDetailAmbassador(null);
          loadAmbassadors();
        } catch (err) {
          showResult('', err.message || 'Could not delete the ambassador account.');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const createdCount = ambassadors.filter((a) => a.signup_completed_at).length;
  const approvedCount = ambassadors.filter((a) => a.status === 'approved').length;
  const pendingCount = ambassadors.filter((a) => a.signup_completed_at && a.status === 'pending').length;
  const totalReferrals = ambassadors.reduce((acc, a) => acc + (a.referral_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-700" />
            <span>Campus Ambassador Network</span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {ambassadors.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite ambassadors by email, review created accounts, and manage access.
          </p>
        </div>

        <button
          onClick={loadAmbassadors}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm self-start md:self-auto"
          title="Refresh Ambassadors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form
        onSubmit={handleInvite}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
            Invite a new ambassador
          </label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="ambassador@example.com"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            We email a one-time setup link. The ambassador chooses a password and submits their
            details; the account then waits for your approval.
          </p>
        </div>
        <button
          type="submit"
          disabled={inviting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors disabled:opacity-60"
        >
          <MailPlus className="w-4 h-4" />
          {inviting ? 'Sending…' : 'Send invitation'}
        </button>
      </form>

      {(portalMessage || portalError) && (
        <div
          className={`border rounded-2xl px-4 py-3 text-xs leading-relaxed ${
            portalError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {portalError || portalMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalReferrals}</div>
            <div className="text-xs text-slate-500 font-medium">Total Referrals</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{createdCount}</div>
            <div className="text-xs text-slate-500 font-medium">Accounts Created</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-medium">Awaiting Approval</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{approvedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Active Ambassadors</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, university, CNIC or referral code..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 shadow-sm"
          />
        </div>

        <div className="w-full sm:w-52">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="invited">Invite sent</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Ambassador</th>
                <th className="py-3 px-4">Campus / University</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-center">Referrals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500 inline mr-2" />
                    Loading ambassadors…
                  </td>
                </tr>
              ) : ambassadors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No ambassador records found. Invite one above.
                  </td>
                </tr>
              ) : (
                ambassadors.map((amb) => (
                  <tr key={amb.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {amb.full_name || 'Account not created yet'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {amb.email} {amb.phone ? `• ${amb.phone}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {amb.university || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                        <span>{amb.referral_code}</span>
                        <button
                          onClick={() => handleCopyCode(amb.referral_code)}
                          className="hover:text-slate-950 transition-colors p-0.5"
                          title="Copy Code"
                        >
                          {copiedCode === amb.referral_code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge ambassador={amb} />
                        {amb.portal_invited_at && (
                          <span className="text-[10px] text-slate-400">
                            Invited {formatDate(amb.portal_invited_at)}
                          </span>
                        )}
                        {amb.signup_completed_at && (
                          <span className="text-[10px] text-slate-400">
                            Signed up {formatDate(amb.signup_completed_at)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                      {amb.referral_count || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => setDetailAmbassador(amb)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors border border-slate-200 inline-flex items-center gap-1"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>

                        {!amb.signup_completed_at && (
                          <button
                            onClick={() => handleResendInvite(amb)}
                            disabled={busyId === amb.id}
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors disabled:opacity-60 inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            {busyId === amb.id ? 'Sending…' : 'Resend'}
                          </button>
                        )}

                        {amb.signup_completed_at && amb.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(amb.id, 'approved', amb.full_name || amb.email)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors border border-emerald-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(amb.id, 'rejected', amb.full_name || amb.email)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors border border-rose-200"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(amb)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-rose-50 text-rose-600 font-semibold transition-colors border border-rose-200 inline-flex items-center gap-1"
                          title="Delete account"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailAmbassador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ambassador details
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {detailAmbassador.full_name || 'Account not created yet'}
                </h3>
              </div>
              <button
                onClick={() => setDetailAmbassador(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                ['Email', detailAmbassador.email],
                ['Phone', formatPhone(detailAmbassador.phone)],
                ['CNIC', formatCnic(detailAmbassador.cnic)],
                ['University', detailAmbassador.university],
                ['Referral code', detailAmbassador.referral_code],
                ['Referrals', detailAmbassador.referral_count || 0],
                ['Account status', detailAmbassador.signup_completed_at ? detailAmbassador.status : 'Invite sent'],
                ['Invited at', formatDate(detailAmbassador.portal_invited_at)],
                ['Signed up at', formatDate(detailAmbassador.signup_completed_at)],
                ['Reviewed at', formatDate(detailAmbassador.reviewed_at)],
                ['Reviewed by', detailAmbassador.reviewed_by || '—'],
                ['Invited by', detailAmbassador.invited_by || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 font-medium text-slate-800 break-words">{value || '—'}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setDetailAmbassador(null)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDelete(detailAmbassador)}
                className="px-3 py-2 text-xs rounded-lg border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
