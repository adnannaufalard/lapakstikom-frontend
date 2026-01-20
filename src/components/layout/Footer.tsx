import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Bantuan */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4 text-sm">Bantuan</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+6281234567890" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Telepon
                </a>
              </li>
              <li>
                <a href="mailto:support@lapakstikom.ac.id" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </li>
              <li>
                <Link href="/help" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Halaman Bantuan (LapakSTIKOMCare)
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Lapak STIKOM */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4 text-sm">Info Lapak STIKOM</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-400 transition-colors">
                  Tentang Lapak STIKOM
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-400 transition-colors">
                  Ketentuan & Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Brand */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-3">
              <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto" />
            </div>
            <p className="text-gray-600 text-sm text-right mb-8">
              Marketplacenya Kampus<br />STIKOM Yos Sudarso
            </p>
            <p className="text-gray-500 text-xs text-right">
              © 2025 Lapak STIKOM.<br />Semua hak dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
