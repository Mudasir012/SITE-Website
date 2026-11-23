import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Layers,
  Activity,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../lib/supabase';

export default function AdminDashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboardStats();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Live Metrics...</span>
        </div>
      </div>
    );
  }

  const { counts, trend, eventCapacities, recentActivity } = data;
  const maxTrend = Math.max(...(trend?.map(t => t.count) || [1]), 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Executive Dashboard</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Supabase Live
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time enrollment metrics, track capacity monitoring, and system activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('registrations', { status: 'pending' })}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Pending ({counts.pending})</span>
          </button>
          <button
            onClick={() => onNavigateTab('communication')}
            className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Send Announcement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.total}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">All Applications</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">{counts.pending}</div>
          <div className="text-[11px] text-amber-700/70 mt-1 font-medium">Needs Verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Approved</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{counts.approved}</div>
          <div className="text-[11px] text-emerald-700/70 mt-1 font-medium">Seats Confirmed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600">{counts.rejected}</div>
          <div className="text-[11px] text-rose-700/70 mt-1 font-medium">Ineligible</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Waitlist</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-600">{counts.waitlisted}</div>
          <div className="text-[11px] text-purple-700/70 mt-1 font-medium">Capacity Buffer</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Teams</span>
            <Shield className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.teams}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{counts.approvedTeams} Approved</div>
        </div>
      </div>

      {/* Charts & Capacity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations Per Day Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <span>Registrations Velocity (Last 10 Days)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily application volume logged in database</p>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Peak: {maxTrend} / day
            </div>
          </div>

          {/* Clean CSS/SVG Bar Chart */}
          <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {trend && trend.length > 0 ? (
              trend.map((day) => {
                const heightPercent = Math.max(6, Math.round((day.count / maxTrend) * 100));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                      {day.label}: <strong>{day.count}</strong>
                    </div>

                    <div className="w-full flex justify-center items-end h-32">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[32px] rounded-t-lg bg-slate-900 hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                      {day.label.split(' ')[1]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No registrations logged yet.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
            <span>Aggregated database registrations</span>
            <button
              onClick={() => onNavigateTab('registrations')}
              className="text-slate-900 hover:text-slate-700 font-bold flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Event Capacities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <span>Track Capacities</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Auto-Waitlist
              </span>
            </div>

            <div className="space-y-4">
              {eventCapacities && eventCapacities.length > 0 ? (
                eventCapacities.map((ev) => (
                  <div key={ev.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{ev.title}</span>
                      <span className={`font-mono text-xs font-semibold ${ev.isFull ? 'text-rose-600' : 'text-slate-500'}`}>
                        {ev.approvedCount} / {ev.capacity} ({ev.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        style={{ width: `${ev.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          ev.percentage >= 100
                            ? 'bg-rose-500'
                            : ev.percentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    {ev.isFull && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Cap reached. New applicants automatically directed to waitlist.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active tracks created yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Ambassador Referrals: {counts.totalReferrals}</span>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-slate-900 hover:text-slate-700 font-bold"
            >
              Configure Limits →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Recent Database Activity</h3>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="text-xs text-slate-900 hover:text-slate-700 font-bold flex items-center gap-1"
          >
            <span>Full Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono font-medium">{log.actor_email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize">{log.entity_type}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No recent activity recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
