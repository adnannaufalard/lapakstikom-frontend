'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

interface KetuaData {
  full_name: string;
  email: string;
  role: string;
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
  const [ketuaEmail, setKetuaEmail] = useState('');
  const [ketuaData, setKetuaData] = useState<KetuaData | null>(null);
  const [searchingKetua, setSearchingKetua] = useState(false);

  // Step 3: OTP
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [tempUserId, setTempUserId] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Step 1: Register UKM account
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
    if (!formData.email.trim()) {
      setError('Email UKM wajib diisi');
      return;
    }
    // Validate email domain
    const emailDomain = formData.email.split('@')[1];
    if (emailDomain !== 'student.stikomyos.ac.id' && emailDomain !== 'stikomyos.ac.id') {
      setError('Email harus menggunakan domain institusi (@student.stikomyos.ac.id atau @stikomyos.ac.id)');
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

    setLoading(true);
    try {
      const response = await apiPost<ApiResponse & { data: { user_id: string } }>(
        '/auth/register-ukm',
        {
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }
      );
      
      setTempUserId(response.data.user_id);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftarkan akun UKM');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Search for ketua
  const handleSearchKetua = async () => {
    if (!ketuaEmail.trim()) {
      setError('Email ketua wajib diisi');
      return;
    }

    const emailDomain = ketuaEmail.split('@')[1];
    if (emailDomain !== 'student.stikomyos.ac.id' && emailDomain !== 'stikomyos.ac.id') {
      setError('Email ketua harus menggunakan domain institusi');
      return;
    }

    setSearchingKetua(true);
    setError('');
    
    try {
      const response = await apiGet<ApiResponse & { data: KetuaData }>(
        `/ukm/check-ketua/${encodeURIComponent(ketuaEmail)}`
      );
      
      setKetuaData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ketua tidak ditemukan');
      setKetuaData(null);
    } finally {
      setSearchingKetua(false);
    }
  };

  // Step 2: Link ketua and send OTP
  const handleLinkKetua = async () => {
    if (!ketuaData) return;

    setLoading(true);
    setError('');

    try {
      await apiPost<ApiResponse>('/ukm/link-ketua', {
        ukm_user_id: tempUserId,
        ketua_email: ketuaEmail,
      });

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
        ukm_user_id: tempUserId,
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
        ukm_user_id: tempUserId,
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
      { number: 4, label: 'Selesai' },
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
        placeholder="email@student.stikomyos.ac.id"
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
          Masukkan email ketua UKM yang terdaftar di sistem. Sistem akan mengirimkan kode OTP ke email ketua untuk verifikasi.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          label="Email Ketua UKM"
          value={ketuaEmail}
          onChange={(e) => {
            setKetuaEmail(e.target.value);
            setKetuaData(null);
            setError('');
          }}
          placeholder="ketua@student.stikomyos.ac.id"
          disabled={ketuaData !== null}
        />
        {!ketuaData && (
          <Button
            onClick={handleSearchKetua}
            disabled={searchingKetua || !ketuaEmail.trim()}
            className="mt-6"
          >
            {searchingKetua ? 'Mencari...' : 'Cari'}
          </Button>
        )}
      </div>

      {ketuaData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">{ketuaData.full_name}</p>
              <p className="text-sm text-green-700">{ketuaData.email}</p>
              <p className="text-xs text-green-600 mt-1">
                {ketuaData.role === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'}
              </p>
            </div>
            <button
              onClick={() => {
                setKetuaData(null);
                setKetuaEmail('');
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
          disabled={!ketuaData || loading}
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
          Kode OTP telah dikirim ke email <strong>{ketuaEmail}</strong>. Silakan masukkan kode 6 digit yang diterima.
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
          Link aktivasi telah dikirim ke email <strong>{formData.email}</strong>
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-left">
        <h3 className="font-medium text-blue-900 mb-3">Langkah Selanjutnya:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
          <li>Buka email Anda dan cari email dari Lapak STIKOM</li>
          <li>Klik link aktivasi yang terdapat dalam email</li>
          <li>Setelah aktivasi berhasil, Anda dapat login menggunakan email dan password yang telah dibuat</li>
          <li>Lengkapi profil UKM Anda dan mulai berjualan!</li>
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
            <p>Link aktivasi hanya berlaku selama 24 jam. Jika tidak menerima email, periksa folder spam atau hubungi admin.</p>
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
          <Button className="w-full">
            Login
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
