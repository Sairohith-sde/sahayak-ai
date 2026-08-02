import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { AlertTriangle, User, Mail, Lock, Shield, LayoutGrid } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'worker',
      supervisorId: ''
    }
  });

  const selectedRole = watch('role');

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    onSuccess: (data) => {
      setSession(data.token, data.user);
      if (data.user.role === 'supervisor') {
        navigate('/supervisor');
      } else {
        navigate('/');
      }
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please review values.');
    }
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    const submissionData = { ...data };
    if (submissionData.role === 'supervisor') {
      submissionData.supervisorId = null;
    }
    registerMutation.mutate(submissionData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 relative font-sans overflow-hidden py-12">
      
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[300px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/30 border border-white/5 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative z-10">
        
        {/* Glowing border outline */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-2xl -z-10 blur-sm pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="mx-auto bg-teal-500/10 border border-teal-500/20 w-14 h-14 flex items-center justify-center rounded-xl text-3xl mb-4 shadow-[0_0_15px_rgba(20,184,166,0.15)] animate-pulse">
            🇮🇳
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-display">Register Credentials</h2>
          <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mt-1.5">Create Frontline Health Officer Account</p>
        </div>

        {errorMsg && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-3 font-semibold shadow-inner">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Officer Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                {...register('name', { required: 'Officer name is required' })}
                className="w-full pl-11 pr-4 h-11 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                placeholder="e.g. Meera Devi"
              />
            </div>
            {errors.name && (
              <p className="text-red-400 text-xs mt-1 font-bold">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <input
                type="email"
                {...register('email', { required: 'Official email is required' })}
                className="w-full pl-11 pr-4 h-11 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                placeholder="e.g. name@sahayak.ai"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 font-bold">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Secret Password (min 6 chars)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required', 
                  minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                })}
                className="w-full pl-11 pr-4 h-11 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 font-bold">{errors.password.message}</p>
            )}
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Functional Desk Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <LayoutGrid className="w-4.5 h-4.5" />
              </div>
              <select
                {...register('role')}
                className="w-full pl-11 pr-4 h-11 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold appearance-none cursor-pointer"
              >
                <option value="worker" className="bg-slate-900">ASHA / ANM Frontline Worker</option>
                <option value="supervisor" className="bg-slate-900">PHC Supervising Medical Officer</option>
              </select>
            </div>
          </div>

          {/* Supervisor choice dropdown (for workers only) */}
          {selectedRole === 'worker' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Assigned Supervisor Gate
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <select
                  {...register('supervisorId', { required: 'Please select a supervising medical officer' })}
                  className="w-full pl-11 pr-4 h-11 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">-- Choose Supervising Doctor --</option>
                  <option value="sharma" className="bg-slate-900">Dr. Sharma (Primary Health Center - NHM)</option>
                </select>
              </div>
              {errors.supervisorId && (
                <p className="text-red-400 text-xs mt-1 font-bold">{errors.supervisorId.message}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98] mt-4"
          >
            {registerMutation.isPending ? 'Registering Officer...' : 'Create Account & Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-teal-400 hover:text-teal-300 font-extrabold hover:underline">
            Authenticate session here
          </Link>
        </div>
      </div>
    </div>
  );
}
