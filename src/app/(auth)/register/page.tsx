'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register, setPendingEmail } from '@/lib/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

function RegisterForm() {
  const router = useRouter();

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
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email dan password harus diisi');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return;
    }

    sessionStorage.setItem('register_email', formData.email);
    sessionStorage.setItem('register_password', formData.password);
    router.push('/onboarding');
  };

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'][passwordStrength];
  const strengthText = ['', 'text-red-500', 'text-yellow-600', 'text-green-600'][passwordStrength];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel – Form ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-10 order-2 lg:order-1">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto mx-auto" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900">Daftar akun</h1>
              <p className="text-sm text-gray-500 mt-1">
                Daftar dengan email kampus stikomyos.ac.id
              </p>
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
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
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
                    placeholder="Minimal 6 karakter"
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

                {/* Password strength */}
                {formData.password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength ? strengthColor : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthText}`}>
                      Kekuatan: {strengthLabel}
                    </p>
                  </div>
                )}
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
                    Memproses...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Lanjutkan
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
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

              {/* Links */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <p className="text-sm text-gray-500">
                  Sudah punya akun?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Masuk disini
                  </Link>
                </p>
                <Link href="/ukm/register" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  Daftar sebagai UKM
                </Link>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                Dengan mendaftar, kamu menyetujui{' '}
                <Link href="/kebijakan-privasi" className="text-blue-500 hover:underline">Kebijakan Privasi</Link>
                {' '}dan{' '}
                <Link href="/syarat-ketentuan" className="text-blue-500 hover:underline">Syarat & Ketentuan</Link>
                {' '}Lapak STIKOM.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ── Right Panel – Branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-800 flex-col order-1 lg:order-2">
        {/* Star particle keyframes */}
        <style>{`
          .rstar{position:absolute;background:white;clip-path:polygon(50% 0%,54% 46%,100% 50%,54% 54%,50% 100%,46% 54%,0% 50%,46% 46%)}
          @keyframes rStarFloat1{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}35%{transform:translate(-10px,-18px) rotate(-45deg);opacity:.65}70%{transform:translate(6px,10px) rotate(-20deg);opacity:.85}}
          @keyframes rStarFloat2{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.95}30%{transform:translate(12px,-12px) rotate(30deg);opacity:.55}65%{transform:translate(-8px,14px) rotate(-60deg);opacity:.8}}
          @keyframes rStarFloat3{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.9}50%{transform:translate(-15px,-15px) rotate(-90deg);opacity:.5}}
          @keyframes rStarFloat4{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}40%{transform:translate(10px,12px) rotate(45deg);opacity:.6}80%{transform:translate(-8px,-8px) rotate(-30deg);opacity:.85}}
          @keyframes rStarFloat5{0%,100%{transform:translate(0,0) rotate(0deg);opacity:.9}45%{transform:translate(-12px,10px) rotate(-75deg);opacity:.5}}
          @keyframes rTwinkle{0%,100%{opacity:1}50%{opacity:.4}}
        `}</style>

        {/* Star particles */}
        <div className="rstar" style={{top:'4%',left:'10%',width:10,height:10,animation:'rStarFloat1 6s ease-in-out infinite'}} />
        <div className="rstar" style={{top:'8%',left:'60%',width:8,height:8,animation:'rStarFloat2 7.5s ease-in-out infinite 0.9s'}} />
        <div className="rstar" style={{top:'13%',left:'80%',width:7,height:7,animation:'rTwinkle 2.5s ease-in-out infinite 0.4s'}} />
        <div className="rstar" style={{top:'17%',left:'28%',width:11,height:11,animation:'rStarFloat3 8.5s ease-in-out infinite 1.3s'}} />
        <div className="rstar" style={{top:'21%',left:'92%',width:8,height:8,animation:'rStarFloat4 6.5s ease-in-out infinite 2.1s'}} />
        <div className="rstar" style={{top:'26%',left:'18%',width:13,height:13,animation:'rStarFloat1 9s ease-in-out infinite 0.6s'}} />
        <div className="rstar" style={{top:'30%',left:'70%',width:7,height:7,animation:'rTwinkle 3s ease-in-out infinite 1.6s'}} />
        <div className="rstar" style={{top:'35%',left:'44%',width:10,height:10,animation:'rStarFloat2 7s ease-in-out infinite 3.1s'}} />
        <div className="rstar" style={{top:'39%',left:'5%',width:9,height:9,animation:'rStarFloat5 8s ease-in-out infinite 1.1s'}} />
        <div className="rstar" style={{top:'43%',left:'87%',width:11,height:11,animation:'rStarFloat4 5.5s ease-in-out infinite 2.6s'}} />
        <div className="rstar" style={{top:'48%',left:'22%',width:7,height:7,animation:'rTwinkle 2.2s ease-in-out infinite 0.8s'}} />
        <div className="rstar" style={{top:'53%',left:'62%',width:13,height:13,animation:'rStarFloat3 9s ease-in-out infinite 1.9s'}} />
        <div className="rstar" style={{top:'57%',left:'14%',width:9,height:9,animation:'rStarFloat1 7.5s ease-in-out infinite 4.1s'}} />
        <div className="rstar" style={{top:'61%',left:'50%',width:10,height:10,animation:'rStarFloat2 10s ease-in-out infinite 0.5s'}} />
        <div className="rstar" style={{top:'65%',left:'94%',width:7,height:7,animation:'rTwinkle 3s ease-in-out infinite 2.3s'}} />
        <div className="rstar" style={{top:'70%',left:'37%',width:9,height:9,animation:'rStarFloat5 6.5s ease-in-out infinite 3.6s'}} />
        <div className="rstar" style={{top:'74%',left:'76%',width:13,height:13,animation:'rStarFloat4 8.5s ease-in-out infinite 1.2s'}} />
        <div className="rstar" style={{top:'79%',left:'22%',width:7,height:7,animation:'rTwinkle 3.8s ease-in-out infinite 1.0s'}} />
        <div className="rstar" style={{top:'83%',left:'55%',width:11,height:11,animation:'rStarFloat1 7s ease-in-out infinite 2.9s'}} />
        <div className="rstar" style={{top:'87%',left:'84%',width:9,height:9,animation:'rStarFloat3 7.5s ease-in-out infinite 1.7s'}} />
        <div className="rstar" style={{top:'91%',left:'38%',width:10,height:10,animation:'rStarFloat2 6s ease-in-out infinite 3.9s'}} />
        <div className="rstar" style={{top:'95%',left:'8%',width:8,height:8,animation:'rTwinkle 4.2s ease-in-out infinite 0.3s'}} />
        <div className="rstar" style={{top:'11%',left:'48%',width:8,height:8,animation:'rStarFloat5 5.5s ease-in-out infinite 1.8s'}} />
        <div className="rstar" style={{top:'46%',left:'33%',width:9,height:9,animation:'rStarFloat1 8s ease-in-out infinite 2.4s'}} />
        <div className="rstar" style={{top:'66%',left:'6%',width:11,height:11,animation:'rTwinkle 3.2s ease-in-out infinite 0.6s'}} />
        <div className="rstar" style={{top:'88%',left:'46%',width:8,height:8,animation:'rStarFloat4 9s ease-in-out infinite 1.4s'}} />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full bg-blue-700/40" />

        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-8 py-10">
          {/* Logo top right */}
          <div className="flex justify-end">
            <img
              src="/images/logo.png"
              alt="Lapak STIKOM"
              className="h-12 w-auto brightness-0 invert"
            />
          </div>

          {/* Middle */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Lottie animation */}
            <div className="w-full">
              <DotLottieReact
                src="https://lottie.host/ee42cbc6-292a-49a3-b9d1-27e97ec88d38/7UcOobEzmg.lottie"
                loop
                autoplay
              />
            </div>

            {/* Welcome text */}
            <div className="space-y-3 w-full text-right">
              <h2 className="text-3xl font-bold text-white leading-snug whitespace-nowrap">
                Bergabung bersama kami! 🚀
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Daftarkan dirimu dan mulai jelajahi produk 
                dari Civitas Akademika STIKOM. Berjualan, berwirausaha, 
                dan raih peluangmu!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
