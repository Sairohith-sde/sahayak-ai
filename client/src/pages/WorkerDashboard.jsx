import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Plus, Clock, Calendar, Users, AlertTriangle, ChevronRight, Activity, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

function CountUp({ end, duration = 1000, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endNum = parseInt(end, 10);
    if (isNaN(endNum)) {
      setCount(end);
      return;
    }
    const totalMiliseconds = duration;
    const stepTime = Math.max(Math.floor(totalMiliseconds / 50), 15);
    const stepValue = Math.ceil(endNum / (totalMiliseconds / stepTime));

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= endNum) {
        clearInterval(timer);
        setCount(endNum);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  const formatted = count.toLocaleString('en-IN');
  return <span>{formatted}{suffix}</span>;
}

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const workerId = user?._id || user?.id;

  // 1. Load Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', workerId],
    queryFn: async () => {
      const res = await api.get(`/dashboard?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  // 2. Load Households
  const { data: households, isLoading: householdsLoading } = useQuery({
    queryKey: ['households', workerId],
    queryFn: async () => {
      const res = await api.get(`/households?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  // 3. Load Visits (to find latest status for each household)
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['visits', workerId],
    queryFn: async () => {
      const res = await api.get(`/visits?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  if (statsLoading || householdsLoading || visitsLoading) {
    return (
      <div className="space-y-6">
        {/* Shimmering Skeletons for Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-[#0b1329]/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="h-3.5 bg-slate-800 animate-pulse rounded w-24"></div>
              <div className="h-8 bg-slate-800 animate-pulse rounded w-12 mt-2"></div>
            </div>
          ))}
        </div>
        {/* Shimmering Skeletons for Table */}
        <div className="bg-[#0b1329]/20 rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="h-12 bg-slate-900/60 animate-pulse"></div>
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 flex items-center justify-between px-6 gap-4">
                <div className="h-4 bg-slate-800/60 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-slate-800/60 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-slate-800/60 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-slate-800/60 rounded w-48 animate-pulse hidden md:block"></div>
                <div className="h-4 bg-slate-800/60 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Map each household to its latest visit
  const latestVisitMap = {};
  if (visits) {
    visits.forEach(v => {
      const hId = String(v.householdId);
      if (!latestVisitMap[hId] || new Date(v.timestamp) > new Date(latestVisitMap[hId].timestamp)) {
        latestVisitMap[hId] = v;
      }
    });
  }

  // Compile list of households with latest status
  const prioritizedHouseholds = (households || []).map(h => {
    const latestVisit = latestVisitMap[String(h._id || h.id)] || null;
    return {
      ...h,
      latestVisit,
      riskLevel: latestVisit ? latestVisit.riskLevel : 'low',
      riskJustification: latestVisit ? latestVisit.riskJustification : 'No visits recorded yet. Scheduled for routine intake.',
      lastVisitDate: latestVisit ? new Date(latestVisit.timestamp).toLocaleDateString('en-IN') : 'Never'
    };
  });

  // Custom sort priority (Critical -> High -> Medium -> Low)
  const getRiskValue = (level) => {
    switch (String(level).toLowerCase()) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  prioritizedHouseholds.sort((a, b) => {
    const valueA = getRiskValue(a.riskLevel);
    const valueB = getRiskValue(b.riskLevel);
    if (valueA !== valueB) return valueB - valueA;
    return a.name.localeCompare(b.name);
  });

  const getBadgeStyle = (level) => {
    switch (String(level).toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 border border-red-500/25 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      case 'high':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.1)]';
      case 'medium':
        return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200';
      default:
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200';
    }
  };

  const hasCriticalCases = stats?.criticalCount > 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-tight font-display">
            Prioritized Task Desk
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Welcome back, <span className="text-teal-400 font-extrabold">{user?.name}</span> • Sector A Community Care
          </p>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-slate-900/40 border border-white/5 rounded-xl text-xs font-bold text-slate-300 backdrop-blur-md">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          
          <Link
            to="/visits/new"
            className={`flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase px-4 h-10 rounded-xl tracking-wider transition-all duration-150 shadow-lg active:scale-[0.98] cursor-pointer ${
              hasCriticalCases ? 'pulse-critical-action animate-pulse' : ''
            }`}
          >
            <Plus className="w-4.5 h-4.5 text-white" />
            <span>Record New Visit</span>
          </Link>
        </div>
      </div>

      {/* NHM Impact Ticker */}
      <div className="bg-[#0b1329]/40 rounded-2xl p-5 border border-white/5 shadow-2xl text-white no-print backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-2 mb-4 border-b border-white/5 pb-2.5">
          <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-teal-400">National Health Mission Impact Metric Feed</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-black text-teal-400 tracking-tight font-display">
              <CountUp end="980000" suffix="+" />
            </span>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              ASHA Workers Empowered
            </span>
          </div>
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-black text-teal-400 tracking-tight font-display">
              <CountUp end="600000000" suffix="+" />
            </span>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Rural Indian Lives Touched
            </span>
          </div>
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-black text-teal-400 tracking-tight font-display">
              ~<CountUp end="20" suffix="%" />
            </span>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Maternal & Pediatric Triage Optimization Rate
            </span>
          </div>
        </div>
      </div>

      {/* 2. Worker Summary Stats (4 Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Total Households */}
        <div className="bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Households</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/15">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-white leading-none block mt-2 font-display">
              {stats?.totalHouseholds || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 2: Critical Cases */}
        <div className={`bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl border-l-4 border-l-red-500 flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group ${stats?.criticalCount > 0 ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/20' : ''}`}>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-red-500/5 rounded-full blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Critical Cases</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/15 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-red-400 leading-none block mt-2 font-display">
              {stats?.criticalCount || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 3: High Cases */}
        <div className={`bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl border-l-4 border-l-amber-500 flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group ${stats?.highCount > 0 ? 'shadow-[0_0_15px_rgba(245,158,11,0.12)] border-amber-500/20' : ''}`}>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">High Priority</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/15">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-amber-400 leading-none block mt-2 font-display">
              {stats?.highCount || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 4: Weekly Performance */}
        <div className="bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-teal-500/5 rounded-full blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Visits This Week</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/15">
                <Activity className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-teal-400 leading-none block mt-2 font-display">
              {stats?.visitsThisWeek || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Prioritized Task Table / Ledger */}
      <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative backdrop-blur-sm">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-2xl -z-10 blur-sm"></div>

        {/* Table Header Section */}
        <div className="bg-[#0b1329]/60 px-6 py-4.5 flex items-center justify-between border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
            Risk-Prioritized Action Ledger
          </h3>
          <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-lg">
            Triage Rank Sorting
          </span>
        </div>

        {prioritizedHouseholds.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <svg className="w-16 h-16 text-slate-600 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="max-w-sm mx-auto">
              <p className="font-extrabold text-white text-sm">No households assigned yet.</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">Please select the Household Ledger from the top navigation to enroll clinical checkup logs.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest h-11">
                  <th className="px-6 py-2">Household Name</th>
                  <th className="px-6 py-2">Village Sector</th>
                  <th className="px-6 py-2">Triage Level</th>
                  <th className="px-6 py-2 hidden lg:table-cell">Decision Support / Urgent Indicators</th>
                  <th className="px-6 py-2">Last Checked</th>
                  <th className="px-6 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {prioritizedHouseholds.map((h, idx) => {
                  const isCritical = h.riskLevel?.toLowerCase() === 'critical';
                  const badgeStyle = getBadgeStyle(h.riskLevel);
                  
                  return (
                    <tr 
                      key={h._id || h.id} 
                      className={`h-16 transition-all duration-150 hover:bg-white/5 ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-950/20'
                      } ${
                        isCritical 
                          ? 'border-l-4 border-l-red-500 bg-red-500/5' 
                          : ''
                      }`}
                      style={{
                        animation: 'routeFadeIn 250ms ease-out both',
                        animationDelay: `${idx * 40}ms`
                      }}
                    >
                      {/* Name + Category */}
                      <td className="px-6 py-3 font-semibold text-white">
                        <span className="block font-bold text-white hover:text-teal-400 transition-colors">{h.name}</span>
                        <span className="block text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">
                          {h.category?.toUpperCase() || 'GENERAL CHECK'}
                        </span>
                      </td>
                      
                      {/* Village */}
                      <td className="px-6 py-3 text-xs text-slate-300 font-bold">
                        {h.village}
                      </td>
                      
                      {/* Triage Badge */}
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-lg tracking-wider leading-none shadow-sm ${badgeStyle}`}>
                          {h.riskLevel?.toUpperCase()}
                        </span>
                      </td>
                      
                      {/* Decision Summary */}
                      <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-400 font-medium max-w-xs truncate leading-relaxed">
                        {h.riskJustification}
                      </td>
                      
                      {/* Last Checked */}
                      <td className="px-6 py-3 text-xs text-slate-400 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-400/80" />
                          <span>{h.lastVisitDate}</span>
                        </div>
                      </td>
                      
                      {/* Action buttons */}
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/households/${h._id || h.id}`}
                            className="h-8 flex items-center justify-center px-3.5 border border-white/10 hover:border-white/20 bg-slate-950/30 hover:bg-slate-900/60 text-slate-300 font-extrabold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                          >
                            History
                          </Link>
                          {h.latestVisit ? (
                            <Link
                              to={`/visits/${h.latestVisit._id || h.latestVisit.id}`}
                              className="h-8 flex items-center justify-center px-3.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 font-black text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                            >
                              Report
                            </Link>
                          ) : (
                            <Link
                              to="/visits/new"
                              state={{ householdId: h._id || h.id }}
                              className="h-8 flex items-center justify-center px-3.5 bg-gradient-to-r from-teal-600/10 to-cyan-600/10 hover:from-teal-600/20 hover:to-cyan-600/20 text-teal-300 border border-teal-500/25 font-black text-xs rounded-xl transition-all cursor-pointer"
                            >
                              New
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
