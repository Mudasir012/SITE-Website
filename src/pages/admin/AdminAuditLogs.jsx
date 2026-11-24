import { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

export default function AdminAuditLogs() {
  const [subTab, setSubTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logList, deletedList] = await Promise.all([
        adminService.getAuditLogs({ limit: 100, entityType: entityFilter }),
        adminService.getTrashItems(),
      ]);
      setLogs(logList);
      setTrashItems(deletedList);
    } catch (err) {
      console.error('Error fetching audit logs from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityFilter]);

  const handleRestore = (itemType, id, title) => {
    setConfirmModal({
      isOpen: true,
      title: `Restore ${itemType.toUpperCase()}`,
      message: `Restore "${title}" to active records?`,
      action: async () => {
        await adminService.restoreItem(itemType, id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-700" />
            <span>Safety, Audit & Soft-Delete Trash</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs of all administrative decisions, plus non-destructive recovery trash bin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setSubTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                subTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Trail ({logs.length})
            </button>
            <button
              onClick={() => setSubTab('trash')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                subTab === 'trash' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trash & Recovery ({trashItems.length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {subTab === 'logs' ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-bold uppercase tracking-wider">Filter Entity:</span>
            </div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-900 shadow-sm font-medium capitalize"
            >
              <option value="all">All Entity Actions</option>
              <option value="registration">Registrations</option>
              <option value="team">Teams</option>
              <option value="event">Events</option>
              <option value="admin">Admin Accounts</option>
              <option value="announcement">Announcements</option>
              <option value="ambassador">Ambassadors</option>
              <option value="auth">Authentication</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator (Actor)</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Payload Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-500 inline mr-2" />
                        <span>Loading audit logs…</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No audit events recorded for this entity type.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-mono font-medium">
                          {log.actor_email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {log.entity_type} {log.entity_id ? `(#${String(log.entity_id).slice(-6)})` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-sm truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Soft-Deleted Records</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Items moved to trash retain their relationships and can be restored at any time.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
              {trashItems.length} Trash Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item Type</th>
                  <th className="py-2.5 px-3">Item Identifier / Title</th>
                  <th className="py-2.5 px-3">Deleted At</th>
                  <th className="py-2.5 px-3 text-right">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      The trash bin is currently empty.
                    </td>
                  </tr>
                ) : (
                  trashItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          {item.item_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.title}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(item.deleted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRestore(item.item_type, item.id, item.title)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors inline-flex items-center gap-1 font-bold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
