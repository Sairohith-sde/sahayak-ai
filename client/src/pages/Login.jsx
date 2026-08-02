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
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-hidden bg-[#030712] relative">
      
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none"></div>

      {/* 1. LEFT PANEL (45% Width) - Sleek Navy Glass Arc */}
      <div className="w-full md:w-[45%] bg-[#080f1e]/80 border-r border-white/5 p-8 md:p-12 flex flex-col justify-between relative backdrop-blur-sm z-10">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-teal-500 to-cyan-500"></div>

        {/* Brand Header */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            {/* Elegant glowing logo container */}
            <div className="grid grid-cols-2 gap-1 w-7 h-7 p-0.5 rounded bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <div className="bg-teal-500 rounded-sm animate-pulse"></div>
              <div className="bg-teal-400 rounded-sm"></div>
              <div className="bg-cyan-500 rounded-sm"></div>
              <div className="bg-slate-300 rounded-sm"></div>
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-white leading-none font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-300">
              SAHAYAK AI
            </h1>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-400">
            National Health Mission
          </p>
        </div>

        {/* Middle Mission statement */}
        <div className="my-14 md:my-0 max-w-md space-y-4">
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 font-display">
            "Empowering India's frontline health workers with intelligent decision support."
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded"></div>
        </div>

        {/* Bottom Credential notices */}
        <div className="space-y-4 border-t border-white/5 pt-8">
          <div className="flex items-center space-x-3 text-xs text-slate-400/90 hover:text-slate-300 transition-colors">
            <div className="p-1.5 rounded-md bg-teal-500/5 border border-teal-500/10 text-teal-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-wide">Authorized personnel only</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400/90 hover:text-slate-300 transition-colors">
            <div className="p-1.5 rounded-md bg-teal-500/5 border border-teal-500/10 text-teal-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-wide">All sessions are logged and audited</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400/90 hover:text-slate-300 transition-colors">
            <div className="p-1.5 rounded-md bg-teal-500/5 border border-teal-500/10 text-teal-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-wide">For support, contact PHC supervisor</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL (55% Width) - Obsidian Form container */}
      <div className="w-full md:w-[55%] p-8 md:p-16 flex items-center justify-center relative z-10">
        
        {/* System Version Indicator (Top Right) */}
        <div className="absolute top-6 right-8 text-xs font-bold text-slate-500 tracking-wider">
          NHM DECISION CORE v2.1
        </div>

        {/* Login Card Form - Translucent dark panel */}
        <div className="max-w-md w-full space-y-8 bg-slate-900/30 border border-white/5 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative">
          
          {/* Subtle glowing ring decoration */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-2xl -z-10 blur-sm pointer-events-none"></div>

          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight font-display bg-clip-text">
              Sign in to your account
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
              Use your official NHM credentials
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-3 font-semibold shadow-inner">
              <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 animate-bounce" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4.5 h-4.5 text-slate-500" />
                </div>
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required' })}
                  className="w-full pl-11 pr-4 h-12 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                  placeholder="e.g. name.worker@sahayak.ai"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Authorized Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5 text-slate-500" />
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full pl-11 pr-4 h-12 border border-white/5 rounded-xl text-sm bg-slate-950/40 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.password.message}</p>
              )}
            </div>

            {/* Authenticate Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              {loginMutation.isPending ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER'}
            </button>
          </form>

          {/* Demonstration Access Section */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.12em] text-center">
              Quick Sandbox Access
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleQuickLogin('rani.worker@sahayak.ai', 'Password@123')}
                className="flex items-center space-x-3 px-3 py-2.5 border border-white/5 bg-slate-950/20 hover:bg-slate-950/40 hover:border-teal-500/30 active:scale-[0.98] rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-xs font-black text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                  RD
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs text-white">Rani Devi</span>
                  <span className="block text-[9px] font-black text-teal-400/80 uppercase tracking-wide">ASHA Worker</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickLogin('sharma.supervisor@sahayak.ai', 'Password@123')}
                className="flex items-center space-x-3 px-3 py-2.5 border border-white/5 bg-slate-950/20 hover:bg-slate-950/40 hover:border-cyan-500/30 active:scale-[0.98] rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xs font-black text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                  DS
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs text-white">Dr. Sharma</span>
                  <span className="block text-[9px] font-black text-cyan-400/80 uppercase tracking-wide">Supervisor</span>
                </div>
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleLiveDemoMode}
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 hover:from-teal-500/15 hover:to-cyan-500/15 border border-teal-500/25 hover:border-teal-500/40 text-teal-300 font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-center space-x-2 animate-pulse"
            >
              <span>⚡ Start Live Sandbox</span>
            </button>
          </div>

          {/* Bottom links */}
          <div className="text-center text-xs text-slate-400 font-semibold pt-2">
            New deployment?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-extrabold hover:underline">
              Register credentials
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
