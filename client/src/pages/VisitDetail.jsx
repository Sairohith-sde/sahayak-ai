import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { ArrowLeft, Printer, Shield, Check, Info, Calendar, User, FileText, AlertTriangle, HelpCircle } from 'lucide-react';

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

  // 2. Setup react-to-print handler (Requirements-compliant)
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-1/3 skeleton-shimmer rounded"></div>
          <div className="h-4 w-1/2 skeleton-shimmer rounded mt-2"></div>
        </div>
        <div className="h-96 bg-white border border-slate-200 rounded-lg skeleton-shimmer"></div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-xl text-center max-w-xl mx-auto shadow-sm space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#DC2626] mx-auto" />
        <h3 className="font-bold text-[#0A1628] text-lg">Visit Record Not Found</h3>
        <p className="text-sm text-slate-500">This visit record does not exist or you do not have permission to view it.</p>
        <Link to="/" className="inline-flex h-9 items-center justify-center px-4 bg-[#1A3461] text-white font-bold text-xs uppercase rounded-lg tracking-wider hover:bg-[#0A1628] transition-all">
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
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#DC2626]',
          text: 'text-[#991B1B]',
          badge: 'bg-[#DC2626] text-white',
          banner: 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
        };
      case 'high':
        return {
          bg: 'bg-[#FFF7ED]',
          border: 'border-[#EA580C]',
          text: 'text-[#9A3412]',
          badge: 'bg-[#EA580C] text-white',
          banner: 'bg-[#FFF7ED] border-[#EA580C] text-[#9A3412]'
        };
      case 'medium':
        return {
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#CA8A04]',
          text: 'text-[#854D0E]',
          badge: 'bg-[#CA8A04] text-[#854D0E]',
          banner: 'bg-[#FEFCE8] border-[#CA8A04] text-[#854D0E]'
        };
      default:
        return {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#16A34A]',
          text: 'text-[#166534]',
          badge: 'bg-[#16A34A] text-white',
          banner: 'bg-[#F0FDF4] border-[#16A34A] text-[#166534]'
        };
    }
  })();

  const sourceLang = visit.languagePref || 'en-IN';
  const sourceLangLabel = LANGUAGE_LABELS[sourceLang] || 'ENGLISH';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action navigation row */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 no-print gap-4">
        <div className="flex items-center space-x-3.5">
          <Link 
            to="/" 
            className="p-2 bg-white border border-slate-300 hover:bg-[#EEF1F6] rounded-lg text-slate-500 hover:text-[#0A1628] transition-colors focus:outline-none"
            title="Return to prioritized desk"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[22px] font-bold text-[#0A1628] uppercase tracking-tight">Visit File Compiled</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">Triage scoring and structured report review</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Print Button (Required design specifications) */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-[#1A3461] hover:bg-[#0A1628] active:scale-[0.98] text-white font-bold text-xs uppercase px-4 h-10 rounded-lg tracking-wider transition-all duration-150 cursor-pointer shadow-md border border-[#1A3461]"
          >
            <Printer className="w-4 h-4 text-[#13B5A6]" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Audit Pipeline Info Box */}
      <div className="bg-[#EEF1F6] border border-[#CBD5E1] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print shadow-sm">
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-lg leading-none">🤖</span>
          <div>
            <p className="font-bold text-[#0A1628]">5-Stage Agentic Audit Complete</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Pipeline Status: <span className="text-[#0D7A6F] font-bold uppercase">{visit.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {visit.extractedData?.source === 'fallback' || visit.report?.source === 'fallback' ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A3412] bg-[#FFF7ED] border border-[#EA580C] px-3 py-1 rounded-md">
              ⚠️ Local Fallback Engine Utilized
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] bg-[#F0FDF4] border border-[#16A34A] px-3 py-1 rounded-md flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping"></span>
              <span>Google Gemini AI Inference</span>
            </span>
          )}

          <Link
            to="/pipeline"
            className="text-xs font-bold text-[#0F9B8E] hover:underline uppercase tracking-wider"
          >
            Trace Execution ➡️
          </Link>
        </div>
      </div>

      {/* 5-Stage Trace Log Audit Replay (IMPROVEMENT 2) */}
      {visit.trace && visit.trace.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 no-print shadow-sm">
          <div className="flex items-center justify-between border-b pb-2.5">
            <h4 className="text-xs font-bold text-[#0A1628] uppercase tracking-wider flex items-center space-x-2">
              <span className="text-base">⏱️</span>
              <span>Execution Trace Audit Log Replay</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#EEF1F6] px-2.5 py-1 rounded-md flex items-center space-x-1">
              <span>Verified Audit Trail</span>
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
            {(visit.trace || []).map((t, idx) => {
              const statusColors = t.status === 'complete' 
                ? 'text-[#166534] bg-[#F0FDF4] border-[#16A34A]' 
                : t.status === 'fallback' 
                  ? 'text-[#92400E] bg-[#FFF7ED] border-[#D97706]' 
                  : 'text-slate-500 bg-slate-50 border-slate-200';
              return (
                <div key={idx} className={`p-3 rounded-lg border text-center space-y-1.5 ${statusColors} relative flex flex-col justify-between shadow-xs`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                    {t.stage.replace('_', ' ')}
                  </div>
                  <div className="text-[9px] font-medium leading-normal italic text-slate-500 line-clamp-2" title={t.summary}>
                    "{t.summary}"
                  </div>
                  <div className="text-[8px] font-bold opacity-60 flex items-center justify-center space-x-1">
                    <span>⏱️</span>
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
      <div className="bg-[#EEF1F6] border-l-4 border-l-[#CBD5E1] rounded-r-xl p-5 space-y-2.5 no-print shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
            <span className="text-sm">🗣️</span>
            <span>Section A • Original Verbatim Field Note</span>
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-200 px-2.5 py-0.5 rounded-[6px]">
            RECORDED IN {sourceLangLabel}
          </span>
        </div>
        <p className="text-sm italic text-slate-600 font-medium leading-relaxed bg-white p-3.5 border border-slate-200 rounded-lg shadow-inner">
          "{visit.rawTranscript || visit.transcript || 'No spoken transcript captured.'}"
        </p>
        <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-semibold">
          <span>Source recording preserved for audit purposes</span>
          <span>Non-Printable Section</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION B — Official Health Visit Report (PRINT-READY) */}
      {/* ======================================================== */}
      <div ref={reportRef} className="no-print pt-3">
        <span className="inline-block bg-[#0A1628] text-[#13B5A6] font-bold text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-t-lg shadow-sm">
          Section B • Official Health Report
        </span>
      </div>

      <div 
        ref={printComponentRef} 
        className="printable-report bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] border border-[#E2E8F0] p-8 space-y-6 print:border-none print:shadow-none print:p-1.5 print:space-y-2.5"
      >
        {/* Embedded print overrides to guarantee perfect full-page 100% scaling */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 6mm 10mm 6mm 10mm !important;
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
        <div className="bg-[#0A1628] text-white p-6 rounded-t-lg -mx-8 -mt-8 flex flex-col md:flex-row print:flex-row md:items-center print:items-center justify-between gap-4 print:bg-[#0A1628] print:text-white print:-mx-0 print:-mt-0 print:p-2.5 print:py-2 print:rounded-none">
          <div className="space-y-0.5">
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
