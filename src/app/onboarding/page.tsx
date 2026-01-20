'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, checkUsername, completeOnboarding, getOnboardingToken } from '@/lib/auth';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false); // Track if coming from login

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'MAHASISWA' as 'MAHASISWA' | 'DOSEN' | 'KARYAWAN',
    nim: '',
    program_studi: '',
    phone: '',
    gender: '',
    birth_date: '',
  });

  useEffect(() => {
    // Check if coming from login (with onboarding token) or register (with email/password)
    const onboardingToken = getOnboardingToken();
    const email = sessionStorage.getItem('register_email');
    const password = sessionStorage.getItem('register_password');

    // If has onboarding token (from login), skip to step 2 (complete profile)
    if (onboardingToken) {
      setIsOnboardingFlow(true);
      setCurrentStep(2);
      return;
    }

    // If from register flow, need email and password
    if (!email || !password) {
      router.push('/register');
      return;
    }

    setFormData(prev => ({ ...prev, email, password }));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Reset username availability when typing
    if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async () => {
    if (!formData.username || formData.username.length < 3) return;

    setCheckingUsername(true);
    try {
      const result = await checkUsername(formData.username);
      setUsernameAvailable(result.available);
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateStepOne = () => {
    if (!formData.full_name || formData.full_name.length < 2) {
      setError('Nama lengkap minimal 2 karakter');
      return false;
    }

    if (!formData.username || formData.username.length < 3) {
      setError('Username minimal 3 karakter');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username hanya boleh huruf, angka, dan underscore');
      return false;
    }

    if (usernameAvailable === false) {
      setError('Username sudah digunakan');
      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    if (formData.role === 'MAHASISWA') {
      if (!formData.nim || formData.nim.length < 5) {
        setError('NIM minimal 5 karakter');
        return false;
      }
      if (!formData.program_studi) {
        setError('Program studi harus diisi');
        return false;
      }
    }

    if (!formData.phone || formData.phone.length < 10) {
      setError('Nomor telepon minimal 10 digit');
      return false;
    }

    if (!formData.gender) {
      setError('Jenis kelamin harus dipilih');
      return false;
    }

    if (!formData.birth_date) {
      setError('Tanggal lahir harus diisi');
      return false;
    }

    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentStep === 1) {
      if (validateStepOne()) {
        setCurrentStep(2);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStepTwo()) return;

    setLoading(true);

    try {
      if (isOnboardingFlow) {
        // Onboarding flow: Complete profile for existing user
        const result = await completeOnboarding({
          username: formData.username,
          role: formData.role,
          bio: '',
          phone: formData.phone,
        });

        // Clear onboarding token
        sessionStorage.removeItem('onboarding_token');

        // Redirect based on role
        if (result.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (result.user.role === 'UKM_OFFICIAL') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
        return;
      }

      // Register flow: Create new account
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        username: formData.username,
        role: formData.role,
        nim: formData.role === 'MAHASISWA' ? formData.nim : undefined,
        program_studi: formData.role === 'MAHASISWA' ? formData.program_studi : undefined,
        phone: formData.phone,
        gender: formData.gender,
        birth_date: formData.birth_date,
      });

      // Clear register sessionStorage
      sessionStorage.removeItem('register_email');
      sessionStorage.removeItem('register_password');

      // Redirect to OTP verification page
      sessionStorage.setItem('verify_email', formData.email);
      router.push('/verify-otp');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError('');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lengkapi Data Diri</h1>
          <p className="text-sm text-gray-600">Step {currentStep} dari 2</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-600">Progress</span>
            <span className="text-xs font-medium text-blue-600">{currentStep * 50}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentStep * 50}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukan nama lengkap sesuai KTP"
                  autoFocus
                />
              </div>

              {/* Username */}
              <div className="md:col-span-2">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={checkUsernameAvailability}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    placeholder="username_unik"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameAvailable ? (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Hanya huruf, angka, dan underscore. Min. 3 karakter</p>
              </div>

              {/* Role */}
              <div className="md:col-span-2">
                <label htmlFor="role" className="block text-sm font-semibold text-gray-900 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['MAHASISWA', 'DOSEN', 'KARYAWAN'].map((role) => (
                    <label
                      key={role}
                      className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.role === role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className={`text-sm font-semibold ${
                          formData.role === role ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {role === 'MAHASISWA' ? 'Mahasiswa' : role === 'DOSEN' ? 'Dosen' : 'Karyawan'}
                        </div>
                      </div>
                      {formData.role === role && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional fields for MAHASISWA */}
              {formData.role === 'MAHASISWA' && (
                <>
                  <div>
                    <label htmlFor="nim" className="block text-sm font-semibold text-gray-900 mb-2">
                      NIM <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nim"
                      type="text"
                      name="nim"
                      required
                      value={formData.nim}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="202201001"
                    />
                  </div>

                  <div>
                    <label htmlFor="program_studi" className="block text-sm font-semibold text-gray-900 mb-2">
                      Program Studi <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="program_studi"
                      name="program_studi"
                      required
                      value={formData.program_studi}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih Program Studi</option>
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Desain Komunikasi Visual">Desain Komunikasi Visual</option>  
                      <option value="Komputerisasi Akuntansi">Komputerisasi Akuntansi</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Lanjutkan
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Additional Information */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="08123456789"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-gray-900 mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>

              {/* Birth Date */}
              <div className="md:col-span-2">
                <label htmlFor="birth_date" className="block text-sm font-semibold text-gray-900 mb-2">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  id="birth_date"
                  type="date"
                  name="birth_date"
                  required
                  value={formData.birth_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Verifikasi Email</p>
                  <p className="text-xs">Setelah ini, kode OTP akan dikirim ke email Anda untuk verifikasi akun.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Kirim Kode OTP'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
