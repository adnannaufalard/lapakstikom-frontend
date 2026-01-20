'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Alert } from '@/components/ui';
import { apiGet, ApiResponse } from '@/lib/api';

interface StatusData {
  ukm_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export default function UkmRegisterStatusPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState<StatusData | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusData(null);

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await apiGet<ApiResponse<StatusData>>(`/ukm/register/status?email=${encodeURIComponent(email)}`);
      setStatusData(response.data as StatusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pendaftaran tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Menunggu Verifikasi
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cek Status Pendaftaran UKM
            </h1>
            <p className="text-gray-600">
              Masukkan email yang digunakan saat mendaftar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCheck} className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <Input
              label="Email Pendaftaran"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="email@student.stikomyos.ac.id"
              required
            />

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? 'Mencari...' : 'Cek Status'}
            </Button>
          </form>

          {/* Status Result */}
          {statusData && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-center mb-6">
                {getStatusBadge(statusData.status)}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nama UKM</p>
                  <p className="font-medium text-gray-900">{statusData.ukm_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tanggal Pengajuan</p>
                  <p className="font-medium text-gray-900">{formatDate(statusData.submitted_at)}</p>
                </div>

                {statusData.reviewed_at && (
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Review</p>
                    <p className="font-medium text-gray-900">{formatDate(statusData.reviewed_at)}</p>
                  </div>
                )}

                {statusData.status === 'REJECTED' && statusData.admin_notes && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-sm font-medium text-red-800 mb-1">Alasan Penolakan:</p>
                    <p className="text-sm text-red-700">{statusData.admin_notes}</p>
                  </div>
                )}

                {statusData.status === 'APPROVED' && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-green-800">
                      <strong>Selamat!</strong> Pendaftaran UKM Anda telah disetujui. 
                      Silakan cek email untuk kredensial login Anda.
                    </p>
                    <Link href="/login" className="mt-3 inline-block">
                      <Button size="sm">
                        Login Sekarang
                      </Button>
                    </Link>
                  </div>
                )}

                {statusData.status === 'PENDING' && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-sm text-yellow-800">
                      Pendaftaran Anda sedang dalam proses verifikasi. 
                      Mohon tunggu, admin akan menghubungi Anda jika diperlukan data tambahan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link href="/ukm/register" className="text-blue-600 hover:underline font-medium">
              ← Kembali ke pendaftaran
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
