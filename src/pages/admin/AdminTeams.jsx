import { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  UserMinus,
  Crown,
  Layers,
  X
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  const [activeTeam, setActiveTeam] = useState(null);

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
      const [teamList, eventList] = await Promise.all([
        adminService.getTeams({
          search,
          status: statusFilter,
          eventId: eventFilter,
        }),
        adminService.getEvents(),
      ]);
      setTeams(teamList);
      setEvents(eventList);

      if (activeTeam) {
        const refreshed = teamList.find(t => t.id === activeTeam.id);
        setActiveTeam(refreshed || null);
      }
    } catch (err) {
      console.error('Error fetching teams from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, eventFilter]);

  const handleUpdateStatus = (teamId, status, teamName) => {
    const isDisqualify = status === 'disqualified';
    setConfirmModal({
      isOpen: true,
      title: isDisqualify ? `Disqualify Team "${teamName}"` : `Approve Team "${teamName}"`,
      message: isDisqualify
        ? `Are you sure you want to disqualify this team? Associated member registrations will be set to rejected.`
        : `Approve this team and confirm member participation?`,
      isDestructive: isDisqualify,
      action: async () => {
        await adminService.updateTeamStatus(teamId, status);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  const handleRemoveMember = (teamId, memberId, memberName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Remove "${memberName}" from this team? Their registration remains active individually.`,
      isDestructive: true,
      action: async () => {
        await adminService.removeTeamMember(teamId, memberId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  const handleSoftDeleteTeam = (teamId, teamName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move Team to Trash',
      message: `Move team "${teamName}" to trash?`,
      isDestructive: true,
      action: async () => {
        await adminService.softDeleteTeam(teamId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (activeTeam && activeTeam.id === teamId) setActiveTeam(null);
        loadData();
      },
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
      case 'disqualified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Disqualified
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-700" />
              <span>Teams Management</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                {teams.length} Teams
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify student rosters, appoint team leaders, approve eligibility, or resolve member disputes.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm self-start md:self-auto"
            title="Refresh Teams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team name or leader email..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
            >
              <option value="all">All Team Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>

          <div>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
            >
              <option value="all">All Events</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-500 mx-auto mb-2" />
            <span>Loading teams from database...</span>
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            No teams registered in database.
          </div>
        ) : (
          teams.map((tm) => (
            <div
              key={tm.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-700" />
                    <span>{tm.name}</span>
                  </h3>
                  {getStatusBadge(tm.status)}
                </div>

                <div className="text-xs text-slate-500 space-y-1.5 my-3">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tm.eventTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">{tm.leader_email}</span>
                  </div>
                </div>

                {/* Member Preview */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold mb-2">
                    <span>Enrolled Roster: {tm.memberCount} member(s)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tm.members.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No members assigned yet</span>
                    ) : (
                      tm.members.map((m) => (
                        <span
                          key={m.id}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                            m.is_leader
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {m.full_name} {m.is_leader && '★'}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                <button
                  onClick={() => setActiveTeam(tm)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Roster Details</span>
                </button>

                <div className="flex items-center gap-1">
                  {tm.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(tm.id, 'approved', tm.name)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                      title="Approve Team"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {tm.status !== 'disqualified' && (
                    <button
                      onClick={() => handleUpdateStatus(tm.id, 'disqualified', tm.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                      title="Disqualify Team"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSoftDeleteTeam(tm.id, tm.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Soft Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Team Details Modal */}
      {activeTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveTeam(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-700" />
                  <span>Team: {activeTeam.name}</span>
                  {getStatusBadge(activeTeam.status)}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Track: {activeTeam.eventTitle} • ID: {activeTeam.id}
                </p>
              </div>
              <button
                onClick={() => setActiveTeam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Enrolled Members ({activeTeam.members.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">Leader: {activeTeam.leader_email}</span>
                </h4>

                <div className="space-y-2">
                  {activeTeam.members.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                      No members assigned to this team.
                    </div>
                  ) : (
                    activeTeam.members.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.is_leader ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                            {m.is_leader ? <Crown className="w-4 h-4 text-amber-700" /> : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{m.full_name}</span>
                              {m.is_leader && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                  Leader
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {m.user_email} • {m.phone} • {m.university} ({m.roll_number})
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(activeTeam.id, m.id, m.full_name)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Team Approval Decision
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleUpdateStatus(activeTeam.id, 'approved', activeTeam.name)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Team</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeTeam.id, 'disqualified', activeTeam.name)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Disqualify Team</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                onClick={() => handleSoftDeleteTeam(activeTeam.id, activeTeam.name)}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
              <button
                onClick={() => setActiveTeam(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Done
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
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
