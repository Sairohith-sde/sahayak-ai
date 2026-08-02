import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { ArrowLeft, Printer, Shield, Check, Info, Calendar, User, FileText, AlertTriangle, HelpCircle, Activity, Play, CheckCircle } from 'lucide-react';

const LANGUAGE_LABELS = {
  'en-IN': 'ENGLISH',
  'hi-IN': 'HINDI (हिन्दी)',
  'te-IN': 'TELUGU (తెలుగు)',
  'ta-IN': 'TAMIL (தமிழ்)',
  'kn-IN': 'KANNADA (ಕನ್ನಡ)',
  'ml-IN': 'MALAYALAM (മലയാളം)',
  'mr-IN': 'MARATHI (मराठी)',
  'bn-IN': 'BENGALI (বাংলা)',
  'pa-IN': 'PUNJABI (ਪੰਜਾਬੀ)',
  'gu-IN': 'GUJARATI (ગુજરાતી)',
  'or-IN': 'ODIA (ଓଡ଼ିଆ)'
};

export default function VisitDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const location = useLocation();
  const printComponentRef = useRef(null);
  const reportRef = useRef(null);

  const [shouldAnimateBadge, setShouldAnimateBadge] = useState(() => {
    return !!location.state?.liveDemo;
  });

  // 1. Fetch Visit Details
  const { data: visit, isLoading, error } = useQuery({
    queryKey: ['visit', id],
    queryFn: async () => {
      const res = await api.get(`/visits/${id}`);
      return res.data;
    }
  });

  // 2. Setup react-to-print handler
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `Government_Health_Report_${id}`,
  });

  useEffect(() => {
    if (shouldAnimateBadge && !isLoading && visit) {
      const scrollTimer = setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1500);

      const animTimer = setTimeout(() => {
        setShouldAnimateBadge(false);
      }, 2500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(animTimer);
      };
    }
  }, [shouldAnimateBadge, isLoading, visit]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto bg-[#030712]">
        <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-slate-800 rounded"></div>
          <div className="h-4 w-1/2 bg-slate-800 rounded mt-2"></div>
        </div>
        <div className="h-96 bg-[#0b1329]/20 border border-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="p-12 bg-red-500/5 border border-red-500/20 rounded-2xl text-center max-w-xl mx-auto shadow-2xl space-y-4 relative mt-12">
        <div className="absolute -inset-[1px] bg-red-500/10 rounded-2xl -z-10 blur-sm"></div>
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
        <h3 className="font-extrabold text-white text-base">Visit Record Not Found</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">This visit record does not exist or you do not have permission to view it.</p>
        <Link to="/" className="inline-flex h-10 items-center justify-center px-4 bg-[#0b1329] border border-white/5 hover:border-white/10 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider hover:bg-slate-900 transition-all active:scale-[0.98]">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const report = visit.report || {};
  const riskColorClass = (() => {
    switch (String(visit.riskLevel).toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/35',
          text: 'text-red-200',
          badge: 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.25)]',
          banner: 'bg-red-500/10 border-red-500/25 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
        };
      case 'high':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/35',
          text: 'text-amber-200',
          badge: 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          banner: 'bg-amber-500/10 border-amber-500/25 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
        };
      case 'medium':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/20',
          text: 'text-indigo-200',
          badge: 'bg-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.15)]',
          banner: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'
        };
      default:
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          text: 'text-emerald-200',
          badge: 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          banner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
        };
    }
  })();

  const sourceLang = visit.languagePref || 'en-IN';
  const sourceLangLabel = LANGUAGE_LABELS[sourceLang] || 'ENGLISH';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action navigation row */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6 no-print gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="p-2 bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/60 rounded-xl text-slate-300 transition-all active:scale-[0.98]"
            title="Return to prioritized desk"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[20px] font-black text-white uppercase tracking-tight font-display">Visit File Compiled</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Triage scoring and structured report review</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase px-4 h-10 rounded-xl tracking-wider transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <Printer className="w-4.5 h-4.5 text-white" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Audit Pipeline Info Box */}
      <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-lg leading-none animate-bounce">🤖</span>
          <div>
            <p className="font-extrabold text-white">5-Stage Agentic Audit Complete</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Pipeline Status: <span className="text-teal-400 font-black uppercase">{visit.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs z-10">
          {visit.extractedData?.source === 'fallback' || visit.report?.source === 'fallback' ? (
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
              ⚠️ Local Fallback Engine Utilized
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1 rounded-lg flex items-center space-x-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Google Gemini AI Inference</span>
            </span>
          )}

          <Link
            to="/pipeline"
            className="text-[10px] font-black text-teal-400 hover:text-teal-300 hover:underline uppercase tracking-wider"
          >
            Trace Execution ➡️
          </Link>
        </div>
      </div>

      {/* 5-Stage Trace Log Audit Replay */}
      {visit.trace && visit.trace.length > 0 && (
        <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl p-5 space-y-4 no-print shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
              <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Execution Trace Audit Log Replay</span>
            </h4>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950/40 px-2.5 py-1 rounded-lg border border-white/5">
              Verified Audit Trail
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
            {(visit.trace || []).map((t, idx) => {
              const statusColors = t.status === 'complete' 
                ? 'text-emerald-300 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]' 
                : t.status === 'fallback' 
                  ? 'text-amber-300 bg-amber-500/5 border-amber-500/20' 
                  : 'text-slate-500 bg-slate-950/20 border-white/5';
              return (
                <div key={idx} className={`p-3.5 rounded-xl border text-center space-y-1.5 ${statusColors} relative flex flex-col justify-between shadow-xs transition-all duration-150`}>
                  <div className="text-[9px] font-black uppercase tracking-widest leading-tight">
                    {t.stage.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] font-semibold leading-relaxed italic text-slate-400 line-clamp-2" title={t.summary}>
                    "{t.summary}"
                  </div>
                  <div className="text-[8px] font-black opacity-60 flex items-center justify-center space-x-1 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '0.0s'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION A — Worker's Original Note (SCREEN ONLY, NO-PRINT) */}
      {/* ======================================================== */}
      <div className="bg-[#0b1329]/40 border-l-4 border-l-slate-600 rounded-r-2xl p-5 space-y-3 no-print shadow-2xl backdrop-blur-md relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 z-10 relative">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
            <span className="text-sm">🗣️</span>
            <span>Section A • Original Verbatim Field Note</span>
          </h4>
          <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-950/40 border border-white/5 px-2.5 py-1 rounded-lg tracking-widest">
            RECORDED IN {sourceLangLabel}
          </span>
        </div>
        <p className="text-xs italic text-slate-300 font-semibold leading-relaxed bg-slate-950/40 p-3.5 border border-white/5 rounded-xl shadow-inner relative z-10">
          "{visit.rawTranscript || visit.transcript || 'No spoken transcript captured.'}"
        </p>
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-black uppercase tracking-widest z-10 relative">
          <span>Source recording preserved for audit purposes</span>
          <span>Non-Printable Section</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION B — Official Health Visit Report (PRINT-READY) */}
      {/* ======================================================== */}
      <div ref={reportRef} className="no-print pt-3">
        <span className="inline-block bg-[#0A1628] border-t border-x border-white/5 text-teal-400 font-black text-[10px] uppercase tracking-widest px-4.5 py-2.5 rounded-t-xl shadow-lg font-display">
          Section B • Official Health Report
        </span>
      </div>

      <div 
        ref={printComponentRef} 
        className="printable-report bg-white rounded-r-2xl rounded-bl-2xl shadow-[0_10px_35px_rgba(0,0,0,0.4)] border border-[#E2E8F0] p-8 space-y-6 print:border-none print:shadow-none print:p-1.5 print:space-y-2.5"
      >
        {/* Embedded print overrides to guarantee perfect full-page 100% scaling and background colors */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm !important;
            }
            .printable-report {
              zoom: 100% !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
            }
            /* Collapse parent wrapper heights during print */
            html, body, #root {
              display: block !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
          }
        `}} />

        {/* Top Header Band */}
        <div className="bg-[#0A1628] text-white p-6 rounded-t-xl -mx-8 -mt-8 flex flex-col md:flex-row print:flex-row md:items-center print:items-center justify-between gap-4 print:bg-[#0A1628] print:text-white print:-mx-0 print:-mt-0 print:p-2.5 print:py-2 print:rounded-none">
          <div className="space-y-1">
            <h3 className="text-sm print:text-xs font-bold tracking-widest text-[#13B5A6] uppercase">
              SAHAYAK AI — OFFICIAL HEALTH VISIT REPORT
            </h3>
            <p className="text-xs print:text-[10px] text-slate-300 font-semibold tracking-wide uppercase">
              National Health Mission | Decision Support Core
            </p>
          </div>
          <div className="text-left md:text-right print:text-right text-[11px] print:text-[9.5px] text-slate-300 font-semibold space-y-0.5">
            <p>REPORT ID: {visit._id || visit.id}</p>
            <p>DATE: {report.date || new Date().toLocaleDateString('en-IN')}</p>
            <p>WORKER: {report.healthWorker || 'Rani Devi'}</p>
          </div>
        </div>

        {/* Risk Level Full Width Colored Band */}
        <div className={`p-4 border-l-4 rounded-r-lg ${riskColorClass.banner} flex items-center justify-between ${shouldAnimateBadge ? 'scale-up-badge' : ''} print:p-1.5 print:py-1`}>
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 print:w-4 print:h-4" />
            <span className="text-sm print:text-xs font-bold uppercase tracking-wider">
              Triage Classification: {visit.riskLevel?.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] print:text-[9.5px] font-bold uppercase tracking-widest">
            Clinical Priority Flag
          </span>
        </div>

        {/* Metadata Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 border border-slate-300 text-[11px] print:text-[9.5px] font-semibold text-slate-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b md:border-b-0 print:border-b-0 md:border-r print:border-r border-slate-300 bg-slate-50 flex flex-col justify-between print:p-1.5 print:py-1">
            <span className="text-[11px] print:text-[9px] uppercase text-[#6B7280]">Patient/Household Location</span>
            <span className="text-sm print:text-xs font-bold text-[#0A1628] uppercase mt-0.5">
              {report.householdName || 'Registered Client'} (Village: {visit.householdId?.village || 'Sector A'})
            </span>
          </div>
          <div className="p-4 bg-slate-50 flex flex-col justify-between print:p-1.5 print:py-1">
            <span className="text-[11px] print:text-[9px] uppercase text-[#6B7280]">Primary Triage Categorization</span>
            <span className="text-sm print:text-xs font-bold text-[#0A1628] uppercase mt-0.5">
              {visit.householdId?.category || 'General Health & Nutrition'}
            </span>
          </div>
        </div>

        {/* Section I: Summary */}
        <div className="space-y-1.5 print:space-y-1">
          <h4 className="text-[11px] print:text-[10px] font-bold uppercase tracking-widest text-[#0A1628] border-b border-slate-300 pb-1">
            Section I: Executive Visit Summary
          </h4>
          <p className="text-sm print:text-xs print:leading-snug text-[#0A1628] font-medium text-justify">
            {report.summary || 'Summary not compiled.'}
          </p>
        </div>

        {/* Section II: Structured Details Left-label Right-value grid */}
        <div className="space-y-2 print:space-y-1">
          <h4 className="text-[11px] print:text-[10px] font-bold uppercase tracking-widest text-[#0A1628] border-b border-slate-300 pb-1">
            Section II: Structured Field Details (English)
          </h4>
          
          <div className="border border-slate-200 divide-y divide-[#E2E8F0] text-sm text-[#0A1628] rounded-lg overflow-hidden">
            {/* Row 1: Extracted Observations */}
            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 p-4 print:p-1.5 print:py-1 gap-2 bg-white">
              <span className="font-bold uppercase text-[#6B7280] md:col-span-1 print:col-span-1 text-[11px] print:text-[10px]">Observations:</span>
              <div className="md:col-span-3 print:col-span-3 space-y-1 font-semibold print:text-[11px] print:leading-tight">
                {(report.extractedDetails?.observations || visit.extractedData?.observations || []).map((obs, idx) => (
                  <p key={idx} className="text-sm print:text-xs text-[#0A1628] flex items-start space-x-1.5">
                    <span className="text-[#9CA3AF] select-none">•</span>
                    <span>{obs}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Row 2: Identified Risk Flags */}
            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 p-4 print:p-1.5 print:py-1 gap-2 bg-[#F4F6F9]">
              <span className="font-bold uppercase text-[#6B7280] md:col-span-1 print:col-span-1 text-[11px] print:text-[10px]">Risk Indicators:</span>
              <div className="md:col-span-3 print:col-span-3 space-y-1 print:text-[11px] print:leading-tight">
                {(report.extractedDetails?.indicators || visit.extractedData?.riskIndicators || []).length === 0 ? (
                  <p className="font-bold text-[#166534]">No specific urgent risks detected.</p>
                ) : (
                  (report.extractedDetails?.indicators || visit.extractedData?.riskIndicators || []).map((ind, idx) => (
                    <p key={idx} className="font-bold text-[#991B1B] flex items-start space-x-1.5">
                      <span className="select-none text-[#DC2626]">⚠️</span>
                      <span>{ind}</span>
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Row 3: Follow up action plan */}
            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 p-4 print:p-1.5 print:py-1 gap-2 bg-white">
              <span className="font-bold uppercase text-[#6B7280] md:col-span-1 print:col-span-1 text-[11px] print:text-[10px]">Follow-Up Plan:</span>
              <div className="md:col-span-3 print:col-span-3 font-bold text-[#0D7A6F] print:text-[11px] print:leading-tight">
                {report.extractedDetails?.followUp || `Urgency Check: ${visit.extractedData?.followUpNeeded?.toUpperCase()}, Description: ${visit.extractedData?.followUpReason || 'None'}`}
              </div>
            </div>
          </div>
        </div>

        {/* Section III: Decision Support Rubric Triage */}
        <div className="space-y-1.5 print:space-y-1">
          <h4 className="text-[11px] print:text-[10px] font-bold uppercase tracking-widest text-[#0A1628] border-b border-slate-300 pb-1">
            Section III: Decision-Support Audit
          </h4>
          <div className="bg-[#EEF1F6] border border-slate-300 p-4 rounded-xl text-sm print:text-xs leading-relaxed text-[#0A1628] font-semibold print:p-1.5 print:py-1">
            <strong>Triage Justification (English):</strong> {visit.riskJustification}
          </div>
        </div>

        {/* AI Disclaimer Bottom Banner */}
        <div className="pt-4 border-t border-slate-300 grid grid-cols-1 md:flex md:flex-row md:items-end md:justify-between print:grid print:grid-cols-12 print:gap-4 print:items-end text-xs text-slate-500 print:pt-2 print:mt-1">
          <div className="max-w-xl italic text-justify leading-relaxed border-l-4 border-l-[#EA580C] pl-3.5 py-1.5 bg-[#FFF7ED] text-[#9A3412] rounded-r-lg font-semibold print:col-span-7 print:text-[8.5px] print:leading-snug print:py-0.5 print:my-0">
            <strong>AI Safety Disclaimer:</strong> This report was generated with AI assistance for prioritization and reporting purposes only. It does not constitute a diagnosis or clinical recommendation.
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end print:col-span-5 print:w-full">
            <div className="text-[10px] print:text-[7.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 print:mb-0.5">
              Generated by: Sahayak AI | Verified by: _______________________
            </div>
            <span className="font-bold uppercase text-[9px] print:text-[7.5px] tracking-wider text-slate-400 mt-0.5 print:mt-0">Supervisor Signature Line</span>
          </div>
        </div>

      </div>

    </div>
  );
}
