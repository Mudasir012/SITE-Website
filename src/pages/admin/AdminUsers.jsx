import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Trash2,
  User,
  Shield,
  Key,
  RefreshCw,
  Info,
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

export default function AdminUsers({ currentAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const list = await adminService.getAdmins();
      setAdmins(list);
    } catch (err) {
      console.error('Error fetching admins from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleRemoveAdmin = (adminId, email) => {
    if (email === currentAdmin?.email) {
      alert('You cannot revoke your own admin account.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Revoke Admin Privileges',
      message: `Revoke admin access for "${email}"? They will lose access to the portal immediately. Their sign-in credentials remain unchanged.`,
      isDestructive: true,
      action: async () => {
        await adminService.removeAdmin(adminId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadAdmins();
      },
    });
  };

  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-slate-700" />
          <span>Admin Users &amp; Access Control</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review administrator roles and manage portal access.
        </p>
      </div>

      {/* How to add admins */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-900 mb-0.5">Adding a new administrator</div>
          <p className="leading-relaxed">
            New administrator accounts are provisioned by the organizing committee. Contact the CITE &apos;26 technical team to request access for a team member.
          </p>
        </div>
      </div>

      {/* Role Matrix Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-700" />
          <span>Role Permissions Matrix</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Super Admin
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                Full Authorization
              </span>
            </div>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Manage and revoke administrator accounts</li>
              <li>Configure event capacities &amp; deadlines</li>
              <li>Broadcast mass announcements to participants</li>
              <li>Restore or permanently delete archived records</li>
              <li>Approve, reject, and export all registrations</li>
            </ul>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" /> Event Admin
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                Operational Staff
              </span>
            </div>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Review participant applications &amp; waitlist</li>
              <li>Verify student IDs and teams</li>
              <li>View campus ambassadors &amp; referral counts</li>
              <li>Export CSV rosters for on-desk check-in</li>
              <li>View dashboard statistics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-700" />
            <span>Authorized Administrator Accounts</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">{admins.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Added By</th>
                <th className="py-3 px-4">Account Created</th>
                {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500 inline mr-2" />
                    <span>Loading admin accounts…</span>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((adm) => {
                  const isCurrent = adm.email === currentAdmin?.email;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{adm.full_name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold border border-slate-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{adm.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {adm.role === 'super_admin' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-600" /> Super Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-600" /> Event Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {adm.invited_by || 'System'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) : 'N/A'}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          {!isCurrent && (
                            <button
                              onClick={() => handleRemoveAdmin(adm.id, adm.email)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Revoke Admin Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
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
