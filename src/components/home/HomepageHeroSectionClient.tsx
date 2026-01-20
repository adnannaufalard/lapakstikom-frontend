'use client';

import { HeroCarousel, AnnouncementBanner } from '@/components/home';
import { Banner, Announcement } from '@/lib/homepage';

interface HomepageHeroSectionClientProps {
  banners: Banner[];
  announcements: Announcement[];
}

export function HomepageHeroSectionClient({ banners, announcements }: HomepageHeroSectionClientProps) {
  // Filter only HERO banners for carousel
  const heroBanners = banners.filter(b => b.banner_type === 'HERO');

  return (
    <div>
      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AnnouncementBanner announcements={announcements} />
          </div>
        </section>
      )}

      {/* Hero Carousel Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HeroCarousel banners={heroBanners} />
        </div>
      </section>
    </div>
  );
}
