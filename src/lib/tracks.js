import { useCallback, useEffect, useState } from 'react';
import { events as staticEvents } from '../data/tracks.js';

const splitRules = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);

const firstFilled = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return value;
  }
  return null;
};

/**
 * Merge an admin override row (public.event_tracks) over the static track that
 * ships in src/data/tracks.js. Unedited fields keep rendering exactly as before,
 * so a track with no override row is untouched.
 */
export function mergeTrack(staticTrack, override) {
  if (!staticTrack) return null;
  if (!override) {
    return {
      ...staticTrack,
      registrationOpen: true,
      startDate: null,
      endDate: null,
      registrationDeadline: null,
      capacity: null,
      minTeamSize: null,
      maxTeamSize: null,
    };
  }

  const mergedRules = override.rules ? splitRules(override.rules) : staticTrack.rules;

  return {
    ...staticTrack,
    name: firstFilled(override.title, staticTrack.name),
    category: firstFilled(override.category, staticTrack.category),
    description: firstFilled(override.description, staticTrack.description),
    venue: firstFilled(override.venue, staticTrack.venue),
    teamSize: firstFilled(override.team_size, staticTrack.teamSize),
    fee: firstFilled(override.fee, staticTrack.fee),
    prize: firstFilled(override.prize, staticTrack.prize),
    winnerPrize: firstFilled(override.winner_prize, staticTrack.winnerPrize),
    runnerUpPrize: firstFilled(override.runner_up_prize, staticTrack.runnerUpPrize),
    timings: firstFilled(override.timings, staticTrack.timings),
    duration: firstFilled(override.duration, staticTrack.duration),
    format: firstFilled(override.format, staticTrack.format),
    eligibility: firstFilled(override.eligibility, staticTrack.eligibility),
    rules: mergedRules,
    registrationOpen: override.registration_open !== false,
    startDate: override.start_date || null,
    endDate: override.end_date || null,
    registrationDeadline: override.registration_deadline || null,
    capacity: override.capacity ?? null,
    minTeamSize: override.min_team_size ?? null,
    maxTeamSize: override.max_team_size ?? null,
  };
}

export function mergeTracks(overrides = []) {
  const bySlug = new Map(overrides.map((row) => [row.slug, row]));
  return staticEvents.map((track) => mergeTrack(track, bySlug.get(track.slug)));
}

// Which override fields differ from the shipped default, so the editor labels a
// track "Customized" only for genuinely edited values.
export const TRACK_FIELD_MAP = {
  title: 'name',
  category: 'category',
  description: 'description',
  venue: 'venue',
  team_size: 'teamSize',
  fee: 'fee',
  prize: 'prize',
  winner_prize: 'winnerPrize',
  runner_up_prize: 'runnerUpPrize',
  timings: 'timings',
  duration: 'duration',
  format: 'format',
  eligibility: 'eligibility',
};

export function customizedFields(override) {
  if (!override) return [];
  const staticTrack = staticEvents.find((track) => track.slug === override.slug);
  if (!staticTrack) return [];

  const changed = [];

  Object.entries(TRACK_FIELD_MAP).forEach(([column, staticKey]) => {
    const value = override[column];
    if (value === null || value === undefined) return;
    if (String(value) === String(staticTrack[staticKey] ?? '')) return;
    changed.push(column);
  });

  if (override.rules && splitRules(override.rules).join('\n') !== (staticTrack.rules || []).join('\n')) {
    changed.push('rules');
  }
  if (override.start_date) changed.push('start_date');
  if (override.end_date) changed.push('end_date');
  if (override.registration_deadline) changed.push('registration_deadline');
  if (override.capacity != null) changed.push('capacity');
  if (override.min_team_size != null) changed.push('min_team_size');
  if (override.max_team_size != null) changed.push('max_team_size');
  if (override.registration_open === false) changed.push('registration_open');

  return changed;
}

/**
 * Fetch admin overrides once and expose the merged public track list.
 * `getEventBySlug`-style lookups keep working against the merged result.
 */
export function useTracks() {
  const [bySlug, setBySlug] = useState(() =>
    new Map(mergeTracks().map((track) => [track.slug, track]))
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // Imported lazily so the public site does not pull the Supabase client
      // into the initial bundle just to read track overrides.
      const { publicService } = await import('./supabase.js');
      const overrides = await publicService.getTracks();
      const merged = mergeTracks(overrides);
      setBySlug(new Map(merged.map((track) => [track.slug, track])));
    } catch {
      // Public pages must keep rendering the shipped defaults if the override
      // table has not been applied yet.
      setBySlug(new Map(mergeTracks().map((track) => [track.slug, track])));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = Array.from(bySlug.values());
  const getBySlug = useCallback((slug) => bySlug.get(slug) || null, [bySlug]);

  return { tracks: list, getBySlug, loading, reload };
}
