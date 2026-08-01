import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Home, Calendar, Clock, ArrowLeft, Clipboard, MapPin, AlertCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 mt-4 uppercase tracking-wider">Loading Case File...</p>
      </div>
    );
  }

  if (householdError) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900">Access Denied or Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This household registry could not be found or you do not have permission to view it.</p>
        <Link to="/" className="inline-block mt-4 text-xs font-bold text-teal-700 uppercase hover:underline">
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
      case 'critical': return 'text-triage-critical bg-triage-criticalBg border border-red-200 font-bold';
      case 'high': return 'text-triage-high bg-triage-highBg border border-amber-200 font-bold';
      case 'medium': return 'text-triage-medium bg-triage-mediumBg border border-yellow-200 font-medium';
      default: return 'text-triage-low bg-triage-lowBg border border-green-200 font-normal';
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
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
        <Link 
          to="/" 
          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-500 transition-colors"
          title="Return to tasks list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Household Case File</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Monitoring and Visit Log History</p>
        </div>
      </div>

      {/* Household Metadata Info Card */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1 border-r border-slate-200 pr-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Family Name</span>
          <p className="text-lg font-black text-slate-900 uppercase">{household?.name}</p>
        </div>

        <div className="space-y-1 border-r border-slate-200 pr-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Village Sector Location</span>
          <p className="text-base font-bold text-slate-700 flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{household?.village}</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Monitoring Category</span>
          <p className="text-sm font-bold text-teal-700 mt-0.5">{getCategoryLabel(household?.category)}</p>
        </div>
      </div>

      {/* 4. Risk History Trend (IMPROVEMENT 5) */}
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
              color: '#475569',
              label: 'Awaiting First Visit',
              icon: <Minus className="w-4 h-4 text-[#475569]" />,
              desc: 'No visits have been logged for this family yet. Click "Log Visit" above to record their intake.'
            };
          }
          if (chartData.length < 2) {
            return {
              color: '#0D7A6F',
              label: 'Stable Trend (Insf. Data)',
              icon: <Minus className="w-4 h-4 text-[#0D7A6F]" />,
              desc: 'Single visit recorded. More checkups required to map longitudinal risk shifts.'
            };
          }
          const first = chartData[0].risk;
          const last = chartData[chartData.length - 1].risk;
          if (last > first) {
            return {
              color: '#DC2626',
              label: 'Worsening Trend (Urgent Alert)',
              icon: <TrendingDown className="w-4 h-4 text-[#DC2626]" />,
              desc: 'Risk level has heightened over the monitoring span. Prioritize active clinical checkups.'
            };
          }
          if (last < first) {
            return {
              color: '#16A34A',
              label: 'Improving Trend (Under Control)',
              icon: <TrendingUp className="w-4 h-4 text-[#16A34A]" />,
              desc: 'Risk profile is steadily declining. Frontline interventions are succeeding.'
            };
          }
          return {
            color: '#2563EB',
            label: 'Stable Risk Pattern',
            icon: <Minus className="w-4 h-4 text-[#2563EB]" />,
            desc: 'Risk levels are holding constant. Continue scheduled surveillance.'
          };
        };

        const trend = getTrendAnalysis();

        return (
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            {/* Left 2 cols: Chart */}
            <div className="lg:col-span-2 p-6 border-r border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-[#0A1628] uppercase tracking-wider flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-[#0F9B8E]" />
                    <span>Clinical Triage Longitudinal Trend</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Risk severity mapped across sequential visits
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                    No telemetry available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                        stroke="#CBD5E1"
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
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                        stroke="#CBD5E1"
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2.5 border border-slate-200 rounded shadow-md text-[10px]">
                                <p className="font-extrabold text-slate-500 uppercase">{payload[0].payload.date}</p>
                                <p className="font-bold text-[#0A1628] mt-0.5">
                                  RISK: <span className="font-black text-[#0D7A6F]">{payload[0].payload.displayLevel}</span>
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
                        dot={{ r: 4, stroke: trend.color, strokeWidth: 2, fill: '#FFFFFF' }}
                        activeDot={{ r: 6, stroke: trend.color, strokeWidth: 2, fill: trend.color }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right 1 col: Analysis panel */}
            <div className="bg-slate-50 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Trend Vector Audit
                </span>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center space-x-2">
                    {trend.icon}
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A1628]">
                      {trend.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {trend.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-semibold uppercase tracking-wider space-y-1">
                <span>First Checkup: {chartData[0]?.displayLevel || 'N/A'}</span>
                <span className="block">Latest Checkup: {chartData[chartData.length - 1]?.displayLevel || 'N/A'}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Historical Visit Log Timeline */}
      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b-2 border-teal-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-100 uppercase tracking-wider">Chronological Visit History</h3>
          <Link
            to="/visits/new"
            state={{ householdId: id }}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded tracking-wider shadow hover-active-scale cursor-pointer"
          >
            Log Visit
          </Link>
        </div>

        {householdVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clipboard className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No visits logged yet.</p>
            <p className="text-xs text-slate-400 mt-1">Ready to create a natural-language report? Click "Log Visit" to start the pipeline.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {householdVisits.map((v) => {
              const badgeClass = getRiskBadge(v.riskLevel);
              return (
                <div key={v._id || v.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-grow max-w-3xl">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1 bg-slate-100 px-2 py-1 border rounded">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(v.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ({v.inputMode} Ingestion)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] tracking-wider uppercase font-semibold ${badgeClass}`}>
                        {v.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      " {v.rawTranscript} "
                    </p>

                    <p className="text-xs text-slate-700 font-medium">
                      <strong>AI Justification:</strong> {v.riskJustification}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <Link
                      to={`/visits/${v._id || v.id}`}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase px-4 py-2 rounded tracking-wider cursor-pointer"
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
