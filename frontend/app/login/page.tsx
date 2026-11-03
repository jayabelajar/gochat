'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { MessageSquare } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest<{
        access_token: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuth(data.user, data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#313338] rounded-lg p-8 shadow-2xl border border-[#232428]">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-[#5865F2] rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F2F3F5]">Welcome back!</h1>
          <p className="text-sm text-[#949BA4] mt-1">We're so excited to see you again!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#F23F43]/20 border border-[#F23F43] rounded text-xs text-[#F23F43]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#949BA4] uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#949BA4] uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold py-2.5 rounded transition disabled:opacity-50 mt-2 cursor-pointer shadow-md"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-xs text-[#949BA4] mt-4 text-center">
          Need an account?{' '}
          <Link href="/register" className="text-[#5865F2] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

