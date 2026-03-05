'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login, setPendingEmail, setOnboardingToken } from '@/lib/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({ email: '', password: '' });
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
        window.location.href = '/onboarding';
        return;
      }

      if (result.user) {
        if (result.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else if (result.user.role === 'UKM_OFFICIAL') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = redirectTo;
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex-col">
        {/* Star particle keyframes */}
        <style>{`
          .star{position:absolute;background:white;clip-path:polygon(50% 0%,54% 46%,100% 50%,54% 54%,50% 100%,46% 54%,0% 50%,46% 46%)}
          @keyframes starFloat1{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}35%{transform:translate(10px,-18px) rotate(45deg);opacity:.65}70%{transform:translate(-6px,10px) rotate(20deg);opacity:.85}}
          @keyframes starFloat2{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.95}30%{transform:translate(-12px,-12px) rotate(-30deg);opacity:.55}65%{transform:translate(8px,14px) rotate(60deg);opacity:.8}}
          @keyframes starFloat3{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.9}50%{transform:translate(15px,-15px) rotate(90deg);opacity:.5}}
          @keyframes starFloat4{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}40%{transform:translate(-10px,12px) rotate(-45deg);opacity:.6}80%{transform:translate(8px,-8px) rotate(30deg);opacity:.85}}
          @keyframes starFloat5{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.9}45%{transform:translate(12px,10px) rotate(75deg);opacity:.5}}
          @keyframes twinkle{0%,100%{opacity:1}50%{opacity:.4}}
        `}</style>

        {/* Star particles */}
        <div className="star" style={{top:'5%',left:'8%',width:10,height:10,animation:'starFloat1 5.5s ease-in-out infinite'}} />
        <div className="star" style={{top:'9%',left:'55%',width:9,height:9,animation:'starFloat2 7s ease-in-out infinite 0.8s'}} />
        <div className="star" style={{top:'14%',left:'78%',width:7,height:7,animation:'twinkle 2.5s ease-in-out infinite 0.3s'}} />
        <div className="star" style={{top:'18%',left:'32%',width:11,height:11,animation:'starFloat3 8s ease-in-out infinite 1.2s'}} />
        <div className="star" style={{top:'22%',left:'90%',width:8,height:8,animation:'starFloat4 6s ease-in-out infinite 2s'}} />
        <div className="star" style={{top:'27%',left:'15%',width:13,height:13,animation:'starFloat1 9s ease-in-out infinite 0.5s'}} />
        <div className="star" style={{top:'31%',left:'68%',width:7,height:7,animation:'twinkle 3s ease-in-out infinite 1.5s'}} />
        <div className="star" style={{top:'36%',left:'42%',width:10,height:10,animation:'starFloat2 6.5s ease-in-out infinite 3s'}} />
        <div className="star" style={{top:'40%',left:'3%',width:9,height:9,animation:'starFloat5 7.5s ease-in-out infinite 1s'}} />
        <div className="star" style={{top:'44%',left:'85%',width:11,height:11,animation:'starFloat4 5s ease-in-out infinite 2.5s'}} />
        <div className="star" style={{top:'50%',left:'25%',width:7,height:7,animation:'twinkle 2s ease-in-out infinite 0.7s'}} />
        <div className="star" style={{top:'55%',left:'60%',width:13,height:13,animation:'starFloat3 8.5s ease-in-out infinite 1.8s'}} />
        <div className="star" style={{top:'59%',left:'12%',width:9,height:9,animation:'starFloat1 7s ease-in-out infinite 4s'}} />
        <div className="star" style={{top:'63%',left:'48%',width:10,height:10,animation:'starFloat2 9.5s ease-in-out infinite 0.4s'}} />
        <div className="star" style={{top:'67%',left:'92%',width:7,height:7,animation:'twinkle 2.8s ease-in-out infinite 2.2s'}} />
        <div className="star" style={{top:'72%',left:'35%',width:9,height:9,animation:'starFloat5 6s ease-in-out infinite 3.5s'}} />
        <div className="star" style={{top:'76%',left:'72%',width:13,height:13,animation:'starFloat4 8s ease-in-out infinite 1.1s'}} />
        <div className="star" style={{top:'81%',left:'20%',width:7,height:7,animation:'twinkle 3.5s ease-in-out infinite 0.9s'}} />
        <div className="star" style={{top:'85%',left:'58%',width:11,height:11,animation:'starFloat1 6.5s ease-in-out infinite 2.8s'}} />
        <div className="star" style={{top:'89%',left:'82%',width:9,height:9,animation:'starFloat3 7s ease-in-out infinite 1.6s'}} />
        <div className="star" style={{top:'93%',left:'40%',width:10,height:10,animation:'starFloat2 5.5s ease-in-out infinite 3.8s'}} />
        <div className="star" style={{top:'96%',left:'6%',width:8,height:8,animation:'twinkle 4s ease-in-out infinite 0.2s'}} />
        <div className="star" style={{top:'10%',left:'45%',width:8,height:8,animation:'starFloat5 5.5s ease-in-out infinite 1.8s'}} />
        <div className="star" style={{top:'47%',left:'33%',width:9,height:9,animation:'starFloat1 8s ease-in-out infinite 2.4s'}} />
        <div className="star" style={{top:'68%',left:'5%',width:11,height:11,animation:'twinkle 3.2s ease-in-out infinite 0.6s'}} />
        <div className="star" style={{top:'90%',left:'48%',width:8,height:8,animation:'starFloat4 9s ease-in-out infinite 1.4s'}} />

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-indigo-700/40" />

        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-8 py-10">
          {/* Logo */}
          <div>
            <img
              src="/images/logo.png"
              alt="Lapak STIKOM"
              className="h-12 w-auto brightness-0 invert"
            />
          </div>

          {/* Middle illustration area */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Lottie animation */}
            <div className="w-full">
              <DotLottieReact
                src="https://lottie.host/08601f1a-326a-4121-b9ba-eb3dc4caf2f9/rxxIfC8x1A.json"
                loop
                autoplay
              />
            </div>

            {/* Welcome text */}
            <div className="space-y-3 w-full">
              <h2 className="text-3xl font-bold text-white leading-snug whitespace-nowrap">
                Selamat Datang Kembali!
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Masuk ke akun Lapak STIKOM kamu dan mulai 
                bertransaksi, berjualan, serta kelola usahamu 
                dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel – Form ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto mx-auto" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl text-center font-bold text-gray-900">Masuk ke akun</h1>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@stikomyos.ac.id"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200 mt-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Masuk...
                  </span>
                ) : 'Masuk'}
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400 font-medium">atau lanjutkan dengan</span>
                </div>
              </div>

              {/* Google */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

              {/* Register link */}
              <p className="text-center text-sm text-gray-500 pt-1">
                Belum punya akun?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Daftar sekarang
                </Link>
              </p>

              {/* Terms */}
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                Dengan masuk, kamu menyetujui{' '}
                <Link href="/kebijakan-privasi" className="text-blue-500 hover:underline">Kebijakan Privasi</Link>
                {' '}dan{' '}
                <Link href="/syarat-ketentuan" className="text-blue-500 hover:underline">Syarat & Ketentuan</Link>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
