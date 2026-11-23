import { useState, useEffect } from 'react';
import {
  Award,
  Search,
  CheckCircle,
  RefreshCw,
  Trophy,
  Users,
  Copy,
  Check
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

export default function AdminAmbassadors() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');

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
      const list = await adminService.getAmbassadors({
        search,
        status: statusFilter,
      });
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

  const handleUpdateStatus = (id, status, name) => {
    const isReject = status === 'rejected';
    setConfirmModal({
      isOpen: true,
      title: `${isReject ? 'Reject' : 'Approve'} Ambassador`,
      message: `Set ambassador application for "${name}" to ${status.toUpperCase()}?`,
      isDestructive: isReject,
      action: async () => {
        await adminService.updateAmbassadorStatus(id, status);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadAmbassadors();
      },
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const totalReferrals = ambassadors.reduce((acc, a) => acc + (a.referral_count || 0), 0);
  const approvedCount = ambassadors.filter(a => a.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-700" />
            <span>Campus Ambassador Network</span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {ambassadors.length} Applicants
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate ambassador applications, track referral code engagement, and reward campus growth leads.
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

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalReferrals}</div>
            <div className="text-xs text-slate-500 font-medium">Total Student Referrals</div>
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

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {ambassadors.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Pending Applications</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ambassador name, email, university or referral code..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 shadow-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium capitalize"
          >
            <option value="all">All Application Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Ambassador</th>
                <th className="py-3 px-4">Campus / University</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4 text-center">Referrals Tracked</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500 inline mr-2" />
                    <span>Loading ambassadors from database...</span>
                  </td>
                </tr>
              ) : ambassadors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No ambassador applications found.
                  </td>
                </tr>
              ) : (
                ambassadors.map((amb, index) => (
                  <tr key={amb.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{amb.full_name}</span>
                        {index === 0 && amb.referral_count > 0 && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-200">
                            #1 Top Lead
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {amb.email} • {amb.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {amb.university}
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
                    <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                      {amb.referral_count}
                    </td>
                    <td className="py-3.5 px-4">
                      {amb.status === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      ) : amb.status === 'rejected' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {amb.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(amb.id, 'approved', amb.full_name)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors border border-emerald-200"
                          >
                            Approve
                          </button>
                        )}
                        {amb.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(amb.id, 'rejected', amb.full_name)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors border border-rose-200"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
