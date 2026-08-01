import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl border-t-4 border-teal-700 p-8">
        
        <div className="text-center mb-8">
          <div className="mx-auto bg-slate-100 border border-slate-300 w-16 h-16 flex items-center justify-center rounded-full text-slate-800 text-3xl mb-3 shadow-inner">
            🇮🇳
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase font-sans">Register Credentials</h2>
          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">Create Frontline Health Officer Account</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Officer Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Officer name is required' })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              placeholder="e.g. Meera Devi"
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Official Email Address
            </label>
            <input
              type="email"
              {...register('email', { required: 'Official email is required' })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              placeholder="e.g. name@sahayak.ai"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Secret Password (min 6 chars)
            </label>
            <input
              type="password"
              {...register('password', { 
                required: 'Password is required', 
                minLength: { value: 6, message: 'Password must be at least 6 characters' } 
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Functional Desk Role
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            >
              <option value="worker">ASHA / ANM Frontline Worker</option>
              <option value="supervisor">PHC Supervising Medical Officer</option>
            </select>
          </div>

          {selectedRole === 'worker' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Supervisor Gate
              </label>
              <select
                {...register('supervisorId', { required: 'Please select an supervising medical officer' })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              >
                <option value="">-- Choose Supervising Doctor --</option>
                {/* Seed supervisor will automatically show up as fallback option */}
                <option value="sharma">Dr. Sharma (Primary Health Center - NHM)</option>
              </select>
              {errors.supervisorId && (
                <p className="text-red-600 text-xs mt-1">{errors.supervisorId.message}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-slate-900 text-white font-bold text-sm uppercase py-2.5 rounded hover:bg-slate-800 transition-colors focus:outline-none tracking-wider cursor-pointer border border-slate-700"
          >
            {registerMutation.isPending ? 'Registering Officer...' : 'Create Account & Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-teal-700 hover:underline font-semibold">
            Authenticate session here
          </Link>
        </div>
      </div>
    </div>
  );
}
