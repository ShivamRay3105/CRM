'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Link from 'next/link';
import Navbar from './Navbar';

// Validation schema
const schema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'employee' | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Extract role from URL path
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) setRole('admin');
      else if (pathname.startsWith('/manager')) setRole('manager');
      else if (pathname.startsWith('/employee')) setRole('employee');
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-password`, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }, {
        withCredentials: true, // Include session cookies
      });
      setSuccess(response.data);
      reset(); // Clear form
      setTimeout(() => router.push(`/${role}/tasks`), 2000); // Redirect to role-specific dashboard
    } catch (err: any) {
      setError(err.response?.data || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="">
        <Navbar role={role || 'manager'} />
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
            Change Password
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Update your account password securely
          </p>
        </div>
      </div>
      <div className="container mx-auto px-6 pb-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 max-w-md mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Old Password *</label>
              <input
                type="password"
                {...register('oldPassword')}
                className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                placeholder="Enter old password"
              />
              {errors.oldPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.oldPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">New Password *</label>
              <input
                type="password"
                {...register('newPassword')}
                className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Confirm New Password *</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Link
                href={`/${role}/tasks`}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200"
              >
                <span className="relative z-10">Cancel</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Change Password</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}