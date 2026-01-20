'use client';

import { useState } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiPost, ApiResponse } from '@/lib/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiPost<ApiResponse>('/auth/forgot-password', { email });
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Gagal mengirim email reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Lupa Password</h2>
          <p className="mt-2 text-gray-600">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {success ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-green-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Terkirim!
              </h3>
              <p className="text-gray-600 mb-6">
                Jika email Anda terdaftar, kami telah mengirimkan link reset password ke email Anda.
                Silakan cek inbox atau folder spam Anda.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Link akan kadaluarsa dalam 1 jam.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.stikomyos.ac.id"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
