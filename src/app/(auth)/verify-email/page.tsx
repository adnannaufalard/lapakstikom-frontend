'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

type VerifyStatus = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token verifikasi tidak ditemukan.');
        return;
      }

      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email berhasil diverifikasi!');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verifikasi gagal. Token mungkin sudah kadaluarsa.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Memverifikasi Email...
          </h1>
          <p className="text-gray-600">Mohon tunggu sebentar</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Terverifikasi!
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login">
            <Button className="w-full">Masuk ke Akun</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifikasi Gagal
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Link href="/register">
              <Button className="w-full">Daftar Ulang</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Memuat...
      </h1>
      <p className="text-gray-600">Mohon tunggu sebentar</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
