'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Terminal, ArrowRight, Lock, Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          new_password: newPassword,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] bg-grid-pattern flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#2B2D31] border border-[#26282D] flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#5865F2]" />
          </div>
          <span className="font-bold text-sm text-[#F2F3F5]">GoChat</span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-[#949BA4] hover:text-[#F2F3F5] flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Login</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto bg-[#17181B] border border-[#26282D] rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#F0B232]/15 border border-[#F0B232]/30 rounded-2xl flex items-center justify-center text-[#F0B232] mx-auto mb-3 shadow-inner">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F3F5]">Reset Password</h1>
          <p className="text-xs text-[#949BA4] mt-1">
            Atur ulang kata sandi akun GoChat Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#F23F43]/15 border border-[#F23F43]/30 rounded-lg text-xs text-[#F23F43] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F23F43]"></span>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-[#23A55A]/15 border border-[#23A55A]/30 rounded-xl text-xs text-[#23A55A] flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              <span className="font-semibold text-sm">Password Berhasil Diperbarui!</span>
              <p className="text-[#F2F3F5] text-xs">
                Kata sandi baru Anda telah aktif. Silakan masuk kembali dengan password baru.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-[#5865F2]/20"
            >
              <span>Masuk ke Akun Anda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#949BA4] uppercase tracking-wider mb-1">
                Alamat Email Akun
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  className="w-full bg-[#111214] border border-[#26282D] focus:border-[#5865F2] text-[#F2F3F5] text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#949BA4] uppercase tracking-wider mb-1">
                Password Baru (Min. 6 Karakter)
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111214] border border-[#26282D] focus:border-[#5865F2] text-[#F2F3F5] text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#949BA4] uppercase tracking-wider mb-1">
                Ulangi Password Baru
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111214] border border-[#26282D] focus:border-[#5865F2] text-[#F2F3F5] text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[#5865F2]/20 cursor-pointer mt-2"
            >
              {loading ? 'Memproses...' : 'Simpan Password Baru'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-[#26282D] text-center text-xs text-[#949BA4]">
          Sudah ingat password Anda?{' '}
          <Link href="/login" className="text-[#5865F2] hover:underline font-medium">
            Masuk Sekarang
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#949BA4]">
        &copy; 2026 GoChat Platform. Built with Go &amp; Next.js.
      </div>
    </div>
  );
}
