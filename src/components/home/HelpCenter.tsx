import { RiCustomerService2Fill } from 'react-icons/ri';

export function HelpCenter() {
  return (
    <div className="bg-white rounded-2xl p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <RiCustomerService2Fill className="text-blue-500 text-xl shrink-0" />
            <p className="text-gray-600 font-semibold text-sm">
              Butuh Bantuan?{' '}
              <a href="/help" className="text-blue-400 hover:text-blue-500 transition-colors">
                Hubungi kami
              </a>
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Nikmati mudahnya jualan online di Lapak STIKOM, jelajahi produk-produk keren dari civitas akademika STIKOM Yos Sudarso Purwokerto!
          </p>
        </div>
      </div>
    </div>
  );
}
