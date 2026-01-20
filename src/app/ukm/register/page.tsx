'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
}

export default function UkmRegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Data UKM
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
  });

  // Step 2: Ketua UKM
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedKetua, setSelectedKetua] = useState<UserSearchResult | null>(null);
  const [searchingKetua, setSearchingKetua] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Step 3: OTP
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [sessionId, setSessionId] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Debounced search for ketua
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearchKetua(searchQuery);
      }, 500);
      setSearchDebounce(timeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchDebounce) clearTimeout(searchDebounce);
    };
  }, [searchQuery]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Step 1: Validate and proceed
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.full_name.trim()) {
      setError('Nama UKM wajib diisi');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username wajib diisi');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    // Validate username format (no spaces)
    if (/\s/.test(formData.username)) {
      setError('Username tidak boleh mengandung spasi');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email UKM wajib diisi');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Nomor telepon wajib diisi');
      return;
    }

    // Validate data with backend
    setLoading(true);
    try {
      await apiPost<ApiResponse>('/auth/validate-ukm', {
        username: formData.username,
        email: formData.email,
      });
      
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validasi data gagal');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Search for ketua (realtime)
  const handleSearchKetua = async (query: string) => {
    if (query.trim().length < 2) return;

    setSearchingKetua(true);
    setError('');
    
    try {
      const response = await apiGet<ApiResponse & { data: UserSearchResult[] }>(
        `/ukm/search-users?q=${encodeURIComponent(query)}`
      );
      
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchingKetua(false);
    }
  };

  // Step 2: Verify and select ketua
  const handleSelectKetua = async (user: UserSearchResult) => {
    try {
      await apiGet<ApiResponse>(`/ukm/check-ketua/${user.id}`);
      setSelectedKetua(user);
      setSearchQuery('');
      setSearchResults([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ketua tidak valid');
    }
  };

  // Step 2: Link ketua and send OTP
  const handleLinkKetua = async () => {
    if (!selectedKetua) return;

    setLoading(true);
    setError('');

    try {
      // Only send required fields (exclude confirm_password)
      const { confirm_password, ...ukmData } = formData;
      
      const response = await apiPost<ApiResponse & { data: { session_id: string } }>(
        '/ukm/link-ketua',
        {
          ukm_data: ukmData,
          ketua_user_id: selectedKetua.id,
        }
      );

      setSessionId(response.data.session_id);
      setResendCountdown(60);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim kode OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setLoading(true);
    try {
      await apiPost<ApiResponse>('/ukm/verify-ketua', {
        session_id: sessionId,
        otp_code: otpCode,
      });

      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kode OTP tidak valid');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await apiPost<ApiResponse>('/ukm/resend-otp', {
        session_id: sessionId,
      });

      setResendCountdown(60);
      setOtpCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim ulang kode OTP');
    } finally {
      setLoading(false);
    }
  };

  // Render progress stepper
  const renderStepper = () => {
    const steps = [
      { number: 1, label: 'Data UKM' },
      { number: 2, label: 'Link Ketua' },
      { number: 3, label: 'Verifikasi' },
      { number: 4, label: 'Review Admin' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Step 1: Data UKM
  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-4">
      <Input
        label="Nama UKM"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Contoh: Senat Mahasiswa"
        required
      />

      <Input
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Tanpa spasi, minimal 3 karakter"
        required
      />

      <Input
        label="Email UKM"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="email@stikomyos.ac.id atau email pribadi"
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Minimal 6 karakter"
        required
      />

      <Input
        label="Konfirmasi Password"
        name="confirm_password"
        type="password"
        value={formData.confirm_password}
        onChange={handleChange}
        placeholder="Ulangi password"
        required
      />

      <Input
        label="Nomor Telepon"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="08xxxxxxxxxx"
        required
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Memproses...' : 'Lanjutkan'}
        </Button>
        <Link href="/" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            Batal
          </Button>
        </Link>
      </div>
    </form>
  );

  // Render Step 2: Link Ketua
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Cari akun ketua UKM dengan username, nama, email, atau nomor telepon. Sistem akan mengirimkan kode OTP ke email ketua untuk verifikasi.
        </p>
      </div>

      {!selectedKetua ? (
        <div className="relative">
          <Input
            label="Cari Ketua UKM"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik username, nama, email, atau nomor telepon..."
          />
          
          {searchingKetua && (
            <div className="absolute right-3 top-10">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectKetua(user)}
                  className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {user.role === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searchingKetua && searchResults.length === 0 && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-center text-gray-600 text-sm">
              Tidak ada hasil ditemukan. Coba kata kunci lain.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              {selectedKetua.avatar_url ? (
                <img src={selectedKetua.avatar_url} alt={selectedKetua.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-green-700 font-medium">
                  {selectedKetua.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">{selectedKetua.full_name}</p>
              <p className="text-sm text-green-700">@{selectedKetua.username}</p>
              <p className="text-sm text-green-700">{selectedKetua.email}</p>
              <p className="text-xs text-green-600 mt-1">
                {selectedKetua.role === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedKetua(null);
                setSearchQuery('');
              }}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleLinkKetua}
          className="flex-1"
          disabled={!selectedKetua || loading}
        >
          {loading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
        </Button>
        <Button
          onClick={() => setCurrentStep(1)}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Kembali
        </Button>
      </div>
    </div>
  );

  // Render Step 3: Verify OTP
  const renderStep3 = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Kode OTP telah dikirim ke email <strong>{selectedKetua?.email}</strong>. Silakan masukkan kode 6 digit yang diterima.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kode OTP (6 Digit)
        </label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtpCode(value);
            setError('');
          }}
          className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="000000"
          maxLength={6}
          required
        />
      </div>

      <div className="text-center">
        {resendCountdown > 0 ? (
          <p className="text-sm text-gray-600">
            Kirim ulang kode dalam <strong>{resendCountdown}</strong> detik
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Kirim ulang kode OTP
          </button>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={loading || otpCode.length !== 6}>
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep(2)}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Kembali
        </Button>
      </div>
    </form>
  );

  // Render Step 4: Success
  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pendaftaran Berhasil!
        </h2>
        <p className="text-gray-600">
          Permohonan pendaftaran UKM <strong>{formData.full_name}</strong> telah diterima
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-left">
        <h3 className="font-medium text-blue-900 mb-3">Langkah Selanjutnya:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
          <li>Permohonan Anda akan ditinjau oleh Admin Lapak STIKOM</li>
          <li>Admin akan memverifikasi data dan kelengkapan dokumen UKM</li>
          <li>Proses review biasanya memakan waktu 1-3 hari kerja</li>
          <li>Anda akan menerima notifikasi melalui email setelah permohonan disetujui atau ditolak</li>
          <li>Setelah disetujui, Anda dapat login dan mulai berjualan di Lapak STIKOM</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Catatan Penting:</p>
            <p>Pastikan data yang Anda masukkan sudah benar. Jika ada pertanyaan atau ingin mengubah data, silakan hubungi admin melalui email atau WhatsApp yang tertera di halaman Kontak.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            Kembali ke Beranda
          </Button>
        </Link>
        <Link href="/login" className="flex-1">
          <Button className="w-full" disabled>
            Login (Menunggu Persetujuan)
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Daftarkan Akun UKM
            </h1>
            <p className="text-gray-600">
              Ikuti langkah-langkah berikut untuk mendaftarkan akun UKM Anda
            </p>
          </div>

          {/* Stepper */}
          {renderStepper()}

          {/* Form Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Footer Link */}
          {currentStep < 4 && (
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Login di sini
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
