import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function RegisterSuccessPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      {/* Icon */}
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Content */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Registrasi Berhasil!
      </h1>
      <p className="text-gray-600 mb-6">
        Kami telah mengirimkan email verifikasi ke alamat email Anda. 
        Silakan cek inbox (atau folder spam) dan klik link verifikasi untuk mengaktifkan akun.
      </p>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Langkah selanjutnya:</h3>
        <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-1">
          <li>Buka email dari Lapak STIKOM</li>
          <li>Klik tombol "Verifikasi Email"</li>
          <li>Login dan mulai bertransaksi!</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link href="/login">
          <Button className="w-full">Ke Halaman Login</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
        </Link>
      </div>

      {/* Help */}
      <p className="mt-6 text-sm text-gray-500">
        Tidak menerima email?{' '}
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          Kirim ulang
        </button>
      </p>
    </div>
  );
}
