import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Check, AlertCircle, ArrowDown, Activity, Sparkles, Server, HardDrive, Laptop, RefreshCw, X, Shield, Clock } from 'lucide-react';

const RISK_KEYWORDS = {
  critical: [
    { words: ['stop', 'abandon', 'drop', 'quit', 'chhod', 'nahi le raha', 'दवा बंद', 'మందులు ఆపేశారు', 'மருந்து நிறுத்தப்பட்டது', 'மहारोग'], label: 'TB/HIV treatment abandonment' },
    { words: ['not gaining weight', 'vazan nahi badh', 'weight loss', 'severe wasting', 'malnourished', 'severe malnutrition', 'బరువు ఇంకా పెరగలేదు', 'వజన్ ఇంకా పెరగలేదు', 'వజన్ ఇంకా పెరగలేదు', 'వజన్ ఇంకా పెరగలేదు', 'वजन नहीं बढ़ रहा', 'वजन वाढले नाही', 'ওজন বাড়ছে না', 'ਭਾਰ ਨਹੀਂ ਵਧ ਰਿਹਾ', 'વજન વધતું નથી', 'ଓଜନ ବଢୁନାହିଁ'], label: 'Severe child malnutrition' },
    { words: ['bleeding', 'severe pain', 'extreme swelling', 'vision blurred', 'dhundhla', 'seizure', 'blurred vision', 'కళ్ళు తిరగడం', 'பார்வை மங்கல்', 'धुंधला'], label: 'Severe obstetric danger sign' },
    { words: ['extreme weak', 'not waking', 'unconscious', 'behoshi', 'పడిపోవడం', 'மயக்கம்', 'बेहोश'], label: 'Patient unresponsive/critical weakness' }
  ],
  high: [
    { words: ['missed vaccine', 'missed immunization', 'tika chhoot', 'no vaccine', 'not vaccinated', 'टीका नहीं लगा', 'టీకా వేయలేదు', 'తడుప్పూసి పోడవిల్లై', 'தடுப்பூసి போடவில்லை', 'లసಿಕೆ ಹಾಕಿಲ್ಲ', 'വാക്സിൻ എടുത്തിട്ടില്ല', 'लस दिली नाही', 'টিকা দেওয়া হয়নি', 'ਟੀਕਾਕਰਨ ਨਹੀਂ ਹੋਇਆ', 'ਰસી લીધી નથી', 'ଟିକਾ ଦିଆଯାଇନାହିଁ'], label: 'Missed vital childhood immunization' },
    { words: ['fever', 'bukhaar', 'temperature', 'body hot', 'बुखार', 'ज्वరం', 'காய்ச்சல்', 'ಜ್ವರ', 'పని', 'ताप', 'ज्वर', 'ਬੁਖਾਰ', 'તાવ'], label: 'Active infant or maternal fever' },
    { words: ['cough', 'khansi', 'sputum', 'खांसी', 'దగ్गु', 'இருமல்', 'ಕೆమ్ము', 'ചുമ', 'खोकला', 'కాশি', 'ਖੰਘ', 'ખાંસી', 'କାଶ'], label: 'Symptomatic pulmonary TB risk' },
    { words: ['swelling', 'sujan', 'headache', 'pain', 'суजन', 'వాపు', 'வீக்கம்', 'ಊತ', 'सूज', 'ফোলা', 'ਸੋਜ', 'સોજો', 'ଫୋଲା'], label: 'Pregnancy-related hypertension risk' }
  ],
  medium: [
    { words: ['weak', 'kamzori', 'tired', 'thakan', 'కంగారు', 'சோர்వు', 'कमजोरी'], label: 'Mild clinical weakness' },
    { words: ['rash', 'daane', 'itching', 'தடிப்பு', 'खुजली'], label: 'General skin rash' },
    { words: ['vomit', 'ultig', 'వాంతులు', 'வாந்தி', 'उल्टी'], label: 'Moderate gastric distress' }
  ]
};

function runLocalFallbackParse(transcript) {
  if (!transcript) return { riskLevel: 'low', riskIndicators: [], followUpNeeded: 'no' };
  const text = transcript.toLowerCase();
  const riskIndicators = [];
  let riskLevel = 'low';

  for (const rule of RISK_KEYWORDS.critical) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      riskLevel = 'critical';
    }
  }
  for (const rule of RISK_KEYWORDS.high) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      if (riskLevel === 'low' || riskLevel === 'medium') {
        riskLevel = 'high';
      }
    }
  }
  for (const rule of RISK_KEYWORDS.medium) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      if (riskLevel === 'low') {
        riskLevel = 'medium';
      }
    }
  }

  const followUpNeeded = ['critical', 'high', 'medium'].includes(riskLevel) ? 'yes' : 'no';
  return { riskLevel, riskIndicators, followUpNeeded };
}

export default function PipelineView() {
  const { user } = useAuthStore();
  const workerId = user?._id || user?.id;
  const isWorker = user?.role === 'worker';
  const queryClient = useQueryClient();

  // 0. Poll offline simulation state
  const { data: debugState } = useQuery({
    queryKey: ['debug-offline'],
    queryFn: async () => {
      const res = await api.get('/debug/offline-mode');
      return res.data;
    },
    refetchInterval: 3000
  });

  const toggleOfflineMutation = useMutation({
    mutationFn: async (enabled) => {
      const res = await api.post('/debug/offline-mode', { enabled });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['debug-offline'], data);
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    }
  });

  // 1. Fetch Visits
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['visits', workerId],
    queryFn: async () => {
      const endpoint = isWorker ? `/visits?workerId=${workerId}` : '/visits';
      try {
        const res = await api.get(endpoint);
        return res.data;
      } catch (e) {
        return [];
      }
    }
  });

  // 2. Fetch Escalations
  const { data: escalations, isLoading: escalationsLoading } = useQuery({
    queryKey: ['supervisor-escalations'],
    queryFn: async () => {
      try {
        const res = await api.get(`/supervisor/escalations`);
        return res.data;
      } catch (e) {
        return [];
      }
    }
  });

  if (visitsLoading || escalationsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#030712]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-400 mt-5 uppercase tracking-[0.15em] animate-pulse">Loading Explainability Trace Graph...</p>
      </div>
    );
  }

  // Calculate activation rules exactly as defined in the spec
  const hasVisits = (visits || []).length > 0;
  const latestVisit = hasVisits ? visits[0] : null;

  const isExtractorActive = hasVisits;
  const isRiskScorerActive = hasVisits && (visits || []).some(v => v.extractedData && Object.keys(v.extractedData).length > 0);
  const isReportWriterActive = hasVisits && (visits || []).some(v => v.report && Object.keys(v.report).length > 0);
  const isEscalationEvaluatorActive = hasVisits && (visits || []).some(v => v.status === 'escalated');
  const isTraceLoggerActive = hasVisits && (visits || []).some(v => v.trace && v.trace.length > 0);

  const stages = [
    {
      id: 'extractor',
      title: 'Stage 1: Extractor Agent',
      desc: 'Transcribes natural voice notes or typed logs and maps them to a structured observation schema.',
      active: isExtractorActive,
      data: isExtractorActive ? { observations: latestVisit?.extractedData?.observations } : null
    },
    {
      id: 'scorer',
      title: 'Stage 2: Risk Scorer Agent',
      desc: 'Applies fixed triage rules to map structured observation signs into critical, high, medium, or low categories.',
      active: isRiskScorerActive,
      data: isRiskScorerActive ? { riskLevel: latestVisit?.riskLevel?.toUpperCase(), justification: latestVisit?.riskJustification } : null
    },
    {
      id: 'writer',
      title: 'Stage 3: Report Writer Agent',
      desc: 'Generates a formal medical government health report, validating and stripping unauthorized medical claims.',
      active: isReportWriterActive,
      data: isReportWriterActive ? { title: latestVisit?.report?.title, institution: latestVisit?.report?.institution } : null
    },
    {
      id: 'evaluator',
      title: 'Stage 4: Escalation Evaluator',
      desc: 'Detects if risk levels are high/critical, creating a priority escalation ticket inside supervisor queues.',
      active: isEscalationEvaluatorActive,
      data: isEscalationEvaluatorActive ? { escalatedStatus: 'Escalation Alert Issued to Dr. Sharma' } : null
    },
    {
      id: 'logger',
      title: 'Stage 5: Trace Logger Service',
      desc: 'Appends isolated audits of each agent\'s input/output to the visit record for explainability reviews.',
      active: isTraceLoggerActive,
      data: isTraceLoggerActive ? { traceCount: `${latestVisit?.trace?.length || 0} Audit Records Saved` } : null
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-[20px] font-black text-white tracking-tight uppercase flex items-center space-x-2.5 font-display">
          <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
          <span>Explainability Audit Pipeline</span>
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Real-time status tracking of active agentic workflow stages</p>
      </div>

      {/* Offline Mode Controller Panel */}
      <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <Server className={`w-5 h-5 ${debugState?.enabled ? 'text-amber-400' : 'text-teal-400 animate-pulse'}`} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
              MERN AI Fallback Controller
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Simulate regional telecom failures or LLM outages. Bypasses Ollama and fires local regex engines.
          </p>
        </div>

        <button
          onClick={() => toggleOfflineMutation.mutate(!debugState?.enabled)}
          disabled={toggleOfflineMutation.isPending}
          className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all cursor-pointer active:scale-[0.98] z-10 border ${
            debugState?.enabled
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:bg-amber-500/15'
              : 'bg-slate-900 border-white/5 hover:bg-slate-850 hover:border-white/10 text-white'
          }`}
        >
          {toggleOfflineMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : debugState?.enabled ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Disable Offline Simulation</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Simulate Offline Outage</span>
            </>
          )}
        </button>
      </div>

      {/* Fallback Comparison Sandbox Panel */}
      {latestVisit && (
        (() => {
          const rawNote = latestVisit.rawTranscript || latestVisit.transcript || "";
          const fallbackData = runLocalFallbackParse(rawNote);
          
          // Compute accuracy match score
          let matches = 0;
          let total = 3;
          
          const riskLevelMatch = String(latestVisit.riskLevel).toLowerCase() === String(fallbackData.riskLevel).toLowerCase();
          const followUpMatch = String(latestVisit.extractedData?.followUpNeeded || latestVisit.report?.extractedDetails?.followUp || 'no').toLowerCase().includes(String(fallbackData.followUpNeeded).toLowerCase());
          
          // Check indicators match (at least one intersection, or both empty)
          const originalIndicators = latestVisit.extractedData?.riskIndicators || latestVisit.report?.extractedDetails?.indicators || [];
          const indicatorIntersect = fallbackData.riskIndicators.some(ind => originalIndicators.some(orig => String(orig).toLowerCase().includes(ind.toLowerCase()) || String(ind).toLowerCase().includes(orig.toLowerCase())));
          const indicatorMatch = (originalIndicators.length === 0 && fallbackData.riskIndicators.length === 0) || indicatorIntersect;

          if (riskLevelMatch) matches++;
          if (followUpMatch) matches++;
          if (indicatorMatch) matches++;

          const accuracyPercent = Math.round((matches / total) * 100);

          return (
            <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-6 space-y-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3.5 gap-3 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 font-display">
                    <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                    <span>Deterministic Parser Accuracy Sandbox</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Auditing fallback parity vs original active-pipeline logs
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fallback Parity Match Score:</span>
                  <span className={`text-xs font-black uppercase tracking-wider ${accuracyPercent >= 80 ? 'text-emerald-400' : accuracyPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {accuracyPercent}%
                  </span>
                </div>
              </div>

              {/* Patient and spoken note header metadata */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-1.5 relative z-10">
                <span className="block text-[9px] font-black uppercase tracking-widest text-teal-400">Target Input Observation Note:</span>
                <p className="text-xs font-semibold text-slate-300 italic">"{rawNote}"</p>
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-black uppercase tracking-wider mt-2.5 pt-2.5 border-t border-white/5">
                  <span>Patient: {latestVisit.report?.householdName || latestVisit.householdId?.name || "Client"}</span>
                  <span>Category: {latestVisit.householdId?.category || "General"}</span>
                </div>
              </div>

              {/* Side by side columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                {/* Left Column: Original Pipeline */}
                <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center space-x-1.5 font-display">
                      <Server className="w-3.5 h-3.5 text-teal-400" />
                      <span>Original Database Pipeline Logs</span>
                    </span>
                    <span className="text-[9px] font-black uppercase text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                      Stored Records
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Risk Level Priority:</span>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                        {latestVisit.riskLevel?.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Follow-Up Needed:</span>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                        {String(latestVisit.extractedData?.followUpNeeded || latestVisit.report?.extractedDetails?.followUp || 'no').toLowerCase().includes('yes') ? 'YES' : 'NO'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. Extracted Risk Indicators:</span>
                      <div className="mt-1.5 space-y-1">
                        {originalIndicators.length === 0 ? (
                          <span className="text-slate-500 italic">None detected</span>
                        ) : (
                          originalIndicators.map((ind, i) => (
                            <span key={i} className="block font-semibold text-slate-300">• {ind}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Fallback Engine */}
                <div className="bg-[#FFFBEB]/5 border border-amber-500/15 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5 mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center space-x-1.5 font-display">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Deterministic Fallback Parser</span>
                    </span>
                    <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/15">
                      Simulated Offline Run
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>1. Risk Level Priority:</span>
                        <span className="text-sm">{riskLevelMatch ? '✅' : '❌'}</span>
                      </span>
                      <span className={`inline-block mt-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded-lg ${
                        fallbackData.riskLevel === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/15' : fallbackData.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-slate-900 text-slate-300 border border-white/5'
                      }`}>
                        {fallbackData.riskLevel.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>2. Follow-Up Needed:</span>
                        <span className="text-sm">{followUpMatch ? '✅' : '❌'}</span>
                      </span>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                        {fallbackData.followUpNeeded.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>3. Extracted Risk Indicators:</span>
                        <span className="text-sm">{indicatorMatch ? '✅' : '❌'}</span>
                      </span>
                      <div className="mt-1.5 space-y-1">
                        {fallbackData.riskIndicators.length === 0 ? (
                          <span className="text-slate-500 italic">None detected</span>
                        ) : (
                          fallbackData.riskIndicators.map((ind, i) => (
                            <span key={i} className="block font-semibold text-slate-300">• {ind}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl backdrop-blur-md relative">
        <div className="md:col-span-2 space-y-3 z-10">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">What is this Audit View?</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
            In compliance with national clinical safety guidelines, Sahayak AI employs an <strong>isolated multi-agent pipeline</strong>. Rather than running a single unconstrained model, our system segments the workload into five highly audited steps. 
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
            Nodes light up green and report metrics automatically only when visit data flows through them. A fresh/empty account shows offline gray states.
          </p>
        </div>

        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-2 relative z-10">
          <span className="text-2xl animate-bounce">🩺</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Visits Audited</span>
          <span className="text-3xl font-black text-white font-display">{visits?.length || 0}</span>
        </div>
      </div>

      {/* Visually stunning active/inactive timeline graph */}
      <div className="space-y-8 relative before:absolute before:bottom-0 before:top-4 before:left-6 before:w-0.5 before:bg-white/5">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-start space-x-6 relative">
            
            {/* Round glowing status indicator */}
            <div className={`w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0 z-10 border-2 transition-all duration-300 ${
              stage.active 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                : 'bg-slate-950/20 border-white/5 text-slate-500'
            }`}>
              {stage.active ? (
                <Check className="w-5 h-5 text-emerald-400 stroke-[3px]" />
              ) : (
                <span className="font-bold text-xs">{idx + 1}</span>
              )}
            </div>

            {/* Stage content details card */}
            <div className={`flex-grow rounded-2xl p-5 transition-all duration-300 border ${
              stage.active 
                ? 'bg-[#0b1329]/40 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                : 'bg-slate-950/10 border-white/5 opacity-50'
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                <h4 className="text-xs font-extrabold uppercase text-white tracking-wider font-display">
                  {stage.title}
                </h4>
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                  stage.active 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15' 
                    : 'bg-slate-950/40 text-slate-500 border-white/5'
                }`}>
                  {stage.active ? 'ACTIVE / COMPILED' : 'OFFLINE / INACTIVE'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                {stage.desc}
              </p>

              {/* Dynamic live outputs preview inside nodes if active! */}
              {stage.active && stage.data && (
                <div className="mt-4 bg-slate-950/40 border border-white/5 p-3.5 rounded-xl text-[10px] font-mono text-slate-300 space-y-1 overflow-x-auto max-h-32">
                  <span className="block text-[9px] font-black text-teal-400 uppercase tracking-widest font-sans mb-1.5">
                    🟢 Live Audit Output Sample:
                  </span>
                  <pre className="whitespace-pre-wrap leading-tight text-[10px]">
                    {JSON.stringify(stage.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
