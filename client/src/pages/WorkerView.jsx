import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { ArrowLeft, User, Users, MapPin, Inbox } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 mt-4 uppercase tracking-wider">Syncing Case Registry...</p>
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
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
        <Link 
          to="/supervisor" 
          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-500 transition-colors"
          title="Return to dispatch desk"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Worker Workload Ledger</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Read-Only View of Supervised Households</p>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 rounded p-4 flex items-center space-x-3 text-xs text-slate-700">
        <User className="w-5 h-5 text-slate-400" />
        <div>
          <p className="font-bold text-slate-800">Officer Workload</p>
          <p className="font-semibold text-slate-500">Showing all registered households assigned under this field officer.</p>
        </div>
      </div>

      {households?.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
          <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No households registered.</p>
          <p className="text-xs text-slate-400 mt-1">This worker has not initialized any household records on their account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households?.map((h) => (
            <div key={h._id || h.id} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{h.name}</h4>
                    <div className="flex items-center text-slate-500 text-xs mt-1 font-semibold space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{h.village}</span>
                    </div>
                  </div>
                </div>
                
                <span className="inline-block text-[10px] font-semibold uppercase bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded">
                  {getCategoryLabel(h.category)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-4 text-xs">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Registered date</span>
                <span className="text-slate-700 font-bold block mt-0.5">{new Date(h.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
