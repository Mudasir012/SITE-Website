import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Layers,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Software Development',
    venue: 'COMSATS Abbottabad',
    description: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    capacity: 100,
    min_team_size: 1,
    max_team_size: 4,
    rules: '',
    registration_open: true,
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setRegistrationOpen(await adminService.getRegistrationOpen());
    } catch (err) {
      console.error('Error fetching registration settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadSettings();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      category: 'Software Development',
      venue: 'CS Complex, COMSATS Abbottabad',
      description: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      capacity: 100,
      min_team_size: 1,
      max_team_size: 4,
      rules: '1. Standard event guidelines apply.',
      registration_open: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      category: ev.category,
      venue: ev.venue || '',
      description: ev.description || '',
      start_date: ev.start_date ? ev.start_date.slice(0, 16) : '',
      end_date: ev.end_date ? ev.end_date.slice(0, 16) : '',
      registration_deadline: ev.registration_deadline ? ev.registration_deadline.slice(0, 16) : '',
      capacity: ev.capacity || 100,
      min_team_size: ev.min_team_size || 1,
      max_team_size: ev.max_team_size || 4,
      rules: ev.rules || '',
      registration_open: ev.registration_open,
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      await adminService.saveEvent({
        ...formData,
        id: editingEvent ? editingEvent.id : undefined,
      });
      setIsModalOpen(false);
      loadEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Unable to save this event. Please try again.');
    }
  };

  const handleToggleRegistration = async (eventId, currentStatus) => {
    await adminService.toggleEventRegistration(eventId, !currentStatus);
    loadEvents();
  };

  const handleToggleSiteRegistration = () => {
    const next = !registrationOpen;
    setConfirmModal({
      isOpen: true,
      title: next ? 'Open public registration?' : 'Close public registration?',
      message: next
        ? 'The “Register Now” button will go live on all public event pages and visitors will be able to submit registrations.'
        : 'The “Register Now” button will be replaced with “Registration not open” and new submissions will be rejected.',
      confirmText: next ? 'Open Registration' : 'Close Registration',
      isDestructive: !next,
      action: async () => {
        try {
          await adminService.setRegistrationOpen(next);
          setRegistrationOpen(next);
        } catch (err) {
          console.error('Error updating registration window:', err);
          alert('Unable to update registration status. Please try again.');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleArchive = async (eventId, isArchived) => {
    setConfirmModal({
      isOpen: true,
      title: isArchived ? 'Unarchive Event' : 'Archive Event',
      message: isArchived
        ? 'Unarchiving will make this track active on public listings.'
        : 'Archiving will hide this track from public registration while preserving historical entries.',
      action: async () => {
        await adminService.toggleEventArchive(eventId, !isArchived);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadEvents();
      },
    });
  };

  const handleSoftDelete = (eventId, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move Event to Trash',
      message: `Are you sure you want to soft-delete "${title}"?`,
      isDestructive: true,
      action: async () => {
        await adminService.softDeleteEvent(eventId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadEvents();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-700" />
            <span>Events & Tracks</span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              {events.length} Tracks
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure competitions, date windows, registration deadlines, team constraints, and rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
          <button
            onClick={loadEvents}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
            title="Refresh Events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Master registration switch for the public site */}
      <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        registrationOpen
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          {registrationOpen ? (
            <ToggleRight className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className={`text-sm font-bold ${registrationOpen ? 'text-emerald-900' : 'text-amber-900'}`}>
              Public Registration
            </h3>
            <p className={`text-xs mt-1 ${registrationOpen ? 'text-emerald-800' : 'text-amber-800'}`}>
              {registrationOpen
                ? 'Registration is open. Visitors can submit the form on event pages.'
                : 'Registration is closed. Event pages show “Registration not open” and new submissions are blocked.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleSiteRegistration}
          disabled={settingsLoading}
          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
            registrationOpen
              ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
          }`}
        >
          {settingsLoading
            ? 'Loading…'
            : registrationOpen
              ? 'Close Registration'
              : 'Open Registration'}
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-500 mx-auto mb-2" />
            <span>Loading events…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            No events found. Click "Create New Event" above to create your first track.
          </div>
        ) : (
          events.map((ev) => {
            const pct = Math.min(100, Math.round(((ev.stats?.approved || 0) / (ev.capacity || 1)) * 100));
            const isFull = (ev.stats?.approved || 0) >= ev.capacity;

            return (
              <div
                key={ev.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                  ev.is_archived
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {ev.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {ev.is_archived && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                          Archived
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleRegistration(ev.id, ev.registration_open)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                          ev.registration_open
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle registration status"
                      >
                        {ev.registration_open ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Registration OPEN</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-rose-600" />
                            <span>Registration CLOSED</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {ev.description || 'No description provided.'}
                  </p>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Venue</span>
                      <span className="text-slate-800 font-semibold truncate block">{ev.venue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Team Size</span>
                      <span className="text-slate-800 font-semibold">
                        {ev.min_team_size === ev.max_team_size
                          ? `${ev.min_team_size} Person`
                          : `${ev.min_team_size} – ${ev.max_team_size} Members`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Deadline</span>
                      <span className="text-amber-700 font-semibold truncate block">
                        {ev.registration_deadline ? new Date(ev.registration_deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Event Start</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {ev.start_date ? new Date(ev.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Capacity Enrollment</span>
                      <span className={`font-mono text-xs font-bold ${isFull ? 'text-rose-600' : 'text-slate-700'}`}>
                        {ev.stats?.approved || 0} / {ev.capacity} Approved ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    {isFull && (
                      <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Cap exceeded: New registrations automatically directed to Waitlist.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Track</span>
                    </button>
                    <button
                      onClick={() => handleToggleArchive(ev.id, ev.is_archived)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 font-medium"
                      title={ev.is_archived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSoftDelete(ev.id, ev.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-700" />
                <span>{editingEvent ? 'Edit Event Details' : 'Create New Competition Track'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. AI Innovations Hackathon 2026"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Software, Robotics..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. CS Lab 2, COMSATS Abbottabad"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Capacity Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Event Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Event End Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_team_size}
                    onChange={(e) => setFormData({ ...formData, min_team_size: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_team_size}
                    onChange={(e) => setFormData({ ...formData, max_team_size: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short track synopsis..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rules & Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    placeholder="Rules and requirements..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono transition-all"
                  />
                </div>
              </div>

              <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 -mx-6 -mb-6 mt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
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
