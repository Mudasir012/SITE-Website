import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import { mergeTracks, customizedFields, TRACK_FIELD_MAP } from '../../lib/tracks';
import ConfirmationModal from './ConfirmationModal';

const EMPTY_FORM = {
  title: '',
  category: '',
  description: '',
  venue: '',
  start_date: '',
  end_date: '',
  registration_deadline: '',
  capacity: '',
  min_team_size: '',
  max_team_size: '',
  team_size: '',
  fee: '',
  prize: '',
  winner_prize: '',
  runner_up_prize: '',
  timings: '',
  duration: '',
  format: '',
  eligibility: '',
  rules: '',
  registration_open: true,
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const statusBadge = (counts) => {
  if ((counts?.pending || 0) > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <Clock className="h-3 w-3" /> {counts.pending} pending
      </span>
    );
  }
  if ((counts?.approved || 0) > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        <CheckCircle className="h-3 w-3" /> {counts.approved} approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
      No registrations
    </span>
  );
};

export default function AdminTracks() {
  const [overrides, setOverrides] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingSlug, setEditingSlug] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [siteRegistrationOpen, setSiteRegistrationOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [overrideRows, statRows, settingsOpen] = await Promise.all([
        adminService.getTrackOverrides(),
        adminService.getTrackStats().catch(() => []),
        adminService.getRegistrationOpen().catch(() => false),
      ]);
      setOverrides(overrideRows);
      setStats(statRows);
      setSiteRegistrationOpen(Boolean(settingsOpen));
    } catch (err) {
      console.error('Error fetching event tracks:', err);
      setError(
        /relation .* does not exist|could not find the function|schema cache/i.test(err?.message || '')
          ? 'The event track tables are not installed yet. Run supabase/event-tracks.sql in the Supabase SQL Editor, then refresh.'
          : err?.message || 'Could not load the event tracks.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const statsBySlug = useMemo(
    () => new Map(stats.map((row) => [row.slug, row])),
    [stats]
  );

  const tracks = useMemo(() => mergeTracks(overrides), [overrides]);

  const categories = useMemo(
    () => Array.from(new Set(tracks.map((track) => track.category).filter(Boolean))),
    [tracks]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tracks.filter((track) => {
      if (categoryFilter !== 'all' && track.category !== categoryFilter) return false;
      if (!term) return true;
      return [track.name, track.slug, track.category, track.description, track.venue]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [tracks, search, categoryFilter]);

  // A track counts as customized only when its row differs from shipped defaults.
  const customizedSlugs = useMemo(() => {
    const map = new Map();
    overrides.forEach((row) => {
      const fields = customizedFields(row);
      if (fields.length > 0) map.set(row.slug, fields);
    });
    return map;
  }, [overrides]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, row) => {
        acc.total += Number(row.total || 0);
        acc.pending += Number(row.pending || 0);
        acc.approved += Number(row.approved || 0);
        acc.rejected += Number(row.rejected || 0);
        acc.waitlisted += Number(row.waitlisted || 0);
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0 }
    );
  }, [stats]);

  const openEditor = (track) => {
    setEditingSlug(track.slug);
    setNotice('');
    setFormData({
      title: track.name || '',
      category: track.category || '',
      description: track.description || '',
      venue: track.venue || '',
      start_date: toInputDate(track.startDate),
      end_date: toInputDate(track.endDate),
      registration_deadline: toInputDate(track.registrationDeadline),
      capacity: track.capacity ?? '',
      min_team_size: track.minTeamSize ?? '',
      max_team_size: track.maxTeamSize ?? '',
      team_size: track.teamSize || '',
      fee: track.fee || '',
      prize: track.prize || '',
      winner_prize: track.winnerPrize || '',
      runner_up_prize: track.runnerUpPrize || '',
      timings: track.timings || '',
      duration: track.duration || '',
      format: track.format || '',
      eligibility: track.eligibility || '',
      rules: Array.isArray(track.rules) ? track.rules.join('\n') : '',
      registration_open: track.registrationOpen !== false,
    });
  };

  const closeEditor = () => {
    setEditingSlug('');
    setFormData(EMPTY_FORM);
  };

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingSlug || saving) return;

    if (
      formData.min_team_size &&
      formData.max_team_size &&
      Number(formData.min_team_size) > Number(formData.max_team_size)
    ) {
      setError('Maximum team size cannot be smaller than the minimum.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const asIso = (value) => (value ? new Date(value).toISOString() : null);

      // Only send fields that differ from the shipped default. Untouched fields
      // stay null so the public page keeps following src/data/tracks.js.
      const draft = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        venue: formData.venue,
        start_date: asIso(formData.start_date),
        end_date: asIso(formData.end_date),
        registration_deadline: asIso(formData.registration_deadline),
        capacity: toNumberOrNull(formData.capacity),
        min_team_size: toNumberOrNull(formData.min_team_size),
        max_team_size: toNumberOrNull(formData.max_team_size),
        team_size: formData.team_size,
        fee: formData.fee,
        prize: formData.prize,
        winner_prize: formData.winner_prize,
        runner_up_prize: formData.runner_up_prize,
        timings: formData.timings,
        duration: formData.duration,
        format: formData.format,
        eligibility: formData.eligibility,
        rules: formData.rules,
      };

      const shipped = editingTrack;
      const payload = {};

      Object.entries(draft).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          payload[key] = null;
          return;
        }

        if (key === 'rules') {
          const incoming = String(value)
            .split(/\r?\n/)
            .map((line) => line.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
            .filter(Boolean);
          const current = Array.isArray(shipped?.rules) ? shipped.rules : [];
          payload.rules = incoming.length === 0 || incoming.join('\n') === current.join('\n')
            ? null
            : incoming.join('\n');
          return;
        }

        if (key === 'capacity') {
          payload.capacity = value === shipped.capacity ? null : value;
          return;
        }
        if (key === 'min_team_size') {
          payload.min_team_size = value === shipped.minTeamSize ? null : value;
          return;
        }
        if (key === 'max_team_size') {
          payload.max_team_size = value === shipped.maxTeamSize ? null : value;
          return;
        }

        if (typeof value === 'string' && shipped) {
          const staticKey = TRACK_FIELD_MAP[key];
          if (staticKey && value === String(shipped[staticKey] ?? '')) {
            payload[key] = null;
            return;
          }
        }

        payload[key] = value;
      });

      payload.registration_open = formData.registration_open;

      await adminService.saveTrackOverride(editingSlug, payload);
      setNotice('Track details saved. The public event page is updated.');
      setEditingSlug('');
      setFormData(EMPTY_FORM);
      await loadAll();
    } catch (err) {
      setError(err?.message || 'Could not save this track. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpen = async (track) => {
    try {
      await adminService.saveTrackOverride(track.slug, {
        registration_open: !(track.registrationOpen !== false),
      });
      await loadAll();
    } catch (err) {
      setError(err?.message || 'Could not update registration for this track.');
    }
  };

  /**
   * The single button the admin asked for: open or close every track at once.
   */
  const handleBulkToggle = () => {
    const anyClosed = tracks.some((track) => track.registrationOpen === false);
    const nextOpen = anyClosed; // if anything is closed, open everything
    const slugs = tracks.map((track) => track.slug);

    setConfirmModal({
      isOpen: true,
      title: nextOpen ? 'Open All Event Tracks' : 'Close All Event Tracks',
      message: nextOpen
        ? `Enable the Register button on all ${slugs.length} event pages at once?`
        : `Disable the Register button on all ${slugs.length} event pages at once? Public visitors will see "Registration not open" on every track.`,
      confirmText: nextOpen ? 'Open All' : 'Close All',
      isDestructive: !nextOpen,
      action: async () => {
        setBulkBusy(true);
        try {
          await adminService.setAllTracksRegistrationOpen(slugs, nextOpen);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setNotice(
            nextOpen
              ? `All ${slugs.length} event tracks are now open for registration.`
              : `All ${slugs.length} event tracks are now closed.`
          );
          await loadAll();
        } catch (err) {
          setError(err?.message || 'Could not update all tracks.');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setBulkBusy(false);
        }
      },
    });
  };

  /**
   * Global master switch, inherited from the retired Events & Limits tab.
   */
  const handleToggleSiteRegistration = () => {
    const next = !siteRegistrationOpen;
    setConfirmModal({
      isOpen: true,
      title: next ? 'Open Public Registration?' : 'Close Public Registration?',
      message: next
        ? 'The site-wide registration window opens. Individual tracks that are still closed stay closed.'
        : 'The site-wide registration window closes and every event page shows "Registration not open", regardless of individual track settings.',
      confirmText: next ? 'Open Registration' : 'Close Registration',
      isDestructive: !next,
      action: async () => {
        try {
          await adminService.setRegistrationOpen(next);
          setSiteRegistrationOpen(next);
        } catch (err) {
          setError(err?.message || 'Could not update the global registration window.');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleReset = (track) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Track to Defaults',
      message: `Discard all admin edits for "${track.name}" and restore the shipped event-page content? Registrations are not affected.`,
      isDestructive: true,
      action: async () => {
        try {
          await adminService.resetTrackOverride(track.slug);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          await loadAll();
        } catch (err) {
          setError(err?.message || 'Could not reset this track.');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const editingTrack = tracks.find((track) => track.slug === editingSlug) || null;
  const openCount = tracks.filter((track) => track.registrationOpen !== false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-700" />
            <span>Event Page Tracks</span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              {tracks.length} Tracks
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live registration counts for each public event page. Edit descriptions, dates, capacity,
            team size, fees and rules — changes appear on the public site immediately.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm self-start md:self-auto"
          title="Refresh tracks"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Global switches, inherited from the retired Events & Limits tab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            siteRegistrationOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {siteRegistrationOpen ? (
              <ToggleRight className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3
                className={`text-sm font-bold ${
                  siteRegistrationOpen ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                Public Registration (Site-Wide)
              </h3>
              <p
                className={`text-xs mt-1 ${
                  siteRegistrationOpen ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {siteRegistrationOpen
                  ? 'Master switch is open. Tracks you closed individually stay closed.'
                  : 'Master switch is closed. Every event page blocks registration.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSiteRegistration}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
              siteRegistrationOpen
                ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            {siteRegistrationOpen ? 'Close Registration' : 'Open Registration'}
          </button>
        </div>

        <div className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Layers className="w-6 h-6 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">All Event Tracks</h3>
              <p className="text-xs mt-1 text-slate-500">
                {openCount} of {tracks.length} tracks are currently open. One click flips them all.
              </p>
            </div>
          </div>
          <button
            onClick={handleBulkToggle}
            disabled={bulkBusy || loading}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap disabled:opacity-50 ${
              openCount === tracks.length
                ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            {bulkBusy
              ? 'Updating…'
              : openCount === tracks.length
                ? 'Close All Tracks'
                : 'Open All Tracks'}
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: totals.total, tone: 'text-slate-900' },
          { label: 'Pending', value: totals.pending, tone: 'text-amber-600' },
          { label: 'Approved', value: totals.approved, tone: 'text-emerald-600' },
          { label: 'Waitlisted', value: totals.waitlisted, tone: 'text-indigo-600' },
          { label: 'Rejected', value: totals.rejected, tone: 'text-rose-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {card.label} Registrations
            </div>
            <div className={`mt-1 text-2xl font-black tabular-nums ${card.tone}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-relaxed text-emerald-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search track name, slug, description…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Track grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-500" />
            <span>Loading event tracks…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400 shadow-sm">
            No tracks match this search.
          </div>
        ) : (
          filtered.map((track) => {
            const counts = statsBySlug.get(track.slug) || {};
            const capacity = track.capacity ?? null;
            const approved = Number(counts.approved || 0);
            const pct = capacity ? Math.min(100, Math.round((approved / capacity) * 100)) : null;
            const isOpen = track.registrationOpen !== false;

            return (
              <div
                key={track.slug}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-slate-300"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {track.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {customizedSlugs.has(track.slug) && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          Edited
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleOpen(track)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Toggle registration for this track"
                      >
                        {isOpen ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                            <span>OPEN</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-rose-600" />
                            <span>CLOSED</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                    {track.name}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                    {track.eventCode} · /tracks/{track.slug}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {track.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Venue</span>
                      <span className="text-slate-800 font-semibold truncate block">{track.venue || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Team Size</span>
                      <span className="text-slate-800 font-semibold">
                        {track.minTeamSize && track.maxTeamSize
                          ? track.minTeamSize === track.maxTeamSize
                            ? `${track.minTeamSize} Person`
                            : `${track.minTeamSize} – ${track.maxTeamSize} Members`
                          : track.teamSize || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Start</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {formatDate(track.startDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Deadline</span>
                      <span className="text-amber-700 font-semibold truncate block">
                        {formatDate(track.registrationDeadline)}
                      </span>
                    </div>
                  </div>

                  {/* Registration stats */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{counts.total || 0} registered</span>
                      </div>
                      {statusBadge(counts)}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                      <span>Approved {counts.approved || 0}</span>
                      <span className="text-slate-300">|</span>
                      <span>Pending {counts.pending || 0}</span>
                      <span className="text-slate-300">|</span>
                      <span>Waitlist {counts.waitlisted || 0}</span>
                      <span className="text-slate-300">|</span>
                      <span>Rejected {counts.rejected || 0}</span>
                    </div>

                    {capacity ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Capacity</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              pct >= 100 ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            {approved} / {capacity} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all ${
                              pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => openEditor(track)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-800"
                      >
                        <Calendar className="h-3 w-3" /> Set a capacity limit
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditor(track)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Track</span>
                    </button>
                    {customizedSlugs.has(track.slug) && (
                      <button
                        onClick={() => handleReset(track)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 font-medium"
                        title="Reset to shipped defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {counts.last_registered_at
                      ? `Last: ${formatDate(counts.last_registered_at)}`
                      : 'No entries yet'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor */}
      {editingTrack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={closeEditor}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-700" />
                  <span>{editingTrack.name}</span>
                </h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {editingTrack.eventCode} · /tracks/{editingTrack.slug}
                </p>
              </div>
              <button
                onClick={closeEditor}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={setField('title')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Clear the field to fall back to the shipped default.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={setField('category')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={setField('venue')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Event Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={setField('start_date')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Event End
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={setField('end_date')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={setField('registration_deadline')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={setField('capacity')}
                    placeholder="Leave blank for no cap"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_team_size}
                    onChange={setField('min_team_size')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_team_size}
                    onChange={setField('max_team_size')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Team Size Label
                  </label>
                  <input
                    type="text"
                    value={formData.team_size}
                    onChange={setField('team_size')}
                    placeholder="e.g. 1 – 3 members"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Fee
                  </label>
                  <input
                    type="text"
                    value={formData.fee}
                    onChange={setField('fee')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Prize Pool
                  </label>
                  <input
                    type="text"
                    value={formData.prize}
                    onChange={setField('prize')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Winner Prize
                  </label>
                  <input
                    type="text"
                    value={formData.winner_prize}
                    onChange={setField('winner_prize')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Runner-up Prize
                  </label>
                  <input
                    type="text"
                    value={formData.runner_up_prize}
                    onChange={setField('runner_up_prize')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Timings
                  </label>
                  <input
                    type="text"
                    value={formData.timings}
                    onChange={setField('timings')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={setField('duration')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Format
                  </label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={setField('format')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Eligibility
                  </label>
                  <input
                    type="text"
                    value={formData.eligibility}
                    onChange={setField('eligibility')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Description & Overview
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={setField('description')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Rules (one per line)
                  </label>
                  <textarea
                    rows={5}
                    value={formData.rules}
                    onChange={setField('rules')}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-slate-900 shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <span>
                      <span className="block text-xs font-bold uppercase text-slate-700">
                        Registration Open
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        Closing this hides the Register button for this track even while global
                        registration is open.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, registration_open: !prev.registration_open }))
                      }
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        formData.registration_open
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-rose-200 bg-rose-50 text-rose-800'
                      }`}
                    >
                      {formData.registration_open ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" /> OPEN
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> CLOSED
                        </>
                      )}
                    </button>
                  </label>
                </div>
              </div>

              <div className="-mx-6 -mb-6 mt-4 flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl bg-slate-200/80 px-4 py-2 font-bold text-slate-800 transition-colors hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Track'}
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
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
