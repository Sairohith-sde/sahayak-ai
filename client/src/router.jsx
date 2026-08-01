import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.js';
import api from './api/index.js';

// Page Imports
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import WorkerDashboard from './pages/WorkerDashboard.jsx';
import Households from './pages/Households.jsx';
import HouseholdDetail from './pages/HouseholdDetail.jsx';
import RecordVisit from './pages/RecordVisit.jsx';
import VisitDetail from './pages/VisitDetail.jsx';
import SupervisorDashboard from './pages/SupervisorDashboard.jsx';
import WorkerView from './pages/WorkerView.jsx';
import PipelineView from './pages/PipelineView.jsx';

import { Activity, LogOut, Home, Users, AlertTriangle, Info } from 'lucide-react';

// Guard for authenticated session
function AuthGuard({ children, allowedRoles }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'supervisor' ? '/supervisor' : '/'} replace />;
  }

  return children;
}

// Global Layout containing official institutional headers
function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isWorker = user?.role === 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] relative">
      {/* Subtle Page-Level Top Border Under the Viewport */}
      <div className="h-[3px] bg-[#0F9B8E] w-full z-50"></div>

      {/* Institutional Top Navbar (56px) */}
      <header className="bg-[#0A1628] text-white shadow-md no-print border-b border-[#E2E8F0] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 bg-[#0F9B8E] p-0.5 rounded-sm">
              <div className="bg-white rounded-xs"></div>
              <div className="bg-white rounded-xs"></div>
              <div className="bg-white rounded-xs"></div>
              <div className="bg-[#0F9B8E] rounded-xs"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold tracking-tight text-white leading-none">SAHAYAK AI</h1>
              <p className="text-[10px] text-[#13B5A6] font-semibold mt-0.5 tracking-wider uppercase">
                National Health Mission • Decision Portal
              </p>
            </div>
          </div>
          
          {/* Dynamic Navigation Tabs (Requirements-compliant sliding transitions) */}
          <div className="hidden md:flex items-center space-x-6 h-full mt-1">
            {isWorker ? (
              <>
                <Link 
                  to="/" 
                  className={`relative px-1 h-[56px] flex items-center text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
                    location.pathname === '/' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Prioritized Tasks</span>
                  <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0F9B8E] transition-all duration-300 transform origin-left ${
                    location.pathname === '/' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`} />
                </Link>
                <Link 
                  to="/households" 
                  className={`relative px-1 h-[56px] flex items-center text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
                    location.pathname.startsWith('/households') ? 'text-white font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Household Ledger</span>
                  <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0F9B8E] transition-all duration-300 transform origin-left ${
                    location.pathname.startsWith('/households') ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`} />
                </Link>
              </>
            ) : (
              <Link 
                to="/supervisor" 
                className={`relative px-1 h-[56px] flex items-center text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
                  location.pathname === '/supervisor' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <span>Supervisor Dispatch</span>
                <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0F9B8E] transition-all duration-300 transform origin-left ${
                  location.pathname === '/supervisor' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                }`} />
              </Link>
            )}

            <Link 
              to="/pipeline" 
              className={`relative px-1 h-[56px] flex items-center text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
                location.pathname === '/pipeline' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Pipeline Audit</span>
              <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0F9B8E] transition-all duration-300 transform origin-left ${
                location.pathname === '/pipeline' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
              }`} />
            </Link>
          </div>

          {/* Right Account Panel & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name || 'Assigned Officer'}</p>
              <p className="text-[11px] font-bold text-[#13B5A6] uppercase">{user?.role} desk</p>
            </div>
            
            <button 
              onClick={logout}
              className="flex items-center space-x-1.5 hover:bg-white/10 text-white/95 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-white/20 transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#13B5A6]" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col focus-within:outline-none">
        
        {/* Safety Disclaimer box (Uniform clinical notice with info trigger) */}
        <div className="mb-6 bg-[#FFF7ED] border-l-4 border-[#EA580C] p-3 shadow-sm rounded-r flex items-start justify-between text-xs text-[#9A3412] no-print">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold uppercase tracking-wider text-[10px] block mb-0.5">CLINICAL SAFETY NOTICE</strong>
              <span>This tool assists prioritization and reporting. It does not diagnose or replace clinical judgment.</span>
            </div>
          </div>
          <div className="p-0.5 text-slate-400 hover:text-[#EA580C] transition-colors cursor-pointer" title="System Guidance System Info">
            <Info className="w-4 h-4 text-[#EA580C]" />
          </div>
        </div>

        {/* Route pages container with route fade-in opacity transitions */}
        <div key={location.pathname} className="flex-grow flex flex-col route-fade-enter">
          <Routes location={location}>
            {/* Worker Protected Routes */}
            <Route path="/" element={<AuthGuard allowedRoles={['worker']}><WorkerDashboard /></AuthGuard>} />
            <Route path="/households" element={<AuthGuard allowedRoles={['worker']}><Households /></AuthGuard>} />
            <Route path="/households/:id" element={<AuthGuard allowedRoles={['worker']}><HouseholdDetail /></AuthGuard>} />
            <Route path="/visits/new" element={<AuthGuard allowedRoles={['worker']}><RecordVisit /></AuthGuard>} />
            <Route path="/visits/:id" element={<AuthGuard allowedRoles={['worker']}><VisitDetail /></AuthGuard>} />

            {/* Supervisor Protected Routes */}
            <Route path="/supervisor" element={<AuthGuard allowedRoles={['supervisor']}><SupervisorDashboard /></AuthGuard>} />
            <Route path="/supervisor/workers/:workerId" element={<AuthGuard allowedRoles={['supervisor']}><WorkerView /></AuthGuard>} />

            {/* Shared Protected Routes */}
            <Route path="/pipeline" element={<AuthGuard><PipelineView /></AuthGuard>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 text-center text-xs text-slate-500 no-print">
        <p className="font-semibold">© 2026 Ministry of Health & Family Welfare • Sahayak Decision Triage Platform</p>
      </footer>
    </div>
  );
}

export default function Router() {
  const [offlineActive, setOfflineActive] = useState(false);

  useEffect(() => {
    const checkOffline = async () => {
      try {
        const res = await api.get('/debug/offline-mode');
        setOfflineActive(!!res.data.enabled);
      } catch (e) {
        // ignore
      }
    };
    checkOffline();
    const interval = setInterval(checkOffline, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      {offlineActive && (
        <div className="bg-[#D97706] text-white text-xs font-semibold text-center py-2 px-4 shadow-md z-[9999] sticky top-0 flex items-center justify-center space-x-2 no-print">
          <span>⚠ OFFLINE SIMULATION ACTIVE — Running in fallback mode. AI services bypassed. Toggle off in Pipeline Audit.</span>
        </div>
      )}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Pages */}
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
