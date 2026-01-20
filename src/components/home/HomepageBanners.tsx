'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Banner, getActiveBanners } from '@/lib/homepage';

export function HomepageBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await getActiveBanners();
        console.log('All banners fetched:', data);
        
        // Filter only promo banners (not HERO type)
        const promoBanners = data.filter(b => b.banner_type !== 'HERO');
        console.log('Promo banners:', promoBanners);
        
        setBanners(promoBanners);
      } catch (error) {
        console.error('Failed to fetch promo banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ paddingBottom: '22.66%' }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="w-full rounded-2xl bg-gray-200 animate-pulse aspect-square" />
            <div className="grid grid-cols-2 gap-5">
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse aspect-square" />
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse aspect-square" />
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse aspect-square" />
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse aspect-square" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Group banners by type
  const promoFull = banners.filter(b => b.banner_type === 'PROMO_FULL');
  const promoLarge = banners.filter(b => b.banner_type === 'PROMO_LARGE');
  const promoSmall = banners.filter(b => b.banner_type === 'PROMO_SMALL');

  if (banners.length === 0) {
    return null; // Hide section if no promo banners
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Full Width Promo Banners */}
        {promoFull.map((banner) => (
          <Link key={banner.id} href={banner.link_url || '#'} className="block group">
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingBottom: '22.66%' }}>
              <img
                src={banner.image_url}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
        ))}

        {/* Large + Grid Layout */}
        {(promoLarge.length > 0 || promoSmall.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Large Square Banner */}
            {promoLarge.slice(0, 1).map((banner) => (
              <Link key={banner.id} href={banner.link_url || '#'} className="block group">
                <div className="relative w-full rounded-2xl overflow-hidden aspect-square">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            ))}

            {/* 2x2 Grid Small Banners */}
            {promoSmall.length > 0 && (
              <div className="grid grid-cols-2 gap-5">
                {promoSmall.slice(0, 4).map((banner) => (
                  <Link key={banner.id} href={banner.link_url || '#'} className="group">
                    <div className="relative w-full rounded-2xl overflow-hidden aspect-square">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
