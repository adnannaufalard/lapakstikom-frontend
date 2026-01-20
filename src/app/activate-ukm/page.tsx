'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Alert } from '@/components/ui';
import { apiPost, ApiResponse } from '@/lib/api';

function ActivateUkmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('Token aktivasi tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        await apiPost<ApiResponse>('/ukm/activate', { token });
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal mengaktifkan akun');
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [searchParams, router]);

  return (
    <>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
            {loading && (
              <>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Mengaktifkan Akun...
                </h1>
                <p className="text-gray-600">
                  Mohon tunggu sebentar
                </p>
              </>
            )}

            {!loading && success && (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Akun Berhasil Diaktifkan!
                </h1>
                <p className="text-gray-600 mb-6">
                  Selamat! Akun UKM Anda telah aktif. Anda akan diarahkan ke halaman login...
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/login">
                    <Button className="w-full">
                      Login Sekarang
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Kembali ke Beranda
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {!loading && error && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Aktivasi Gagal
                </h1>
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Kemungkinan penyebab:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>Link aktivasi sudah kadaluarsa (lebih dari 24 jam)</li>
                    <li>Link aktivasi sudah pernah digunakan</li>
                    <li>Link aktivasi tidak valid</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/ukm/register">
                    <Button variant="outline" className="w-full">
                      Daftar Ulang
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Kembali ke Beranda
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </>
  );
}

export default function ActivateUkmPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Memuat...</h1>
            </div>
          </div>
        }>
          <ActivateUkmContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
