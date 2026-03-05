'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Banner } from '@/lib/homepage';

interface HeroCarouselProps {
  banners?: Banner[];
}

export function HeroCarousel({ banners = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default banners if none provided - use static date to prevent hydration mismatch
  const defaultBanners: Banner[] = [
    {
      id: '1',
      title: 'Selamat Datang di Lapak STIKOM',
      description: 'Platform marketplace untuk mahasiswa STIKOM Yos Sudarso',
      image_url: 'https://placehold.co/1368x442/3b82f6/ffffff?text=Selamat+Datang+di+Lapak+STIKOM',
      link_url: '/products',
      banner_type: 'HERO',
      display_order: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Produk UKM',
      description: 'Dukung produk lokal dari UKM STIKOM',
      image_url: 'https://placehold.co/1368x442/8b5cf6/ffffff?text=Produk+UKM+STIKOM',
      link_url: '/products?seller=ukm',
      banner_type: 'HERO',
      display_order: 2,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '3',
      title: 'Jual Produkmu',
      description: 'Daftar sebagai seller dan mulai berjualan',
      image_url: 'https://placehold.co/1368x442/ec4899/ffffff?text=Mulai+Berjualan',
      link_url: '/ukm/register',
      banner_type: 'HERO',
      display_order: 3,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  const slides = banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full bg-white overflow-hidden group">
      {/* Aspect ratio container 1368:442 */}
      <div className="relative w-full" style={{ paddingBottom: '32.31%' }}>
        {/* Slide track — translateX-based sliding animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${(currentSlide * 100) / slides.length}%)`,
            }}
          >
            {slides.map((banner) => {
              const slideContent = (
                <>
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    loading="eager"
                    draggable="false"
                  />
                  {banner.description && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-8 pointer-events-none">
                      <div className="text-white max-w-2xl">
                        <h2 className="text-3xl font-bold mb-2">{banner.title}</h2>
                        <p className="text-lg text-white/90">{banner.description}</p>
                      </div>
                    </div>
                  )}
                </>
              );

              const slideStyle = { width: `${100 / slides.length}%` };
              const slideClass = 'relative flex-shrink-0 h-full';

              return banner.link_url ? (
                <Link
                  key={banner.id}
                  href={banner.link_url}
                  style={slideStyle}
                  className={slideClass}
                >
                  {slideContent}
                </Link>
              ) : (
                <div
                  key={banner.id}
                  style={slideStyle}
                  className={slideClass}
                >
                  {slideContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
