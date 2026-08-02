import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Shield, CheckCircle, Clock, AlertTriangle, User, Users, Check, ExternalLink, Calendar, HelpCircle, X, ShieldAlert } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuthStore();
  const supervisorId = user?._id || user?.id;
  const queryClient = useQueryClient();
  const [activeToast, setActiveToast] = useState(null);

  // 1. Fetch Supervisor Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['supervisor-dashboard', supervisorId],
    queryFn: async () => {
      const res = await api.get(`/dashboard/supervisor?supervisorId=${supervisorId}`);
      return res.data;
    },
    enabled: !!supervisorId
  });

  // 2. Fetch Escalations
  const { data: escalations, isLoading: escalationsLoading } = useQuery({
    queryKey: ['supervisor-escalations', supervisorId],
    queryFn: async () => {
      const res = await api.get(`/supervisor/escalations?supervisorId=${supervisorId}`);
      return res.data;
    },
    enabled: !!supervisorId
  });

  // 3. Resolve Escalation Mutation
  const resolveMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/supervisor/escalations/${id}`, { resolved: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-escalations', supervisorId] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard', supervisorId] });
    }
  });

  const handleResolve = (id) => {
    if (confirm("Are you sure you want to mark this critical clinical alert as resolved?")) {
      resolveMutation.mutate(id);
    }
  };

  useEffect(() => {
    // Find the first unresolved critical escalation
    const criticalEscalation = (escalations || []).find(esc => !esc.resolved && esc.visit?.riskLevel?.toLowerCase() === 'critical');
    if (criticalEscalation) {
      setActiveToast({
        id: criticalEscalation._id || criticalEscalation.id,
        household: criticalEscalation.household?.name || 'Assigned Household',
        worker: criticalEscalation.worker?.name || 'Field Worker',
        reason: criticalEscalation.visit?.riskJustification || 'Critical clinical indicators detected.'
      });

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 8000); // 8 seconds auto-dismiss

      return () => clearTimeout(timer);
    }
  }, [escalations]);

  if (statsLoading || escalationsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-[#0b1329]/40 border border-white/5 rounded-2xl p-5 skeleton-shimmer animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-[#0b1329]/20 border border-white/5 rounded-2xl skeleton-shimmer animate-pulse"></div>
      </div>
    );
  }

  // Dynamic sorting: unresolved escalations float to top, resolved ones sink to bottom automatically
  const sortedEscalations = [...(escalations || [])].sort((a, b) => {
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getRiskBadge = (level) => {
    switch (String(level).toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 border border-red-500/25 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse';
      case 'high':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.1)]';
      case 'medium':
        return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200';
      default:
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-tight font-display bg-clip-text">
            ESCALATION COMMAND CENTRE
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Active escalations requiring supervisor review • Portal ID: <span className="text-teal-400 font-extrabold">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center space-x-2 px-3 py-2 bg-slate-900/40 border border-white/5 rounded-xl text-xs font-bold text-slate-300 backdrop-blur-md">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar (Unresolved, Resolved, Supervised Workers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Unresolved count */}
        <div className={`bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl border-l-4 border-l-red-500 flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group ${stats?.unresolvedCount > 0 ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/20' : ''}`}>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-red-500/5 rounded-full blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Unresolved Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/15 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-red-400 leading-none block mt-2 font-display">
              {stats?.unresolvedCount || 0}
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Resolved Escalations</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-400 leading-none block mt-2 font-display">
              {stats?.resolvedCount || 0}
            </span>
          </div>
        </div>

        {/* Total Supervised Workers */}
        <div className="bg-[#0b1329]/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Supervised Workers</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/15">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-white block mt-2 font-display leading-none">
              {stats?.totalWorkers || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Escalation Table */}
      <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative backdrop-blur-sm">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-2xl -z-10 blur-sm"></div>

        {/* Table Header Row */}
        <div className="bg-[#0b1329]/60 px-6 py-4.5 flex items-center justify-between border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400 animate-pulse" />
            <span>CRITICAL CLINICAL ALERTS ACTION LEDGER</span>
          </h3>
          <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-lg">
            Audit Feed Protocol
          </span>
        </div>

        {(!sortedEscalations || sortedEscalations.length === 0) ? (
          <div className="p-16 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-pulse" />
            <div className="max-w-sm mx-auto">
              <p className="font-extrabold text-white text-sm">Zero Active Escalations</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">All field worker reports are normal and triage indicators are under routine threshold management.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest h-11">
                    <th className="px-6 py-2">Household Name</th>
                    <th className="px-6 py-2">Village Sector</th>
                    <th className="px-6 py-2">Assigned Worker</th>
                    <th className="px-6 py-2">Triage Priority</th>
                    <th className="px-6 py-2 hidden lg:table-cell">Decision Justification</th>
                    <th className="px-6 py-2">Escalated At</th>
                    <th className="px-6 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedEscalations.map((esc, idx) => {
                    const isCritical = esc.visit?.riskLevel?.toLowerCase() === 'critical';
                    const isResolved = esc.resolved;
                    const badgeStyle = getRiskBadge(esc.visit?.riskLevel);

                    return (
                      <tr 
                        key={esc._id || esc.id} 
                        className={`h-16 transition-all duration-150 hover:bg-white/5 ${
                          isResolved 
                            ? 'bg-slate-950/10 opacity-50 text-slate-500 font-medium' 
                            : idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-950/20'
                        } ${
                          isCritical && !isResolved
                            ? 'border-l-4 border-l-red-500 bg-red-500/5' 
                            : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-3 font-semibold">
                          <span className={`block font-bold text-white ${isResolved ? 'line-through text-slate-500' : 'text-white hover:text-teal-400 transition-colors'}`}>
                            {esc.household?.name || 'Unknown Location'}
                          </span>
                        </td>

                        {/* Village */}
                        <td className="px-6 py-3 text-xs font-bold text-slate-300">
                          {esc.household?.village || 'Unknown'}
                        </td>

                        {/* Assigned Worker */}
                        <td className="px-6 py-3 font-semibold text-slate-300 text-xs">
                          <Link 
                            to={`/supervisor/workers/${esc.worker?.id || esc.worker?._id}`}
                            className="flex items-center space-x-1 hover:text-teal-400 hover:underline"
                          >
                            <span>{esc.worker?.name || 'Assigned Worker'}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                          </Link>
                        </td>

                        {/* Priority Badge */}
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-lg tracking-wider leading-none shadow-sm ${badgeStyle}`}>
                            {esc.visit?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>

                        {/* Justification Text */}
                        <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-400 font-medium max-w-xs truncate leading-relaxed">
                          {esc.visit?.riskJustification}
                        </td>

                        {/* Escalated At */}
                        <td className="px-6 py-3 text-xs font-semibold text-slate-400">
                          <div className="flex items-center space-x-1.5" title={new Date(esc.createdAt).toLocaleString('en-IN')}>
                            <Clock className="w-3.5 h-3.5 text-teal-400/80" />
                            <span>{new Date(esc.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/visits/${esc.visit?._id || esc.visit?.id || esc.visitId}`}
                              className="h-8 flex items-center justify-center px-3.5 border border-white/10 hover:border-white/20 bg-slate-950/30 hover:bg-slate-900/60 text-slate-300 font-extrabold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                            >
                              Review File
                            </Link>
                            {isResolved ? (
                              <button
                                disabled
                                className="h-8 flex items-center space-x-1.5 px-3 bg-slate-950/30 text-slate-600 font-extrabold text-xs rounded-xl border border-white/5 cursor-not-allowed uppercase"
                              >
                                <Check className="w-3.5 h-3.5 text-slate-600" />
                                <span>Resolved</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResolve(esc._id || esc.id)}
                                className="h-8 flex items-center space-x-1.5 px-3 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer uppercase shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3px]" />
                                <span>Mark Resolved</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 p-4 bg-slate-950/20">
              {sortedEscalations.map((esc) => {
                const isCritical = esc.visit?.riskLevel?.toLowerCase() === 'critical';
                const isResolved = esc.resolved;
                const badgeStyle = getRiskBadge(esc.visit?.riskLevel);

                return (
                  <div 
                    key={esc._id || esc.id} 
                    className={`p-4 rounded-xl border border-white/5 bg-[#0b1329]/40 backdrop-blur-md shadow-sm space-y-3 relative overflow-hidden ${
                      isCritical && !isResolved ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''
                    } ${isResolved ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold text-sm text-white ${isResolved ? 'line-through text-slate-500' : ''}`}>
                          {esc.household?.name || 'Unknown Location'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">
                          {esc.household?.village || 'Unknown Sector'}
                        </p>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase rounded-lg tracking-wider shadow-xs ${badgeStyle}`}>
                        {esc.visit?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-white/5 pt-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold uppercase text-[9px]">Assigned Worker:</span>
                        <Link 
                          to={`/supervisor/workers/${esc.worker?.id || esc.worker?._id}`}
                          className="font-bold text-teal-400 flex items-center space-x-1"
                        >
                          <span>{esc.worker?.name || 'Assigned Worker'}</span>
                          <ExternalLink className="w-3 h-3 text-teal-400" />
                        </Link>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold uppercase text-[9px]">Escalated At:</span>
                        <span className="font-semibold text-slate-400">{new Date(esc.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      <div className="space-y-1 mt-1">
                        <span className="text-slate-500 font-bold uppercase text-[9px] block">Decision Justification (Un-truncated):</span>
                        <p className="font-medium text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-[11px] leading-relaxed">
                          {esc.visit?.riskJustification || 'No clinical justification provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 border-t border-white/5 pt-3">
                      <Link
                        to={`/visits/${esc.visit?._id || esc.visit?.id || esc.visitId}`}
                        className="h-9 flex items-center justify-center px-4 border border-white/10 hover:bg-white/5 text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex-grow text-center"
                      >
                        Review File
                      </Link>
                      {isResolved ? (
                        <button
                          disabled
                          className="h-9 flex items-center justify-center space-x-1 px-4 bg-slate-950/30 text-slate-600 border border-white/5 font-extrabold text-xs rounded-xl cursor-not-allowed uppercase flex-grow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResolve(esc._id || esc.id)}
                          className="h-9 flex items-center justify-center space-x-1 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer uppercase shadow-lg flex-grow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Mobile Floating Status Bar */}
      <div className="fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-white/10 shadow-2xl z-40 flex items-center justify-between md:hidden animate-slide-up no-print">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">NHM Live Alerts</span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-bold divide-x divide-white/5">
          <div className="pl-4">
            <span className="text-red-400">{stats?.unresolvedCount || 0}</span>
            <span className="text-slate-500 text-[9px] uppercase tracking-widest ml-1">Urgent</span>
          </div>
          <div className="pl-4">
            <span className="text-emerald-400">{stats?.resolvedCount || 0}</span>
            <span className="text-slate-500 text-[9px] uppercase tracking-widest ml-1">Resolved</span>
          </div>
          <div className="pl-4">
            <span className="text-slate-300">{stats?.totalWorkers || 0}</span>
            <span className="text-slate-500 text-[9px] uppercase tracking-widest ml-1">Workers</span>
          </div>
        </div>
      </div>

      {/* 8-Second Auto-Dismissing Critical Alert Toast */}
      {activeToast && (
        <div className="fixed top-20 right-4 max-w-sm bg-slate-900/95 border-2 border-red-500/40 rounded-xl p-4 shadow-2xl z-[9999] animate-slide-in no-print backdrop-blur-md">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="flex-grow space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">CRITICAL FIELD ESCALATION</span>
                <button 
                  onClick={() => setActiveToast(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white uppercase">
                Patient: {activeToast.household}
              </h4>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase">
                Worker: {activeToast.worker}
              </p>
              <p className="text-[11px] text-slate-300 font-semibold leading-normal bg-slate-950/40 p-2.5 border border-white/5 rounded-lg mt-1.5">
                {activeToast.reason}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
