import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Users, Plus, Home, MapPin, AlertCircle, Trash2, Shield, Eye, CalendarClock } from 'lucide-react';

export default function Households() {
  const { user } = useAuthStore();
  const workerId = user?._id || user?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      village: '',
      category: 'general'
    }
  });

  // 1. Fetch Households
  const { data: households, isLoading } = useQuery({
    queryKey: ['households', workerId],
    queryFn: async () => {
      const res = await api.get(`/households?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  // 2. Create Household Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/households', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households', workerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workerId] });
      reset();
      setShowForm(false);
    }
  });

  // 3. Delete Household Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/households/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households', workerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workerId] });
      queryClient.invalidateQueries({ queryKey: ['visits', workerId] });
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id, name) => {
    if (confirm(`⚠️ WARNING: Deleting household "${name}" will permanently delete ALL of its visits, reports, and escalations. This cannot be undone. Proceed?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#030712]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-400 mt-5 uppercase tracking-[0.15em] animate-pulse">Syncing Household Registry...</p>
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
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-tight font-display">Household Registry</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Manage assigned families and monitoring categories</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase px-4 h-10 rounded-xl tracking-wider transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
        >
          <Plus className="w-4.5 h-4.5 text-white" />
          <span>{showForm ? 'Cancel Creation' : 'Add New Family'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md shadow-2xl max-w-lg space-y-4 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl -z-10 blur-sm pointer-events-none"></div>
          
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-white border-b border-white/5 pb-2.5 mb-2 font-display">Register Household</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Family / Patient Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Patient/Household Name is required' })}
                className="w-full h-11 px-4 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                placeholder="e.g. Meena Devi"
              />
              {errors.name && (
                <p className="text-red-400 text-[10px] mt-1.5 font-bold">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Village Sector
              </label>
              <input
                type="text"
                {...register('village', { required: 'Village is required' })}
                className="w-full h-11 px-4 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                placeholder="e.g. Chandanpur"
              />
              {errors.village && (
                <p className="text-red-400 text-[10px] mt-1.5 font-bold">{errors.village.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Primary Monitoring Category
            </label>
            <select
              {...register('category')}
              className="w-full h-11 px-4 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold cursor-pointer appearance-none"
            >
              <option value="general" className="bg-slate-900">🩺 General Healthcare</option>
              <option value="maternal" className="bg-slate-900">🤰 Maternal Care</option>
              <option value="child_nutrition" className="bg-slate-900">👶 Child Nutrition</option>
              <option value="TB_HIV" className="bg-slate-900">💊 Infectious (TB/HIV) Monitoring</option>
              <option value="immunization" className="bg-slate-900">💉 Childhood Immunization</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98] mt-3"
          >
            {createMutation.isPending ? 'Registering...' : 'Complete Household Registration'}
          </button>
        </form>
      )}

      {households?.length === 0 ? (
        <div className="bg-[#0b1329]/30 border border-white/5 rounded-2xl p-16 text-center shadow-2xl backdrop-blur-md">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
          <p className="font-extrabold text-white text-sm">Registry is empty.</p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">Click "Add New Family" above to register your first community household.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {households?.map((h) => (
            <div key={h._id || h.id} className="bg-[#0b1329]/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:scale-[1.01] hover:border-white/10 hover:shadow-2xl transition-all duration-300 backdrop-blur-md relative group">
              <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors"></div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors font-display">{h.name}</h4>
                    <div className="flex items-center text-slate-400 text-xs mt-1.5 font-bold space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400/80" />
                      <span>{h.village}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(h._id || h.id, h.name)}
                    className="p-1.5 text-slate-500 hover:text-red-400 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer flex-shrink-0"
                    title="Delete Household"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <span className="inline-block text-[9px] font-black uppercase bg-teal-500/10 border border-teal-500/15 text-teal-300 px-3 py-1 rounded-lg">
                  {getCategoryLabel(h.category)}
                </span>
              </div>

              <div className="bg-slate-950/30 border-t border-white/5 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm">
                <Link
                  to={`/households/${h._id || h.id}`}
                  className="text-xs text-teal-400 hover:text-teal-300 hover:underline font-black uppercase tracking-wider flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Case History</span>
                </Link>
                <Link
                  to="/visits/new"
                  state={{ householdId: h._id || h.id }}
                  className="bg-gradient-to-r from-teal-600/10 to-cyan-600/10 hover:from-teal-600/20 hover:to-cyan-600/20 border border-teal-500/25 hover:border-teal-500/40 text-teal-300 font-extrabold text-[10px] uppercase px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow"
                >
                  Log Visit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
