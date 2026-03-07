'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiGet } from '@/lib/api';

interface OrderByCodeResponse {
  success: boolean;
  data?: {
    id: string;
    order_code: string;
    status: string;
  };
}

function CallbackRedirector() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      router.replace('/profile?tab=orders');
      return;
    }

    apiGet<OrderByCodeResponse>(`/orders/code/${code}`)
      .then((res) => {
        if (res.success && res.data?.id) {
          router.replace(`/orders/${res.data.id}/payment`);
        } else {
          router.replace('/profile?tab=orders');
        }
      })
      .catch(() => {
        router.replace('/orders');
      });
  }, [searchParams, router]);

  return (
    <div className="text-center px-4">
      <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm font-medium text-gray-700">Memproses pembayaran...</p>
      <p className="text-xs text-gray-400 mt-1">Kamu akan diarahkan otomatis</p>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-20">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          }
        >
          <CallbackRedirector />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
