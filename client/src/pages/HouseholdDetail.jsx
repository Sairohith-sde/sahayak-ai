import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Home, Calendar, Clock, ArrowLeft, Clipboard, MapPin, AlertCircle, Activity, TrendingUp, TrendingDown, Minus, ArrowRight, Eye, ClipboardCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HouseholdDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const workerId = user?._id || user?.id;

  // 1. Fetch Household
  const { data: household, isLoading: householdLoading, error: householdError } = useQuery({
    queryKey: ['household', id],
    queryFn: async () => {
      const res = await api.get(`/households/${id}`);
      return res.data;
    }
  });

  // 2. Fetch all visits to filter for this household specifically
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['visits', workerId],
    queryFn: async () => {
      const res = await api.get(`/visits?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  if (householdLoading || visitsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#030712]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-400 mt-5 uppercase tracking-[0.15em] animate-pulse">Loading Case File...</p>
      </div>
    );
  }

  if (householdError) {
    return (
      <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl text-center backdrop-blur-md max-w-md mx-auto mt-12 shadow-2xl relative">
        <div className="absolute -inset-[1px] bg-red-500/10 rounded-2xl -z-10 blur-sm"></div>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 animate-bounce" />
        <h3 className="font-extrabold text-white text-base">Access Denied or Not Found</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">This household registry could not be found or you do not have permission to view it.</p>
        <Link to="/" className="inline-block mt-5 text-xs font-black text-teal-400 uppercase tracking-wider hover:text-teal-300 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filter and sort visits for this specific household
  const householdVisits = (visits || [])
    .filter(v => String(v.householdId) === String(id))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getRiskBadge = (level) => {
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

  const getCategoryLabel = (cat) => {
    switch (String(cat).toLowerCase()) {
      case 'maternal': return '🤰 Maternal Care';
      case 'child_nutrition': return '👶 Child Nutrition';
      case 'tb_hiv': return '💊 Infectious (TB/HIV) Monitoring';
      case 'immunization': return '💉 Childhood Immunization';
      default: return '🩺 General Healthcare';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
        <Link 
          to="/" 
          className="p-2 bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/60 rounded-xl text-slate-300 transition-all active:scale-[0.98]"
          title="Return to tasks list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-[20px] font-black text-white uppercase tracking-tight font-display">Household Case File</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Monitoring and Visit Log History</p>
        </div>
      </div>

      {/* Household Metadata Info Card */}
      <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl shadow-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 md:border-r border-white/5 pr-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Family Name</span>
          <p className="text-lg font-black text-white uppercase font-display">{household?.name}</p>
        </div>

        <div className="space-y-1.5 md:border-r border-white/5 pr-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Village Sector Location</span>
          <p className="text-base font-bold text-slate-200 flex items-center space-x-2">
            <MapPin className="w-4.5 h-4.5 text-teal-400" />
            <span>{household?.village}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Monitoring Category</span>
          <p className="text-sm font-extrabold text-teal-400 mt-1 uppercase tracking-wide">{getCategoryLabel(household?.category)}</p>
        </div>
      </div>

      {/* 4. Risk History Trend */}
      {(() => {
        const chartData = [...householdVisits]
          .reverse() // Oldest to newest
          .map(v => {
            const dateStr = new Date(v.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            let riskVal = 1;
            const lvl = String(v.riskLevel).toLowerCase();
            if (lvl === 'critical') riskVal = 4;
            else if (lvl === 'high') riskVal = 3;
            else if (lvl === 'medium') riskVal = 2;
            return {
              date: dateStr,
              risk: riskVal,
              displayLevel: v.riskLevel?.toUpperCase() || 'LOW'
            };
          });

        const getTrendAnalysis = () => {
          if (chartData.length === 0) {
            return {
              color: '#6b7280',
              label: 'Awaiting First Visit',
              icon: <Minus className="w-4 h-4 text-slate-400" />,
              desc: 'No visits have been logged for this family yet. Click "Log Visit" below to record their intake.'
            };
          }
          if (chartData.length < 2) {
            return {
              color: '#14b8a6',
              label: 'Stable Trend (Insf. Data)',
              icon: <Minus className="w-4 h-4 text-teal-400" />,
              desc: 'Single visit recorded. More checkups required to map longitudinal risk shifts.'
            };
          }
          const first = chartData[0].risk;
          const last = chartData[chartData.length - 1].risk;
          if (last > first) {
            return {
              color: '#f43f5e',
              label: 'Worsening Trend (Urgent Alert)',
              icon: <TrendingDown className="w-4 h-4 text-red-400" />,
              desc: 'Risk level has heightened over the monitoring span. Prioritize active clinical checkups.'
            };
          }
          if (last < first) {
            return {
              color: '#10b981',
              label: 'Improving Trend (Under Control)',
              icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
              desc: 'Risk profile is steadily declining. Frontline interventions are succeeding.'
            };
          }
          return {
            color: '#6366f1',
            label: 'Stable Risk Pattern',
            icon: <Minus className="w-4 h-4 text-indigo-400" />,
            desc: 'Risk levels are holding constant. Continue scheduled surveillance.'
          };
        };

        const trend = getTrendAnalysis();

        return (
          <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 backdrop-blur-sm">
            
            {/* Left 2 cols: Chart */}
            <div className="lg:col-span-2 p-6 md:border-r border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 font-display">
                    <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
                    <span>Clinical Triage Longitudinal Trend</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                    Risk severity mapped across sequential visits
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold italic uppercase tracking-wider bg-slate-950/20 border border-dashed border-white/5 rounded-xl">
                    No telemetry available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                        stroke="rgba(255, 255, 255, 0.1)"
                      />
                      <YAxis 
                        domain={[1, 4]} 
                        ticks={[1, 2, 3, 4]}
                        tickFormatter={(val) => {
                          if (val === 4) return 'CRIT';
                          if (val === 3) return 'HIGH';
                          if (val === 2) return 'MED';
                          return 'LOW';
                        }}
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                        stroke="rgba(255, 255, 255, 0.1)"
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 border border-white/10 p-2.5 rounded-xl shadow-2xl text-[10px] backdrop-blur-md">
                                <p className="font-extrabold text-slate-400 uppercase tracking-wider">{payload[0].payload.date}</p>
                                <p className="font-bold text-white mt-1 uppercase">
                                  RISK: <span className="font-black text-teal-400">{payload[0].payload.displayLevel}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="risk" 
                        stroke={trend.color} 
                        strokeWidth={3}
                        dot={{ r: 4.5, stroke: trend.color, strokeWidth: 2.5, fill: '#030712' }}
                        activeDot={{ r: 6.5, stroke: trend.color, strokeWidth: 2.5, fill: trend.color }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right 1 col: Analysis panel */}
            <div className="bg-[#0b1329]/50 p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Trend Vector Audit
                </span>
                
                <div className="bg-slate-950/40 p-4.5 rounded-xl border border-white/5 space-y-2.5 shadow-inner relative">
                  <div className="flex items-center space-x-2">
                    {trend.icon}
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {trend.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {trend.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-black uppercase tracking-widest space-y-1.5 z-10">
                <span>First Checkup: <span className="text-slate-300 font-bold ml-1">{chartData[0]?.displayLevel || 'N/A'}</span></span>
                <span className="block">Latest Checkup: <span className="text-teal-400 font-black ml-1">{chartData[chartData.length - 1]?.displayLevel || 'N/A'}</span></span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Historical Visit Log Timeline */}
      <div className="bg-[#0b1329]/30 border border-white/5 shadow-2xl rounded-2xl overflow-hidden relative backdrop-blur-sm">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-2xl -z-10 blur-sm"></div>

        <div className="bg-[#0b1329]/60 px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Chronological Visit History</h3>
          <Link
            to="/visits/new"
            state={{ householdId: id }}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl tracking-wider transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            Log Visit
          </Link>
        </div>

        {householdVisits.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-4">
            <Clipboard className="w-12 h-12 mx-auto text-slate-600 mb-2 animate-bounce" />
            <div className="max-w-xs mx-auto">
              <p className="font-extrabold text-white text-sm">No visits logged yet.</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">Ready to create a natural-language report? Click "Log Visit" to start the pipeline.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {householdVisits.map((v) => {
              const badgeClass = getRiskBadge(v.riskLevel);
              return (
                <div key={v._id || v.id} className="p-6 hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative group">
                  <div className="space-y-2.5 flex-grow max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 bg-slate-950/40 px-2.5 py-1 border border-white/5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        <span>{new Date(v.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        ({v.inputMode} Ingestion)
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] tracking-wider uppercase font-black shadow-xs ${badgeClass}`}>
                        {v.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium italic pl-3 border-l-2 border-teal-500/30 line-clamp-1 py-0.5">
                      " {v.rawTranscript} "
                    </p>

                    <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                      <strong className="text-teal-400 mr-1">AI Justification:</strong> {v.riskJustification}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <Link
                      to={`/visits/${v._id || v.id}`}
                      className="h-9 px-4 flex items-center justify-center bg-slate-900/40 border border-white/10 hover:border-white/20 hover:bg-slate-900/60 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      View Compiled Report
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
