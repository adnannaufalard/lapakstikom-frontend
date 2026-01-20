export function HelpCenter() {
  return (
    <div className="bg-white rounded-2xl p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Centered */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 font-semibold text-sm mb-1">
              Butuh Bantuan?{' '}
              <a href="/help" className="text-blue-400 hover:text-blue-500 transition-colors">
                Hubungi kami
              </a>
            </p>
            <p className="text-gray-500 text-sm">
              Nikmati mudahnya jualan online di Lapak STIKOM, jelajahi produk-produk keren dari civitas akademika STIKOM Yos Sudarso Purwokerto!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
