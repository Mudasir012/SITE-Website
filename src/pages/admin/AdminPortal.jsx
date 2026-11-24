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
  Menu,
  X,
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
    <div className="admin-theme min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
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
            <img
              src="/CUI%20Logo.png"
              alt="COMSATS University Islamabad"
              className="h-9 w-9 object-contain"
            />
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>CITE Admin Portal</span>
                <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400 font-mono font-semibold border-l border-slate-200 pl-2">
                  CITE &apos;26
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Department of Computer Science • CUI Abbottabad</p>
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                  className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="px-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                CITE &apos;26
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                12 December 2026 · Abbottabad
              </div>
            </div>
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
    </div>
  );
}
