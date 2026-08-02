import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { ArrowLeft, User, Users, MapPin, Inbox, ClipboardList } from 'lucide-react';

export default function WorkerView() {
  const { workerId } = useParams();

  // 1. Load Households for this worker
  const { data: households, isLoading } = useQuery({
    queryKey: ['households', workerId],
    queryFn: async () => {
      const res = await api.get(`/households?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#030712]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-400 mt-5 uppercase tracking-[0.15em] animate-pulse">Syncing Case Registry...</p>
      </div>
    );
  }

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
      
      {/* Header Navigation */}
      <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
        <Link 
          to="/supervisor" 
          className="p-2 bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/60 rounded-xl text-slate-300 transition-all active:scale-[0.98]"
          title="Return to dispatch desk"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-[20px] font-black text-white uppercase tracking-tight font-display">Worker Workload Ledger</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-semibold">Read-Only View of Supervised Households</p>
        </div>
      </div>

      <div className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-5 flex items-center space-x-3.5 text-xs backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/15 flex-shrink-0">
          <User className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <p className="font-extrabold text-white text-sm uppercase tracking-wide font-display">Officer Workload</p>
          <p className="font-semibold text-slate-400 mt-1">Showing all registered households assigned under this field officer.</p>
        </div>
      </div>

      {households?.length === 0 ? (
        <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl p-16 text-center shadow-2xl backdrop-blur-md">
          <Inbox className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
          <p className="font-extrabold text-white text-sm">No households registered.</p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">This worker has not initialized any household records on their account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {households?.map((h) => (
            <div key={h._id || h.id} className="bg-[#0b1329]/40 border border-white/5 rounded-2xl p-6 space-y-4 hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md relative group flex flex-col justify-between">
              <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-teal-500/5 rounded-full blur-xl transition-colors pointer-events-none"></div>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors font-display">{h.name}</h4>
                    <div className="flex items-center text-slate-400 text-xs mt-1.5 font-bold space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400/80" />
                      <span>{h.village}</span>
                    </div>
                  </div>
                </div>
                
                <span className="inline-block text-[9px] font-black uppercase bg-teal-500/10 border border-teal-500/15 text-teal-300 px-3 py-1 rounded-lg">
                  {getCategoryLabel(h.category)}
                </span>
              </div>

              <div className="border-t border-white/5 pt-4 mt-5 text-xs flex justify-between items-center relative z-10">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Registered date</span>
                  <span className="text-slate-300 font-bold block mt-1">{new Date(h.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/5 border border-teal-500/10 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-teal-400/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
