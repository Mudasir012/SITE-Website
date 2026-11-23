import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  Mail,
  Award,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Database,
  Menu,
  X,
  Copy,
  Check,
  HelpCircle
} from 'lucide-react';
import AdminAuth from './AdminAuth';
import AdminDashboard from './AdminDashboard';
import AdminRegistrations from './AdminRegistrations';
import AdminTeams from './AdminTeams';
import AdminEvents from './AdminEvents';
import AdminCommunication from './AdminCommunication';
import AdminAmbassadors from './AdminAmbassadors';
import AdminUsers from './AdminUsers';
import AdminAuditLogs from './AdminAuditLogs';
import { adminService, supabase } from '../../lib/supabase';

export default function AdminPortal({ onBackToSite }) {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const admin = await adminService.getCurrentAdmin();
        if (isMounted) {
          setCurrentAdmin(admin);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const admin = await adminService.getCurrentAdmin();
          if (isMounted) setCurrentAdmin(admin);
        } else {
          if (isMounted) setCurrentAdmin(null);
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await adminService.logout();
    setCurrentAdmin(null);
  };

  const handleNavigateTab = (tabId, params = {}) => {
    setCurrentTab(tabId);
    setTabParams(params);
    setMobileMenuOpen(false);
  };

  const copySupabaseSql = async () => {
    try {
      const response = await fetch('/supabase/schema.sql');
      let text = '';
      if (response.ok) {
        text = await response.text();
      } else {
        text = `-- Supabase Schema available in supabase/schema.sql in root`;
      }
      navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {
      alert('You can copy the SQL script from "supabase/schema.sql" directly.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Loading Admin Session...
          </span>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <AdminAuth
        onLoginSuccess={(admin) => setCurrentAdmin(admin)}
        onBackToSite={onBackToSite}
      />
    );
  }

  const isSuperAdmin = currentAdmin.role === 'super_admin';

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'teams', label: 'Teams Management', icon: Shield },
    { id: 'events', label: 'Events & Limits', icon: Calendar },
    { id: 'communication', label: 'Communication Hub', icon: Mail },
    { id: 'ambassadors', label: 'Campus Ambassadors', icon: Award },
    ...(isSuperAdmin ? [{ id: 'users', label: 'Admin Accounts', icon: ShieldCheck }] : []),
    { id: 'audit', label: 'Audit & Safety', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shadow-sm">
              C
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>CITE Admin Portal</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold border border-slate-200">
                  Supabase Live
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Department of Computer Science • CUI Abbottabad</p>
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Database Connected Pill */}
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            title="Supabase Database Status"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Connected</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Current Admin Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              {currentAdmin.full_name?.charAt(0) || 'A'}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {currentAdmin.full_name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                {currentAdmin.role?.replace('_', ' ')}
              </div>
            </div>
          </div>

          <button
            onClick={onBackToSite}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
            title="Return to Public Website"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Public Site</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
            title="Sign out of portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0 top-[53px]' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Admin Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setShowSetupModal(true)}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-left transition-colors flex items-center gap-2.5 text-slate-700"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <div className="font-bold text-slate-900">Database Schema Info</div>
                <div className="text-[10px] text-slate-500 font-medium">PostgreSQL Tables & Triggers</div>
              </div>
            </button>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <AdminDashboard onNavigateTab={handleNavigateTab} />
            )}
            {currentTab === 'registrations' && (
              <AdminRegistrations initialFilterStatus={tabParams.status || 'all'} />
            )}
            {currentTab === 'teams' && <AdminTeams />}
            {currentTab === 'events' && <AdminEvents />}
            {currentTab === 'communication' && <AdminCommunication />}
            {currentTab === 'ambassadors' && <AdminAmbassadors />}
            {currentTab === 'users' && isSuperAdmin && (
              <AdminUsers currentAdmin={currentAdmin} />
            )}
            {currentTab === 'audit' && <AdminAuditLogs />}
          </div>
        </main>
      </div>

      {/* Database Setup Info Modal */}
      {showSetupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowSetupModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Supabase Project Information
                </h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800">
                <div className="font-bold text-emerald-900 mb-0.5">Database Connection Active</div>
                <div className="font-mono text-[11px] text-emerald-800 break-all">
                  {__SUPABASE_URL__}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">Database Schema Reference</h4>
                <p className="text-slate-500">
                  All tables (`events`, `registrations`, `teams`, `ambassadors`, `announcements`, `audit_logs`, `admin_profiles`) and the capacity check trigger are configured in <code className="text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">supabase/schema.sql</code>.
                </p>
                <div className="mt-3">
                  <button
                    onClick={copySupabaseSql}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all flex items-center gap-2 text-xs shadow-sm"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? 'Copied schema.sql to clipboard!' : 'Copy Schema SQL'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
