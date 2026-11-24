import { createClient } from '@supabase/supabase-js';
import {
  sendRegistrationApprovalEmail,
  sendBroadcastEmail,
} from './email.js';

const supabaseUrl = __SUPABASE_URL__;
const supabaseAnonKey = __SUPABASE_ANON_KEY__;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// PostgREST .or() filters treat commas/parentheses as syntax. Strip them from
// free-text input so a search box cannot change the shape of the query.
const safeFilterText = (value) => String(value || '').trim().replace(/[,()\\]/g, ' ');

// Keep exported cells inert in Excel/Sheets (CSV formula injection).
const escapeCsvCell = (value) => {
  let cell = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
};

// Helper to log audit trail directly into Supabase audit_logs table
async function logAudit(actor_email, action, entity_type, entity_id = null, details = {}) {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_email: actor_email || 'admin@cite.org',
        action,
        entity_type,
        entity_id: String(entity_id || ''),
        details,
      },
    ]);
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

export const adminService = {
  // ── Authentication & Sessions ──
  async getCurrentAdmin() {
    if (!supabase) return null;
    // getUser() validates the token with the auth server; getSession() only
    // reads local storage and must never be used to gate privileged UI.
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Fetch admin profile
    const { data: profile, error: profileErr } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn('Could not load admin profile:', profileErr.message);
      return null;
    }

    // A Supabase session alone is not admin access. The profile row is the
    // source of truth, so never fabricate one here.
    return profile || null;
  },

  async login(email, password, expectedRole = null) {
    if (!supabase) {
      throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    const { data: profile, error: profileErr } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr) throw profileErr;

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error(
        'This account is not registered as an administrator. Contact the Super Admin.'
      );
    }

    // The selected role must match the database role exactly.
    if (expectedRole && profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error(
        expectedRole === 'super_admin'
          ? 'Access denied. This account does not have Super Admin privileges.'
          : 'Access denied. This account does not have Event Admin privileges.'
      );
    }

    await logAudit(profile.email, 'ADMIN_LOGIN', 'auth', profile.id, {
      email: profile.email,
      role: profile.role,
      signedInAs: expectedRole || profile.role,
    });
    return profile;
  },

  async logout() {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      await logAudit(session.user.email, 'ADMIN_LOGOUT', 'auth', session.user.id);
    }
    await supabase.auth.signOut();
  },

  async resetPassword(email) {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin`,
    });
    if (error) throw error;
    await logAudit(email, 'PASSWORD_RESET_REQUESTED', 'auth', email, { email });
    return true;
  },

  // ── Admin Accounts Management (Super Admin only) ──
  async getAdmins() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async removeAdmin(adminId) {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const curAdmin = await this.getCurrentAdmin();

    const { error } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('id', adminId);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'REMOVE_ADMIN', 'admin', adminId);
    return true;
  },

  // ── Dashboard Statistics ──
  async getDashboardStats() {
    if (!supabase) {
      return {
        counts: { total: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0, teams: 0, approvedTeams: 0, activeEvents: 0, ambassadors: 0, totalReferrals: 0 },
        trend: [],
        eventCapacities: [],
        recentActivity: [],
      };
    }

    const [
      { data: regs },
      { data: events },
      { data: teams },
      { data: ambassadors },
      { data: auditLogs },
    ] = await Promise.all([
      supabase.from('registrations').select('*').is('deleted_at', null),
      supabase.from('events').select('*').is('deleted_at', null).eq('is_archived', false),
      supabase.from('teams').select('*').is('deleted_at', null),
      supabase.from('ambassadors').select('*').is('deleted_at', null),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
    ]);

    const regList = regs || [];
    const eventList = events || [];
    const teamList = teams || [];
    const ambList = ambassadors || [];

    const counts = {
      total: regList.length,
      pending: regList.filter(r => r.status === 'pending').length,
      approved: regList.filter(r => r.status === 'approved').length,
      rejected: regList.filter(r => r.status === 'rejected').length,
      waitlisted: regList.filter(r => r.status === 'waitlisted').length,
      teams: teamList.length,
      approvedTeams: teamList.filter(t => t.status === 'approved').length,
      activeEvents: eventList.length,
      ambassadors: ambList.length,
      totalReferrals: ambList.reduce((acc, a) => acc + (a.referral_count || 0), 0),
    };

    // 10-day time series registration trend
    const trend = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = regList.filter(r => r.created_at && r.created_at.startsWith(dateStr)).length;
      trend.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      });
    }

    // Capacity gauges
    const eventCapacities = eventList.map(ev => {
      const approvedCount = regList.filter(r => r.event_id === ev.id && r.status === 'approved').length;
      const totalRegistered = regList.filter(r => r.event_id === ev.id).length;
      const pct = Math.min(100, Math.round((approvedCount / (ev.capacity || 1)) * 100));
      return {
        id: ev.id,
        title: ev.title,
        capacity: ev.capacity,
        approvedCount,
        totalRegistered,
        percentage: pct,
        isFull: approvedCount >= ev.capacity,
      };
    });

    return {
      counts,
      trend,
      eventCapacities,
      recentActivity: auditLogs || [],
    };
  },

  // ── Registrations Management ──
  async getRegistrations({ search = '', status = 'all', eventId = 'all', page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', showDeleted = false } = {}) {
    if (!supabase) return { items: [], total: 0, page: 1, totalPages: 1 };

    let query = supabase.from('registrations').select('*', { count: 'exact' });

    if (!showDeleted) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (eventId !== 'all') {
      query = query.eq('event_id', eventId);
    }

    const searchTerm = safeFilterText(search);
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,university.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      items: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit) || 1,
    };
  },

  async updateRegistrationStatus(id, newStatus, customNotes = '') {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const curAdmin = await this.getCurrentAdmin();

    // Check capacity before approving
    if (newStatus === 'approved') {
      const { data: reg } = await supabase.from('registrations').select('event_id, full_name, user_email').eq('id', id).single();
      if (reg?.event_id) {
        const { data: ev } = await supabase.from('events').select('capacity').eq('id', reg.event_id).single();
        const { count: approvedCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', reg.event_id)
          .eq('status', 'approved')
          .is('deleted_at', null);

        if (ev && approvedCount >= ev.capacity) {
          newStatus = 'waitlisted';
          customNotes = (customNotes ? `${customNotes}\n` : '') + `[Auto-waitlisted: Event reached maximum capacity (${ev.capacity})]`;
        }
      }
    }

    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (customNotes) updates.notes = customNotes;

    const { data, error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send real approval confirmation email via Resend
    if (newStatus === 'approved' && data?.user_email) {
      try {
        const { data: evData } = await supabase
          .from('events')
          .select('title, venue, start_date')
          .eq('id', data.event_id)
          .maybeSingle();

        await sendRegistrationApprovalEmail({
          to: data.user_email,
          fullName: data.full_name,
          eventTitle: evData?.title || 'CITE 2026 Track',
          venue: evData?.venue || 'CS Complex, COMSATS Abbottabad',
          dates: evData?.start_date ? new Date(evData.start_date).toLocaleDateString() : 'December 2026',
        });
      } catch (mailErr) {
        console.warn('[Approval Email Dispatch Error]:', mailErr);
      }
    }

    await logAudit(curAdmin?.email, 'UPDATE_REGISTRATION_STATUS', 'registration', id, { newStatus, notes: customNotes });
    return data;
  },

  async bulkUpdateRegistrations(ids, newStatus) {
    if (!supabase || !ids.length) return [];
    const curAdmin = await this.getCurrentAdmin();

    const { data, error } = await supabase
      .from('registrations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) throw error;
    await logAudit(curAdmin?.email, 'BULK_UPDATE_REGISTRATIONS', 'registration', 'bulk', { count: ids.length, newStatus });
    return data || [];
  },

  async softDeleteRegistration(id) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { error } = await supabase
      .from('registrations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'SOFT_DELETE_REGISTRATION', 'registration', id);
    return true;
  },

  async restoreRegistration(id) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { error } = await supabase
      .from('registrations')
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'RESTORE_REGISTRATION', 'registration', id);
    return true;
  },

  // ── Teams Management ──
  async getTeams({ search = '', status = 'all', eventId = 'all', showDeleted = false } = {}) {
    if (!supabase) return [];
    let query = supabase.from('teams').select('*, events(title)');

    if (!showDeleted) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
    }

    if (status !== 'all') query = query.eq('status', status);
    if (eventId !== 'all') query = query.eq('event_id', eventId);
    const searchTerm = safeFilterText(search);
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,leader_email.ilike.%${searchTerm}%`);
    }

    const { data: teams, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Fetch members for each team from registrations
    const { data: members } = await supabase
      .from('registrations')
      .select('*')
      .is('deleted_at', null)
      .not('team_id', 'is', null);

    const memberList = members || [];

    return (teams || []).map(t => {
      const tmMembers = memberList.filter(m => m.team_id === t.id);
      return {
        ...t,
        eventTitle: t.events?.title || 'Track Event',
        members: tmMembers,
        memberCount: tmMembers.length,
      };
    });
  },

  async updateTeamStatus(teamId, status, notes = '') {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const curAdmin = await this.getCurrentAdmin();

    const updates = { status, updated_at: new Date().toISOString() };
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    // Cascade team status to member registrations
    if (status === 'approved' || status === 'disqualified') {
      const regStatus = status === 'approved' ? 'approved' : 'rejected';
      await supabase
        .from('registrations')
        .update({ status: regStatus, updated_at: new Date().toISOString() })
        .eq('team_id', teamId);
    }

    await logAudit(curAdmin?.email, 'UPDATE_TEAM_STATUS', 'team', teamId, { status });
    return data;
  },

  async removeTeamMember(teamId, registrationId) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { error } = await supabase
      .from('registrations')
      .update({ team_id: null, is_leader: false, updated_at: new Date().toISOString() })
      .eq('id', registrationId);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'REMOVE_TEAM_MEMBER', 'team', teamId, { registrationId });
    return true;
  },

  async softDeleteTeam(teamId) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamId);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'SOFT_DELETE_TEAM', 'team', teamId);
    return true;
  },

  // ── Events Management ──
  async getEvents({ includeArchived = true, showDeleted = false } = {}) {
    if (!supabase) return [];
    let query = supabase.from('events').select('*');

    if (!showDeleted) query = query.is('deleted_at', null);
    else query = query.not('deleted_at', 'is', null);

    if (!includeArchived) query = query.eq('is_archived', false);

    const { data: events, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    // Fetch approved & pending counts for each event
    const { data: regs } = await supabase
      .from('registrations')
      .select('event_id, status')
      .is('deleted_at', null);

    const regList = regs || [];

    return (events || []).map(e => {
      const eventRegs = regList.filter(r => r.event_id === e.id);
      const approved = eventRegs.filter(r => r.status === 'approved').length;
      const pending = eventRegs.filter(r => r.status === 'pending').length;
      return {
        ...e,
        stats: {
          total: eventRegs.length,
          approved,
          pending,
          remaining: Math.max(0, e.capacity - approved),
        },
      };
    });
  },

  async saveEvent(eventData) {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const curAdmin = await this.getCurrentAdmin();

    if (eventData.id) {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventData.id)
        .select()
        .single();
      if (error) throw error;
      await logAudit(curAdmin?.email, 'UPDATE_EVENT', 'event', eventData.id, { title: eventData.title });
      return data;
    }

    const newEvent = {
      ...eventData,
      slug: (eventData.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      registration_open: eventData.registration_open ?? true,
      is_archived: false,
    };

    const { data, error } = await supabase
      .from('events')
      .insert([newEvent])
      .select()
      .single();

    if (error) throw error;
    await logAudit(curAdmin?.email, 'CREATE_EVENT', 'event', data?.id, { title: newEvent.title });
    return data;
  },

  async toggleEventRegistration(eventId, isOpen) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { data, error } = await supabase
      .from('events')
      .update({ registration_open: isOpen, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    await logAudit(curAdmin?.email, 'TOGGLE_EVENT_REGISTRATION', 'event', eventId, { isOpen });
    return data;
  },

  async toggleEventArchive(eventId, isArchived) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { data, error } = await supabase
      .from('events')
      .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    await logAudit(curAdmin?.email, 'ARCHIVE_EVENT', 'event', eventId, { isArchived });
    return data;
  },

  async softDeleteEvent(eventId) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', eventId);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'SOFT_DELETE_EVENT', 'event', eventId);
    return true;
  },

  // ── Ambassadors Management ──
  async getAmbassadors({ status = 'all', search = '', showDeleted = false } = {}) {
    if (!supabase) return [];
    let query = supabase.from('ambassadors').select('*');

    if (!showDeleted) query = query.is('deleted_at', null);
    else query = query.not('deleted_at', 'is', null);

    if (status !== 'all') query = query.eq('status', status);
    const searchTerm = safeFilterText(search);
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,university.ilike.%${searchTerm}%,referral_code.ilike.%${searchTerm}%`);
    }

    const { data: ambassadors, error } = await query.order('referral_count', { ascending: false });
    if (error) throw error;

    // Dynamically calculate referral count from verified registrations
    const { data: regs } = await supabase
      .from('registrations')
      .select('referral_code')
      .is('deleted_at', null)
      .not('referral_code', 'is', null);

    const regList = regs || [];

    return (ambassadors || []).map(a => {
      const actualCount = regList.filter(
        r => r.referral_code && r.referral_code.toUpperCase() === a.referral_code.toUpperCase()
      ).length;
      return {
        ...a,
        referral_count: Math.max(a.referral_count || 0, actualCount),
      };
    });
  },

  async updateAmbassadorStatus(id, status) {
    if (!supabase) return null;
    const curAdmin = await this.getCurrentAdmin();
    const { data, error } = await supabase
      .from('ambassadors')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await logAudit(curAdmin?.email, 'UPDATE_AMBASSADOR_STATUS', 'ambassador', id, { status });
    return data;
  },

  // ── Communication & Announcements ──
  async previewRecipientCount(targetGroup, eventId = 'all') {
    if (!supabase) return 0;
    let query = supabase.from('registrations').select('*', { count: 'exact', head: true }).is('deleted_at', null);

    if (targetGroup === 'approved') query = query.eq('status', 'approved');
    else if (targetGroup === 'pending') query = query.eq('status', 'pending');
    else if (targetGroup === 'waitlisted') query = query.eq('status', 'waitlisted');
    else if (targetGroup === 'leaders') query = query.eq('is_leader', true);
    else if (targetGroup === 'ambassadors') {
      const { count } = await supabase.from('ambassadors').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'approved');
      return count || 0;
    }

    if (targetGroup === 'event' && eventId !== 'all') {
      query = query.eq('event_id', eventId);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  },

  async getRecipientEmails(targetGroup, eventId = 'all') {
    if (!supabase) return [];
    let query = supabase.from('registrations').select('user_email').is('deleted_at', null);

    if (targetGroup === 'approved') query = query.eq('status', 'approved');
    else if (targetGroup === 'pending') query = query.eq('status', 'pending');
    else if (targetGroup === 'waitlisted') query = query.eq('status', 'waitlisted');
    else if (targetGroup === 'leaders') query = query.eq('is_leader', true);
    else if (targetGroup === 'ambassadors') {
      const { data } = await supabase.from('ambassadors').select('email').is('deleted_at', null).eq('status', 'approved');
      return (data || []).map(a => a.email).filter(Boolean);
    }

    if (targetGroup === 'event' && eventId !== 'all') {
      query = query.eq('event_id', eventId);
    }

    const { data } = await query;
    return (data || []).map(r => r.user_email).filter(Boolean);
  },

  async sendAnnouncement({ subject, body, targetGroup, eventId, isTest = false, testRecipient = '' }) {
    if (!supabase) throw new Error('The admin portal is temporarily unavailable. Please try again shortly.');
    const curAdmin = await this.getCurrentAdmin();
    const count = isTest ? 1 : await this.previewRecipientCount(targetGroup, eventId);

    const announcement = {
      subject,
      body,
      target_group: isTest ? `Test (${testRecipient})` : targetGroup,
      recipient_count: count,
      sent_by: curAdmin?.email || 'admin@cite.org',
      is_test: isTest,
      test_recipient: testRecipient || null,
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single();

    if (error) throw error;

    // Deliver real email to inbox via Resend
    let resendSent = 0;
    let resendError = null;

    if (isTest && testRecipient) {
      try {
        await sendBroadcastEmail({
          to: testRecipient.trim(),
          subject,
          body,
        });
        resendSent = 1;
      } catch (deliveryErr) {
        console.error('[Resend Test Delivery Error]:', deliveryErr);
        throw deliveryErr;
      }
    } else if (!isTest) {
      const emailList = await this.getRecipientEmails(targetGroup, eventId);
      if (emailList.length > 0) {
        for (const recipient of emailList) {
          try {
            await sendBroadcastEmail({
              to: recipient,
              subject,
              body,
            });
            resendSent++;
          } catch (err) {
            console.warn(`Failed to dispatch email to ${recipient}:`, err);
            resendError = err.message;
          }
        }
      }
    }

    await logAudit(curAdmin?.email, isTest ? 'SEND_TEST_EMAIL' : 'SEND_ANNOUNCEMENT', 'announcement', data?.id, { subject, recipient_count: count, resendSent });
    return data;
  },

  async getAnnouncements() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ── Safety & Audit Logs ──
  async getAuditLogs({ limit = 100, entityType = 'all' } = {}) {
    if (!supabase) return [];
    let query = supabase.from('audit_logs').select('*');
    if (entityType !== 'all') query = query.eq('entity_type', entityType);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getTrashItems() {
    if (!supabase) return [];
    const [
      { data: regs },
      { data: teams },
      { data: events },
    ] = await Promise.all([
      supabase.from('registrations').select('*').not('deleted_at', 'is', null),
      supabase.from('teams').select('*').not('deleted_at', 'is', null),
      supabase.from('events').select('*').not('deleted_at', 'is', null),
    ]);

    const deletedRegs = (regs || []).map(r => ({ ...r, item_type: 'registration', title: `${r.full_name} (${r.user_email})` }));
    const deletedTeams = (teams || []).map(t => ({ ...t, item_type: 'team', title: `Team: ${t.name}` }));
    const deletedEvents = (events || []).map(e => ({ ...e, item_type: 'event', title: `Event: ${e.title}` }));

    return [...deletedRegs, ...deletedTeams, ...deletedEvents];
  },

  async restoreItem(itemType, id) {
    if (!supabase) return false;
    const curAdmin = await this.getCurrentAdmin();
    const table = itemType === 'registration' ? 'registrations' : itemType === 'team' ? 'teams' : 'events';
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) throw error;
    await logAudit(curAdmin?.email, 'RESTORE_ITEM', itemType, id);
    return true;
  },

  // CSV Export Helper
  exportRegistrationsCSV(records) {
    if (!records || !records.length) {
      alert('No records available to export.');
      return false;
    }
    const headers = [
      'Registration ID',
      'Full Name',
      'Email',
      'Phone',
      'University',
      'Roll Number',
      'Gender',
      'Event ID',
      'Team ID',
      'Is Leader',
      'Status',
      'Referral Code',
      'Registered At',
      'Notes'
    ];

    const rows = records.map(r => [
      escapeCsvCell(r.id),
      escapeCsvCell(r.full_name),
      escapeCsvCell(r.user_email),
      escapeCsvCell(r.phone),
      escapeCsvCell(r.university),
      escapeCsvCell(r.roll_number),
      escapeCsvCell(r.gender),
      escapeCsvCell(r.event_id),
      escapeCsvCell(r.team_id),
      escapeCsvCell(r.is_leader ? 'Yes' : 'No'),
      escapeCsvCell(r.status || 'pending'),
      escapeCsvCell(r.referral_code),
      escapeCsvCell(r.created_at),
      escapeCsvCell(String(r.notes || '').replace(/\n/g, ' ')),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CITE_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
};
