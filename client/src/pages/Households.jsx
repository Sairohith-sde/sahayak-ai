import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Users, Plus, Home, MapPin, AlertCircle, Trash2 } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 mt-4 uppercase tracking-wider">Syncing Household Registry...</p>
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Household Registry</h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">Manage assigned families and monitoring categories</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded tracking-wider cursor-pointer shadow border border-slate-700"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel Creation' : 'Add New Family'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg p-6 border border-slate-300 shadow-sm max-w-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-2 mb-2">Register Household</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Family / Patient Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Patient/Household Name is required' })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                placeholder="e.g. Meena Devi"
              />
              {errors.name && (
                <p className="text-red-600 text-[10px] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Village Sector
              </label>
              <input
                type="text"
                {...register('village', { required: 'Village is required' })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                placeholder="e.g. Chandanpur"
              />
              {errors.village && (
                <p className="text-red-600 text-[10px] mt-1">{errors.village.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Primary Monitoring Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-slate-300 bg-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="general">🩺 General Healthcare</option>
              <option value="maternal">🤰 Maternal Care</option>
              <option value="child_nutrition">👶 Child Nutrition</option>
              <option value="TB_HIV">💊 Infectious (TB/HIV) Monitoring</option>
              <option value="immunization">💉 Childhood Immunization</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded hover-active-scale cursor-pointer"
          >
            {createMutation.isPending ? 'Registering...' : 'Complete Household Registration'}
          </button>
        </form>
      )}

      {households?.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">Registry is empty.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add New Family" above to register your first community household.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households?.map((h) => (
            <div key={h._id || h.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{h.name}</h4>
                    <div className="flex items-center text-slate-500 text-xs mt-1 font-semibold space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{h.village}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(h._id || h.id, h.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer border border-transparent hover:border-red-200"
                    title="Delete Household"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <span className="inline-block text-[10px] font-semibold uppercase bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded">
                  {getCategoryLabel(h.category)}
                </span>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
                <Link
                  to={`/households/${h._id || h.id}`}
                  className="text-xs text-teal-700 hover:underline font-bold uppercase tracking-wider"
                >
                  View Case History
                </Link>
                <Link
                  to="/visits/new"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded tracking-wider cursor-pointer"
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
