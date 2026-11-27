import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Award,
  X
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import { mergeTracks } from '../../lib/tracks';
import ConfirmationModal from './ConfirmationModal';

export default function AdminRegistrations({ initialFilterStatus = 'all' }) {
  const [registrations, setRegistrations] = useState([]);
  const [ambassadors, setAmbassadors] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilterStatus);
  const [eventFilter, setEventFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [internalNote, setInternalNote] = useState('');

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
      const [regData, trackRows, ambassadorList] = await Promise.all([
        adminService.getRegistrations({
          search,
          status: statusFilter,
          eventSlug: eventFilter,
          page,
          limit,
          sortBy,
          sortOrder,
        }),
        adminService.getTrackOverrides(),
        adminService.getAmbassadors(),
      ]);

      setRegistrations(regData.items);
      setTotalPages(regData.totalPages);
      setTotalCount(regData.total);
      setTracks(mergeTracks(trackRows));
      setAmbassadors(ambassadorList);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching registrations from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, eventFilter, sortBy, sortOrder, page, limit]);

  const handleStatusChange = async (id, status, notes = '') => {
    try {
      await adminService.updateRegistrationStatus(id, status, notes);
      await loadData();
      if (activeParticipant && activeParticipant.id === id) {
        setActiveParticipant(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Error updating registration:', err);
      alert('Unable to update this registration. Please try again.');
    }
  };

  const triggerBulkAction = (actionStatus) => {
    if (!selectedIds.length) return;
    setConfirmModal({
      isOpen: true,
      title: `Bulk ${actionStatus.toUpperCase()} Registrations`,
      message: `Set the status of ${selectedIds.length} registration(s) to "${actionStatus}"?`,
      isDestructive: actionStatus === 'rejected',
      action: async () => {
        await adminService.bulkUpdateRegistrations(selectedIds, actionStatus);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  const handleSoftDelete = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move Registration to Trash',
      message: `Are you sure you want to soft-delete the registration for "${name}"? You can restore it anytime from Safety & Trash.`,
      isDestructive: true,
      action: async () => {
        await adminService.softDeleteRegistration(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (activeParticipant) setActiveParticipant(null);
        loadData();
      },
    });
  };

  const handleExportCSV = async () => {
    const allMatching = await adminService.getRegistrations({
      search,
      status: statusFilter,
      eventId: eventFilter,
      page: 1,
      limit: 10000,
      sortBy,
      sortOrder,
    });
    adminService.exportRegistrationsCSV(allMatching.items);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === registrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrations.map(r => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getEventTitle = (reg) => {
    if (!reg) return 'Track Event';
    const track = tracks.find(t => t.slug === reg.event_slug);
    return track ? track.name : (reg.event_name || reg.event_slug || 'Track Event');
  };

  const getReviewerName = (reg) => {
    if (!reg?.ambassador_reviewed_by) return '';
    const amb = ambassadors.find(a => a.id === reg.ambassador_reviewed_by);
    return amb?.full_name || amb?.referral_code || '';
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
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" /> Waitlisted
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Registrations Management</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                {totalCount} Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Filter applicants, inspect details, approve or waitlist participants, and export verified rosters.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, roll..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
            >
              <option value="all">All Application Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
            >
              <option value="all">All Events & Competitions</option>
              {tracks.map((track) => (
                <option key={track.slug} value={track.slug}>{track.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
            >
              <option value="created_at-desc">Registered: Newest First</option>
              <option value="created_at-asc">Registered: Oldest First</option>
              <option value="full_name-asc">Name: A to Z</option>
              <option value="university-asc">University: A to Z</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between animate-fadeIn text-xs shadow-md">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <UserCheck className="w-4 h-4" />
              <span>{selectedIds.length} item(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerBulkAction('approved')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Bulk Approve</span>
              </button>
              <button
                onClick={() => triggerBulkAction('waitlisted')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Bulk Waitlist</span>
              </button>
              <button
                onClick={() => triggerBulkAction('rejected')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Bulk Reject</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={registrations.length > 0 && selectedIds.length === registrations.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Institution & Roll</th>
                <th className="py-3.5 px-4">Track Event</th>
                <th className="py-3.5 px-4">Role / Team</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                      <span>Loading records…</span>
                    </div>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const isSelected = selectedIds.includes(reg.id);
                  return (
                    <tr
                      key={reg.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-slate-100/70' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(reg.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{reg.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{reg.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{reg.university || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{reg.roll_number || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium line-clamp-1 max-w-xs">
                          {getEventTitle(reg)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {reg.is_leader && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              Leader
                            </span>
                          )}
                          <span className="text-slate-500 text-[11px]">
                            {reg.team_id ? 'Team Assigned' : 'Individual'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(reg.status)}
                          {reg.ambassador_reviewed_by && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="truncate max-w-[140px]">
                                Ambassador{getReviewerName(reg) ? `: ${getReviewerName(reg)}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => { setActiveParticipant(reg); setInternalNote(reg.notes || ''); }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {reg.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(reg.id, 'approved')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200"
                              title="Approve"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(reg.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSoftDelete(reg.id, reg.full_name)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {totalCount} records</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {activeParticipant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveParticipant(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{activeParticipant.full_name}</span>
                  {getStatusBadge(activeParticipant.status)}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Registration ID: {activeParticipant.id}
                </p>
              </div>
              <button
                onClick={() => setActiveParticipant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Email</span>
                  <span className="text-slate-900 font-mono font-medium">{activeParticipant.user_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Phone</span>
                  <span className="text-slate-900 font-mono font-medium">{activeParticipant.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">CNIC</span>
                  <span className="text-slate-900 font-mono font-medium">{activeParticipant.cnic || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Institution</span>
                  <span className="text-slate-900 font-semibold">{activeParticipant.university || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Roll Number</span>
                  <span className="text-slate-900 font-mono font-medium">{activeParticipant.roll_number || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Track Event</span>
                  <span className="text-slate-900 font-bold">{getEventTitle(activeParticipant)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Referral Code</span>
                  <span className="text-slate-900 font-mono font-medium">{activeParticipant.referral_code || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px] mb-0.5">Reviewed By</span>
                  <span className="text-slate-900 font-medium">
                    {activeParticipant.ambassador_reviewed_by
                      ? `Ambassador${getReviewerName(activeParticipant) ? ` · ${getReviewerName(activeParticipant)}` : ''}`
                      : activeParticipant.status === 'pending'
                        ? 'Pending review'
                        : 'Admin committee'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Administrative Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add verification remarks, eligibility checks, or interview notes..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-xs shadow-sm transition-all"
                />
              </div>

              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Update Registration Status
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleStatusChange(activeParticipant.id, 'approved', internalNote)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(activeParticipant.id, 'waitlisted', internalNote)}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Waitlist</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(activeParticipant.id, 'rejected', internalNote)}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                onClick={() => handleSoftDelete(activeParticipant.id, activeParticipant.full_name)}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
              <button
                onClick={() => setActiveParticipant(null)}
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
