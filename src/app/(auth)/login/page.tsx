'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, setPendingEmail, setOnboardingToken } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      
      if (result.requiresOnboarding && result.onboardingToken) {
        setOnboardingToken(result.onboardingToken);
        // Redirect to onboarding page instead of register
        router.push('/onboarding');
        return;
      }

      if (result.user) {
        if (result.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (result.user.role === 'UKM_OFFICIAL') {
          router.push('/dashboard');
        } else {
          router.push(redirectTo);
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-blue-500 flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col p-6 text-white">
        {/* Logo */}
        <div className="mb-4">
          <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto brightness-0 invert" />
        </div>
        
        {/* Illustration & Welcome Text */}
        <div className="flex-1 flex flex-col justify-start pt-8 max-w-lg">
          {/* Illustration */}
          <div className="mb-6">
            <svg viewBox="0 0 500 350" className="w-full max-w-md">
              {/* Background blob */}
              <ellipse cx="250" cy="200" rx="220" ry="140" fill="rgba(255,255,255,0.15)" />
              
              {/* Left person */}
              <g transform="translate(100, 150)">
                {/* Head */}
                <circle cx="20" cy="0" r="25" fill="#FBBF24" />
                <path d="M 5 -5 Q 20 -15 35 -5" stroke="#78350F" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Body */}
                <ellipse cx="20" cy="45" rx="30" ry="35" fill="#F59E0B" />
                {/* Arms */}
                <rect x="-5" y="30" width="15" height="40" rx="7" fill="#F59E0B" transform="rotate(-20 2.5 50)" />
                <rect x="35" y="30" width="15" height="40" rx="7" fill="#F59E0B" transform="rotate(20 42.5 50)" />
                {/* Legs */}
                <rect x="5" y="70" width="15" height="45" rx="7" fill="#3B82F6" />
                <rect x="25" y="70" width="15" height="45" rx="7" fill="#3B82F6" />
                {/* Laptop */}
                <rect x="-15" y="50" width="70" height="45" rx="3" fill="#1E293B" opacity="0.8" />
                <rect x="-12" y="53" width="64" height="35" rx="2" fill="#60A5FA" />
              </g>
              
              {/* Right person */}
              <g transform="translate(320, 150)">
                {/* Head */}
                <circle cx="20" cy="0" r="25" fill="#FBBF24" />
                <path d="M 10 5 Q 20 0 30 5" stroke="#78350F" strokeWidth="2" fill="none" />
                <ellipse cx="15" cy="0" rx="3" ry="4" fill="#78350F" />
                <ellipse cx="25" cy="0" rx="3" ry="4" fill="#78350F" />
                {/* Body */}
                <ellipse cx="20" cy="45" rx="30" ry="35" fill="#F59E0B" />
                {/* Arms */}
                <rect x="-5" y="30" width="15" height="40" rx="7" fill="#F59E0B" transform="rotate(-15 2.5 50)" />
                <rect x="35" y="30" width="15" height="40" rx="7" fill="#F59E0B" transform="rotate(15 42.5 50)" />
                {/* Legs */}
                <rect x="5" y="70" width="15" height="45" rx="7" fill="#3B82F6" />
                <rect x="25" y="70" width="15" height="45" rx="7" fill="#3B82F6" />
                {/* Laptop */}
                <rect x="-15" y="50" width="70" height="45" rx="3" fill="#1E293B" opacity="0.8" />
                <rect x="-12" y="53" width="64" height="35" rx="2" fill="#60A5FA" />
              </g>
              
              {/* Plant */}
              <g transform="translate(420, 260)">
                <ellipse cx="0" cy="20" rx="25" ry="18" fill="#FBBF24" opacity="0.6" />
                <path d="M -15 20 Q -15 0 -8 -15 Q 0 5 0 -20 Q 0 5 8 -15 Q 15 0 15 20" fill="#10B981" />
              </g>
              
              {/* Decorative elements */}
              <circle cx="450" cy="80" r="8" fill="#F472B6" opacity="0.7" />
              <circle cx="80" cy="100" r="6" fill="#A78BFA" opacity="0.6" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium">Hallo</p>
            <h1 className="text-3xl font-bold leading-tight">Selamat Datang</h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Bergabunglah bersama Lapak STIKOM untuk dapat bertransaksi, 
              Nikmati kemudahan berwirausaha dan memaksimalkan potensi pendapatanmu 
              dengan Lapak STIKOM!
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm h-full flex items-center">
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-full my-auto">
            {/* Logo Mobile */}
            <div className="lg:hidden mb-5 text-center">
              <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto mx-auto" />
            </div>

            {/* Header */}
            <div className="mb-5 text-center">
              <h1 className="text-3xl font-bold text-blue-500">Log In</h1>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukan email resmi stikomyos.ac.id"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    placeholder="Masukan Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link href="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                    Lupa Password?
                  </Link>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold py-3 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">atau</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Masuk dengan akun google
              </button>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-600 mt-4">
                Belum punya akun?{' '}
                <Link href="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
                  Daftar, yuk!
                </Link>
              </p>

              {/* Footer Links */}
              <p className="text-center text-xs text-gray-500 mt-3 leading-relaxed">
                Dengan log in, kamu menyetujui{' '}
                <Link href="/kebijakan-privasi" className="text-blue-500 hover:underline">
                  Kebijakan Privasi
                </Link>
                {' '}dan{' '}
                <Link href="/syarat-ketentuan" className="text-blue-500 hover:underline">
                  Syarat & Ketentuan
                </Link>
                {' '}Lapak STIKOM.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
