'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroCarousel, AnnouncementBanner } from '@/components/home';
import { Banner, Announcement, getActiveBanners, getActiveAnnouncements } from '@/lib/homepage';

export function HomepageHeroSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, announcementsData] = await Promise.all([
          getActiveBanners(),
          getActiveAnnouncements(),
        ]);
        
        console.log('Fetched banners:', bannersData);
        console.log('Banner types:', bannersData.map(b => ({ id: b.id, title: b.title, type: b.banner_type })));
        console.log('Fetched announcements:', announcementsData);
        
        // Filter only HERO banners for carousel
        const heroBanners = bannersData.filter(b => {
          console.log(`Checking banner: ${b.title}, type: "${b.banner_type}", isHero: ${b.banner_type === 'HERO'}`);
          return b.banner_type === 'HERO';
        });
        console.log('Hero banners:', heroBanners);
        
        setBanners(heroBanners);
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Failed to fetch homepage content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        {/* Announcements skeleton */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </section>

        {/* Hero carousel skeleton */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ paddingBottom: '32.31%' }} />
          </div>
        </section>
      </div>
    );
  }

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
          <HeroCarousel banners={banners} />
        </div>
      </section>
    </div>
  );
}
