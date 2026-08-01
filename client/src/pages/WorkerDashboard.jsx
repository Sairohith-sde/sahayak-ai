import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Plus, Clock, Calendar, Users, AlertTriangle, ChevronRight, Activity, ArrowRight, BookOpen } from 'lucide-react';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm">
              <div className="h-3 w-24 skeleton-shimmer rounded"></div>
              <div className="h-8 w-12 skeleton-shimmer rounded mt-2"></div>
            </div>
          ))}
        </div>
        {/* Shimmering Skeletons for Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow overflow-hidden">
          <div className="h-11 bg-slate-900 skeleton-shimmer"></div>
          <div className="divide-y divide-slate-200">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 flex items-center justify-between px-6 gap-4">
                <div className="h-4 w-32 skeleton-shimmer rounded"></div>
                <div className="h-4 w-20 skeleton-shimmer rounded"></div>
                <div className="h-6 w-16 skeleton-shimmer rounded"></div>
                <div className="h-4 w-48 skeleton-shimmer rounded hidden md:block"></div>
                <div className="h-4 w-12 skeleton-shimmer rounded"></div>
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
        return 'bg-[#DC2626] text-white';
      case 'high':
        return 'bg-[#EA580C] text-white';
      case 'medium':
        return 'bg-[#FEFCE8] border border-[#CA8A04] text-[#854D0E]';
      default:
        return 'bg-[#F0FDF4] border border-[#16A34A] text-[#166534]';
    }
  };

  const hasCriticalCases = stats?.criticalCount > 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] pb-5 gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#0A1628] uppercase tracking-tight">
            Prioritized Task Desk
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Welcome back, <span className="text-[#0D7A6F] font-semibold">{user?.name}</span> • Sector A Community Care
          </p>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-2 bg-[#EEF1F6] border border-[#E2E8F0] rounded-lg text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          
          <Link
            to="/visits/new"
            className={`flex items-center space-x-2 bg-[#0D7A6F] hover:bg-[#0F9B8E] text-white font-bold text-xs uppercase px-4 h-10 rounded-lg tracking-wider transition-all duration-150 shadow-md ${
              hasCriticalCases ? 'pulse-critical-action' : ''
            }`}
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Record New Visit</span>
          </Link>
        </div>
      </div>

      {/* NHM Impact Ticker (IMPROVEMENT 3) */}
      <div className="bg-[#0A1628] rounded-xl p-5 border border-[#1E3F75] shadow-md text-white no-print">
        <div className="flex items-center space-x-2 mb-3 border-b border-[#1E3F75] pb-2">
          <Activity className="w-4 h-4 text-[#13B5A6] animate-pulse" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#13B5A6]">National Health Mission Impact Metric Feed</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#1E3F75]">
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#13B5A6] tracking-tight">
              <CountUp end="980000" suffix="+" />
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              ASHA Workers Empowered
            </span>
          </div>
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#13B5A6] tracking-tight">
              <CountUp end="600000000" suffix="+" />
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Rural Indian Lives Touched
            </span>
          </div>
          <div className="text-center pt-3 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#13B5A6] tracking-tight">
              ~<CountUp end="20" suffix="%" />
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Maternal & Pediatric Triage Optimization Rate
            </span>
          </div>
        </div>
      </div>

      {/* 2. Worker Summary Stats (4 Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Total Households */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Households</span>
              <div className="w-7 h-7 rounded-full bg-[#EEF1F6] flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#0A1628] leading-none block mt-2">
              {stats?.totalHouseholds || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 2: Critical Cases */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] border-l-4 border-l-[#DC2626] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Critical Cases</span>
              <div className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#991B1B] leading-none block mt-2">
              {stats?.criticalCount || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 3: High Cases */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] border-l-4 border-l-[#EA580C] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">High Priority</span>
              <div className="w-7 h-7 rounded-full bg-[#FFF7ED] flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#9A3412] leading-none block mt-2">
              {stats?.highCount || 0}
            </span>
          </div>
        </div>

        {/* Stat Card 4: Weekly Performance */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Visits This Week</span>
              <div className="w-7 h-7 rounded-full bg-[#E0F5F3] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-[#0D7A6F]" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#1E3F75] leading-none block mt-2">
              {stats?.visitsThisWeek || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Prioritized Task Table / Ledger */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table Header Section */}
        <div className="bg-[#0A1628] px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Risk-Prioritized Action Ledger
          </h3>
          <span className="text-[10px] text-[#13B5A6] font-bold uppercase tracking-wider bg-slate-800 px-3 py-1 rounded">
            Triage Rank Sorting
          </span>
        </div>

        {prioritizedHouseholds.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            {/* Beautiful inline SVG empty state */}
            <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="max-w-sm mx-auto">
              <p className="font-semibold text-slate-700">No households assigned yet.</p>
              <p className="text-xs text-slate-400 mt-1">Please select the Household Ledger from the top navigation to enroll clinical checkup logs.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF1F6] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-slate-500 tracking-[0.08em] h-11">
                  <th className="px-6 py-2">Household Name</th>
                  <th className="px-6 py-2">Village Sector</th>
                  <th className="px-6 py-2">Triage Level</th>
                  <th className="px-6 py-2 hidden lg:table-cell">Decision Support / Urgent Indicators</th>
                  <th className="px-6 py-2">Last Checked</th>
                  <th className="px-6 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {prioritizedHouseholds.map((h, idx) => {
                  const isCritical = h.riskLevel?.toLowerCase() === 'critical';
                  const badgeStyle = getBadgeStyle(h.riskLevel);
                  
                  return (
                    <tr 
                      key={h._id || h.id} 
                      className={`h-16 transition-colors duration-150 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#EEF1F6]'
                      } ${
                        isCritical 
                          ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]' 
                          : ''
                      }`}
                      style={{
                        animation: 'routeFadeIn 250ms ease-out both',
                        animationDelay: `${idx * 50}ms`
                      }}
                    >
                      {/* Name + Category */}
                      <td className="px-6 py-3 font-semibold text-[#0A1628]">
                        <span className="block font-semibold text-[#0A1628]">{h.name}</span>
                        <span className="block text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                          {h.category?.toUpperCase() || 'GENERAL CHECK'}
                        </span>
                      </td>
                      
                      {/* Village */}
                      <td className="px-6 py-3 text-sm text-slate-500 font-semibold">
                        {h.village}
                      </td>
                      
                      {/* Triage Badge */}
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-[6px] tracking-wider leading-none shadow-sm ${badgeStyle}`}>
                          {h.riskLevel?.toUpperCase()}
                        </span>
                      </td>
                      
                      {/* Decision Summary */}
                      <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-500 font-medium max-w-xs truncate">
                        {h.riskJustification}
                      </td>
                      
                      {/* Last Checked */}
                      <td className="px-6 py-3 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{h.lastVisitDate}</span>
                        </div>
                      </td>
                      
                      {/* Action buttons */}
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/households/${h._id || h.id}`}
                            className="h-8 flex items-center justify-center px-3.5 border border-[#1A3461] hover:bg-[#EEF1F6] text-[#1E3F75] font-semibold text-xs rounded-md transition-all active:scale-[0.98] cursor-pointer"
                          >
                            History
                          </Link>
                          {h.latestVisit ? (
                            <Link
                              to={`/visits/${h.latestVisit._id || h.latestVisit.id}`}
                              className="h-8 flex items-center justify-center px-3.5 bg-[#0D7A6F] hover:bg-[#0F9B8E] text-white font-bold text-xs rounded-md transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                            >
                              Report
                            </Link>
                          ) : (
                            <Link
                              to="/visits/new"
                              state={{ householdId: h._id || h.id }}
                              className="h-8 flex items-center justify-center px-3 bg-[#EEF1F6] hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-md transition-all cursor-pointer border border-slate-300"
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
