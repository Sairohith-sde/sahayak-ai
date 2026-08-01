import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Shield, CheckCircle, Clock, AlertTriangle, User, Users, Check, ExternalLink, Calendar, HelpCircle, X } from 'lucide-react';

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-lg p-4 skeleton-shimmer"></div>
          ))}
        </div>
        <div className="h-96 bg-white border border-slate-200 rounded-lg skeleton-shimmer"></div>
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
        return 'bg-[#DC2626] text-white';
      case 'high':
        return 'bg-[#EA580C] text-white';
      case 'medium':
        return 'bg-[#FEFCE8] border border-[#CA8A04] text-[#854D0E]';
      default:
        return 'bg-[#F0FDF4] border border-[#16A34A] text-[#166534]';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] pb-5 gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#0A1628] uppercase tracking-tight">
            ESCALATION COMMAND CENTRE
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Active escalations requiring supervisor review • Portal ID: <span className="text-[#0D7A6F] font-semibold">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center space-x-1.5 px-3 py-2 bg-[#EEF1F6] border border-[#E2E8F0] rounded-lg text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar (Unresolved, Resolved, Supervised Workers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unresolved count */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] border-l-4 border-l-[#DC2626] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unresolved Alerts</span>
              <div className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#991B1B] leading-none block mt-2">
              {stats?.unresolvedCount || 0}
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] border-l-4 border-l-[#16A34A] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Escalations</span>
              <div className="w-7 h-7 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#166534] leading-none block mt-2">
              {stats?.resolvedCount || 0}
            </span>
          </div>
        </div>

        {/* Total Supervised Workers */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] h-28 relative overflow-hidden hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Supervised Workers</span>
              <div className="w-7 h-7 rounded-full bg-[#EEF1F6] flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>
            <span className="text-32 font-bold text-[#1E3F75] leading-none block mt-2">
              {stats?.totalWorkers || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Escalation Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table Header Row */}
        <div className="bg-[#0A1628] px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            <span>CRITICAL CLINICAL ALERTS ACTION LEDGER</span>
          </h3>
          <span className="text-[10px] text-[#13B5A6] font-bold uppercase tracking-wider bg-slate-800 px-3 py-1 rounded">
            Audit Feed Protocol
          </span>
        </div>

        {(!sortedEscalations || sortedEscalations.length === 0) ? (
          <div className="p-16 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-[#16A34A] mx-auto" />
            <div className="max-w-sm mx-auto">
              <p className="font-semibold text-slate-700">Zero Active Escalations</p>
              <p className="text-xs text-slate-400 mt-1">All field worker reports are normal and triage indicators are under routine threshold management.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md:block hidden) */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF1F6] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-slate-500 tracking-[0.08em] h-11">
                    <th className="px-6 py-2">Household Name</th>
                    <th className="px-6 py-2">Village Sector</th>
                    <th className="px-6 py-2">Assigned Worker</th>
                    <th className="px-6 py-2">Triage Priority</th>
                    <th className="px-6 py-2 hidden lg:table-cell">Decision Justification</th>
                    <th className="px-6 py-2">Escalated At</th>
                    <th className="px-6 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sortedEscalations.map((esc, idx) => {
                    const isCritical = esc.visit?.riskLevel?.toLowerCase() === 'critical';
                    const isResolved = esc.resolved;
                    const badgeStyle = getRiskBadge(esc.visit?.riskLevel);

                    return (
                      <tr 
                        key={esc._id || esc.id} 
                        className={`h-16 transition-all duration-150 ${
                          isResolved 
                            ? 'bg-slate-100 opacity-60 text-slate-400 font-medium' 
                            : idx % 2 === 0 ? 'bg-white' : 'bg-[#EEF1F6]'
                        } ${
                          isCritical && !isResolved
                            ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]' 
                            : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-3 font-semibold text-[#0A1628]">
                          <span className={`block ${isResolved ? 'line-through text-slate-400' : 'text-[#0A1628]'}`}>
                            {esc.household?.name || 'Unknown Location'}
                          </span>
                        </td>

                        {/* Village */}
                        <td className="px-6 py-3 text-sm font-semibold text-slate-500">
                          {esc.household?.village || 'Unknown'}
                        </td>

                        {/* Assigned Worker */}
                        <td className="px-6 py-3 font-semibold text-slate-700">
                          <Link 
                            to={`/supervisor/workers/${esc.worker?.id || esc.worker?._id}`}
                            className="flex items-center space-x-1 hover:text-[#0D7A6F] hover:underline"
                          >
                            <span>{esc.worker?.name || 'Assigned Worker'}</span>
                            <ExternalLink className="w-3 h-3 text-[#13B5A6]" />
                          </Link>
                        </td>

                        {/* Priority Badge */}
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-[6px] tracking-wider leading-none shadow-sm ${badgeStyle}`}>
                            {esc.visit?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>

                        {/* Justification Text */}
                        <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-500 font-medium max-w-xs truncate">
                          {esc.visit?.riskJustification}
                        </td>

                        {/* Escalated At */}
                        <td className="px-6 py-3 text-xs font-semibold text-slate-500">
                          <div className="flex items-center space-x-1.5" title={new Date(esc.createdAt).toLocaleString('en-IN')}>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(esc.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/visits/${esc.visit?._id || esc.visit?.id || esc.visitId}`}
                              className="h-8 flex items-center justify-center px-3.5 border border-[#1A3461] hover:bg-[#EEF1F6] text-[#1E3F75] font-semibold text-xs rounded-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                              Review File
                            </Link>
                            {isResolved ? (
                              <button
                                disabled
                                className="h-8 flex items-center space-x-1 px-3 bg-slate-200 text-slate-400 font-bold text-xs rounded-md border border-slate-300 cursor-not-allowed uppercase"
                              >
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                                <span>Resolved</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResolve(esc._id || esc.id)}
                                className="h-8 flex items-center space-x-1 px-3 bg-white border border-[#16A34A] hover:bg-[#F0FDF4] text-[#166534] font-bold text-xs rounded-md transition-all active:scale-[0.98] cursor-pointer uppercase shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[3px]" />
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

            {/* Mobile Cards View (block md:hidden) - IMPROVEMENT 6 */}
            <div className="block md:hidden space-y-4 p-4 bg-slate-50">
              {sortedEscalations.map((esc) => {
                const isCritical = esc.visit?.riskLevel?.toLowerCase() === 'critical';
                const isResolved = esc.resolved;
                const badgeStyle = getRiskBadge(esc.visit?.riskLevel);

                return (
                  <div 
                    key={esc._id || esc.id} 
                    className={`p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 relative overflow-hidden ${
                      isCritical && !isResolved ? 'border-l-4 border-l-[#DC2626]' : ''
                    } ${isResolved ? 'opacity-60 bg-slate-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold text-sm text-[#0A1628] ${isResolved ? 'line-through text-slate-400' : ''}`}>
                          {esc.household?.name || 'Unknown Location'}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                          {esc.household?.village || 'Unknown Sector'}
                        </p>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider shadow-xs ${badgeStyle}`}>
                        {esc.visit?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Assigned Worker:</span>
                        <Link 
                          to={`/supervisor/workers/${esc.worker?.id || esc.worker?._id}`}
                          className="font-bold text-[#0D7A6F] flex items-center space-x-1"
                        >
                          <span>{esc.worker?.name || 'Assigned Worker'}</span>
                          <ExternalLink className="w-3 h-3 text-[#13B5A6]" />
                        </Link>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Escalated At:</span>
                        <span className="font-semibold text-slate-500">{new Date(esc.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      <div className="space-y-1 mt-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Decision Justification (Un-truncated):</span>
                        <p className="font-medium text-slate-600 bg-slate-50 p-2.5 rounded border text-[11px] leading-relaxed">
                          {esc.visit?.riskJustification || 'No clinical justification provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                      <Link
                        to={`/visits/${esc.visit?._id || esc.visit?.id || esc.visitId}`}
                        className="h-9 flex items-center justify-center px-4 border border-[#1A3461] hover:bg-[#EEF1F6] text-[#1E3F75] font-semibold text-xs rounded-md transition-all cursor-pointer flex-grow text-center"
                      >
                        Review File
                      </Link>
                      {isResolved ? (
                        <button
                          disabled
                          className="h-9 flex items-center justify-center space-x-1 px-4 bg-slate-200 text-slate-400 font-bold text-xs rounded-md border border-slate-300 cursor-not-allowed uppercase flex-grow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResolve(esc._id || esc.id)}
                          className="h-9 flex items-center justify-center space-x-1 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-md transition-all cursor-pointer uppercase shadow-sm flex-grow"
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

      {/* Mobile Floating Status Bar (IMPROVEMENT 6) */}
      <div className="fixed bottom-4 left-4 right-4 bg-[#0A1628]/95 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-[#1E3F75] shadow-2xl z-40 flex items-center justify-between md:hidden animate-slide-up no-print">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#13B5A6]">NHM Live Alerts</span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-bold divide-x divide-[#1E3F75]">
          <div className="pl-4">
            <span className="text-red-400">{stats?.unresolvedCount || 0}</span>
            <span className="text-slate-400 text-[9px] uppercase tracking-wider ml-1">Urgent</span>
          </div>
          <div className="pl-4">
            <span className="text-green-400">{stats?.resolvedCount || 0}</span>
            <span className="text-slate-400 text-[9px] uppercase tracking-wider ml-1">Resolved</span>
          </div>
          <div className="pl-4">
            <span className="text-slate-300">{stats?.totalWorkers || 0}</span>
            <span className="text-slate-400 text-[9px] uppercase tracking-wider ml-1">Workers</span>
          </div>
        </div>
      </div>

      {/* 8-Second Auto-Dismissing Critical Alert Toast (IMPROVEMENT 6) */}
      {activeToast && (
        <div className="fixed top-20 right-4 max-w-sm bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl p-4 shadow-2xl z-[9999] animate-slide-in no-print">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0 border border-[#FECACA]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] animate-pulse" />
            </div>
            <div className="flex-grow space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#991B1B] uppercase tracking-widest">CRITICAL FIELD ESCALATION</span>
                <button 
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Patient: {activeToast.household}
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                Worker: {activeToast.worker}
              </p>
              <p className="text-[11px] text-slate-600 font-medium leading-normal bg-white p-2 border rounded mt-1.5">
                {activeToast.reason}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
