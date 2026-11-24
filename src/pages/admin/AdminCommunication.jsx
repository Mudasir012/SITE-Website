import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { adminService } from '../../lib/supabase';
import { getEmailStatus } from '../../lib/email.js';
import ConfirmationModal from './ConfirmationModal';

export default function AdminCommunication() {
  const [activeTab, setActiveTab] = useState('announcements');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetGroup, setTargetGroup] = useState('approved');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [recipientCount, setRecipientCount] = useState(0);

  const [testEmail, setTestEmail] = useState('');
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [testSentError, setTestSentError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false,
  });

  const loadInitial = async () => {
    try {
      const [evList, history] = await Promise.all([
        adminService.getEvents(),
        adminService.getAnnouncements(),
      ]);
      setEvents(evList);
      setAnnouncements(history);
      updateCount('approved', 'all');
    } catch (err) {
      console.error('Error fetching communications from Supabase:', err);
    }
  };

  useEffect(() => {
    loadInitial();
    getEmailStatus().then((status) => setEmailConfigured(Boolean(status.configured)));
  }, []);

  const updateCount = async (group, evId) => {
    const count = await adminService.previewRecipientCount(group, evId);
    setRecipientCount(count);
  };

  const handleGroupChange = (e) => {
    const grp = e.target.value;
    setTargetGroup(grp);
    updateCount(grp, selectedEventId);
  };

  const handleEventChange = (e) => {
    const evId = e.target.value;
    setSelectedEventId(evId);
    updateCount(targetGroup, evId);
  };

  const handleSendTest = async () => {
    if (!subject.trim() || !body.trim() || !testEmail.trim()) {
      alert('Please provide subject, message body, and a valid test email address.');
      return;
    }

    try {
      setLoading(true);
      setTestSentError(null);
      await adminService.sendAnnouncement({
        subject: `[TEST] ${subject}`,
        body,
        targetGroup: 'test',
        isTest: true,
        testRecipient: testEmail,
      });
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 5000);
      const history = await adminService.getAnnouncements();
      setAnnouncements(history);
    } catch (err) {
      console.error('Test email delivery failed:', err);
      setTestSentError('Email delivery failed. Please verify the recipient address and try again.');
      setTimeout(() => setTestSentError(null), 10000);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = () => {
    if (!subject.trim() || !body.trim()) {
      alert('Please fill in both the subject and the announcement content.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Broadcast Announcement Email',
      message: `You are about to dispatch this email to ${recipientCount} recipient(s) in group "${targetGroup.toUpperCase()}". Are you sure?`,
      action: async () => {
        try {
          setLoading(true);
          await adminService.sendAnnouncement({
            subject,
            body,
            targetGroup,
            eventId: selectedEventId,
            isTest: false,
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setSubject('');
          setBody('');
          const history = await adminService.getAnnouncements();
          setAnnouncements(history);
          alert('Announcement dispatched successfully!');
        } catch (err) {
          console.error('Announcement dispatch failed:', err);
          alert('Unable to send this announcement. Please try again.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-700" />
            <span>Communications Hub</span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              emailConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {emailConfigured ? 'Email Delivery Active' : 'Email Delivery Unavailable'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated notifications, group broadcasts, and delivery history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'announcements'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Announcement Composer
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Automated Triggers
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sent History ({announcements.length})
          </button>
        </div>
      </div>

      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-700" />
              <span>Compose Email Broadcast</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recipient Target Group
                </label>
                <select
                  value={targetGroup}
                  onChange={handleGroupChange}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
                >
                  <option value="approved">Approved Participants Only</option>
                  <option value="pending">Pending Applicants Only</option>
                  <option value="waitlisted">Waitlisted Candidates</option>
                  <option value="leaders">Team Leaders Only</option>
                  <option value="all">All Registrations (Global)</option>
                  <option value="ambassadors">Campus Ambassadors</option>
                  <option value="event">Specific Event Registrants</option>
                </select>
              </div>

              {targetGroup === 'event' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={handleEventChange}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-900 shadow-sm font-medium"
                  >
                    <option value="all">Select an Event</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Schedule Update: CITE Hackathon Arrival Times"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Body *
              </label>
              <textarea
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear Participants,&#10;&#10;We are writing with logistical updates regarding CITE 2026..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-mono leading-relaxed shadow-sm"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>
                  Target audience: <strong className="text-slate-900 font-bold">{recipientCount}</strong> verified recipient(s)
                </span>
              </div>

              <button
                type="button"
                disabled={loading || recipientCount === 0}
                onClick={handleBroadcast}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast to {recipientCount} Recipients</span>
              </button>
            </div>
          </div>

          {/* Test Dispatch Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Audience Count</span>
              </h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-3xl font-black text-slate-900 font-mono">{recipientCount}</div>
                <div className="text-xs text-slate-500 mt-1 capitalize font-medium">{targetGroup} Audience</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Send Test Email</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Send a sample preview to your own mailbox first to verify formatting.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Test Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@comsats.edu.pk"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono shadow-sm"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleSendTest}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-slate-200"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>Send Test Sample</span>
              </button>

              {testSentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>Test message dispatched to {testEmail}! Check your inbox.</span>
                </div>
              )}

              {testSentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>Email Delivery Failed</span>
                  </div>
                  <p className="leading-relaxed">{testSentError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Preview */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approval Email (Automatic on Approve)</span>
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Trigger
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dispatched automatically whenever an admin approves a participant registration.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-slate-900 font-bold border-b border-slate-200 pb-2">
                Subject: Congratulations! Your CITE 2026 Registration is Approved
              </div>
              <div className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px]">
                Dear {'{{full_name}}'},

                Congratulations! Your registration for {'{{event_title}}'} has been verified and confirmed.

                Venue: {'{{venue}}'}
                Event Dates: {'{{start_date}}'} - {'{{end_date}}'}

                Please bring your institutional student card for on-desk verification.

                Warm regards,
                CITE 2026 Organizing Committee
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Rejection / Ineligibility Notice</span>
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                Active Trigger
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dispatched when a registration is marked as rejected.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-rose-700 font-bold border-b border-slate-200 pb-2">
                Subject: Update regarding your CITE 2026 Application
              </div>
              <div className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px]">
                Dear {'{{full_name}}'},

                Thank you for applying to participate in CITE 2026. After careful evaluation, we regret to inform you that we cannot offer you a seat for {'{{event_title}}'}.

                Notes: {'{{admin_notes}}'}

                Sincerely,
                CITE Directorate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-slate-700" />
              <span>Outbox & Dispatch History</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{announcements.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date Sent</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Dispatched By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No announcements dispatched yet.
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(ann.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ann.subject}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          ann.is_test
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {ann.target_group}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {ann.recipient_count}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {ann.sent_by}
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
