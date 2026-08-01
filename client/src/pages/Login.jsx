import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Shield, Mail, Lock, AlertTriangle, Play, HelpCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLiveDemo, setIsLiveDemo] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setSession(data.token, data.user);
      if (data.user.role === 'supervisor') {
        navigate('/supervisor');
      } else {
        if (isLiveDemo) {
          navigate('/visits/new', { state: { liveDemo: true } });
        } else {
          navigate('/');
        }
      }
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Authentication failed. Please verify email and password.');
    }
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    loginMutation.mutate(data);
  };

  const handleQuickLogin = (email, password) => {
    setIsLiveDemo(false);
    setValue('email', email);
    setValue('password', password);
    onSubmit({ email, password });
  };

  const handleLiveDemoMode = () => {
    setIsLiveDemo(true);
    setErrorMsg('');
    loginMutation.mutate({
      email: 'rani.worker@sahayak.ai',
      password: 'Password@123'
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* 1. LEFT PANEL (45% Width) - Solid Navy */}
      <div className="w-full md:w-[45%] bg-[#0A1628] text-white p-8 md:p-12 flex flex-col justify-between relative">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0F9B8E]"></div>

        {/* Brand Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            {/* 2x2 grid of dots representing AI intelligence */}
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
              <div className="bg-[#0F9B8E] rounded-sm"></div>
              <div className="bg-[#0F9B8E] rounded-sm"></div>
              <div className="bg-[#13B5A6] rounded-sm"></div>
              <div className="bg-[#E0F5F3] rounded-sm"></div>
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-white leading-none">SAHAYAK AI</h1>
          </div>
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#13B5A6]">
            National Health Mission
          </p>
        </div>

        {/* Middle Mission statement */}
        <div className="my-12 md:my-0 max-w-md">
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 opacity-95">
            "Empowering India's frontline health workers with intelligent decision support."
          </p>
        </div>

        {/* Bottom Credential notices */}
        <div className="space-y-3.5 border-t border-slate-800 pt-6">
          <div className="flex items-center space-x-2.5 text-xs text-slate-400 opacity-90">
            <Shield className="w-4 h-4 text-[#13B5A6] flex-shrink-0" />
            <span className="font-medium">Authorized personnel only</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-400 opacity-90">
            <Shield className="w-4 h-4 text-[#13B5A6] flex-shrink-0" />
            <span className="font-medium">All sessions are logged and audited</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-400 opacity-90">
            <Shield className="w-4 h-4 text-[#13B5A6] flex-shrink-0" />
            <span className="font-medium">For technical support contact your PHC supervisor</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL (55% Width) - Cool Off-White */}
      <div className="w-full md:w-[55%] bg-[#F4F6F9] p-8 md:p-16 flex items-center justify-center relative">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0F9B8E] md:hidden"></div>
        
        {/* System Version Indicator (Top Right) */}
        <div className="absolute top-6 right-8 text-xs font-semibold text-slate-400">
          NHM Decision Support Core v2.1
        </div>

        {/* Login Card Form */}
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0A1628] tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Use your official NHM credentials
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-[#DC2626] text-[#991B1B] px-4 py-3 rounded-lg text-xs flex items-center space-x-2.5 font-medium shadow-sm">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required' })}
                  className="w-full pl-10 pr-3 h-12 border border-slate-300 rounded-lg text-sm bg-white focus-ring text-[#0A1628] font-medium"
                  placeholder="e.g. name.worker@sahayak.ai"
                />
              </div>
              {errors.email && (
                <p className="text-[#DC2626] text-xs mt-1 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Authorized Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full pl-10 pr-3 h-12 border border-slate-300 rounded-lg text-sm bg-white focus-ring text-[#0A1628] font-medium"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-[#DC2626] text-xs mt-1 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {/* Authenticate Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-[#1A3461] hover:bg-[#0A1628] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer shadow-md"
            >
              {loginMutation.isPending ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER'}
            </button>
          </form>

          {/* Demonstration Access Section */}
          <div className="pt-6 border-t border-slate-200 space-y-3.5">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider text-center">
              Demonstration Access
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleQuickLogin('rani.worker@sahayak.ai', 'Password@123')}
                className="flex items-center space-x-2.5 px-3 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] rounded-lg transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#E0F5F3] flex items-center justify-center text-xs font-black text-[#0D7A6F] flex-shrink-0">
                  RD
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs text-slate-800">Rani Devi</span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">ASHA Worker</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickLogin('sharma.supervisor@sahayak.ai', 'Password@123')}
                className="flex items-center space-x-2.5 px-3 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] rounded-lg transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#EEF1F6] flex items-center justify-center text-xs font-black text-[#1E3F75] flex-shrink-0">
                  DS
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs text-slate-800">Dr. Sharma</span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Supervisor</span>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={handleLiveDemoMode}
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-[#0D7A6F] hover:bg-[#0F9B8E] text-white font-semibold text-sm tracking-wide rounded-lg cursor-pointer transition-all duration-150 shadow-md pulse-demo flex items-center justify-center space-x-2 mt-4"
            >
              <span>⚡ LIVE DEMO MODE</span>
            </button>
          </div>

          {/* Bottom links */}
          <div className="text-center text-xs text-slate-500">
            New deployment?{' '}
            <Link to="/register" className="text-[#0F9B8E] hover:underline font-bold">
              Register worker credentials
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
